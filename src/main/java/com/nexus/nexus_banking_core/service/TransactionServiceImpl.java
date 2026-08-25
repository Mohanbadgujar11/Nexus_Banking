package com.nexus.nexus_banking_core.service;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nexus.nexus_banking_core.dto.DepositRequest;
import com.nexus.nexus_banking_core.dto.TransactionResponse;
import com.nexus.nexus_banking_core.dto.TransferRequest;
import com.nexus.nexus_banking_core.exception.InvalidCredentialsException;
import com.nexus.nexus_banking_core.model.Account;
import com.nexus.nexus_banking_core.model.AuditLog;
import com.nexus.nexus_banking_core.model.LedgerEntry;
import com.nexus.nexus_banking_core.model.Transaction;
import com.nexus.nexus_banking_core.model.User;
import com.nexus.nexus_banking_core.repository.AccountRepository;
import com.nexus.nexus_banking_core.repository.AuditLogRepository;
import com.nexus.nexus_banking_core.repository.LedgerEntryRepository;
import com.nexus.nexus_banking_core.repository.TransactionRepository;
import com.nexus.nexus_banking_core.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionServiceImpl implements TransactionService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    @Transactional
    public TransactionResponse transferFunds(TransferRequest request) {
        BigDecimal amount = request.getAmount();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Transfer amount must be strictly greater than zero");
        }

        Account senderAccount = accountRepository.findByAccountNumber(request.getSenderAccountNumber().trim())
            .orElseThrow(() -> new InvalidCredentialsException("Sender account '" + request.getSenderAccountNumber() + "' not found"));

        // 0. Validate Sender 6-Digit Security PIN
        User senderUser = senderAccount.getUser();
        if (senderUser != null) {
            if (senderUser.getTransactionPinHash() != null && !senderUser.getTransactionPinHash().isBlank()) {
                if (request.getPin() == null || request.getPin().isBlank()) {
                    throw new InvalidCredentialsException("6-digit security PIN is required for transfer authorization");
                }
                if (!passwordEncoder.matches(request.getPin().trim(), senderUser.getTransactionPinHash())) {
                    throw new InvalidCredentialsException("Invalid 6-digit security PIN. Transfer authorization failed.");
                }
            } else {
                throw new InvalidCredentialsException("Security PIN required. Please configure your 6-digit security PIN in your Profile before initiating transfers.");
            }
        }

        // Beneficiary lookup: check account number or username
        String receiverIdentifier = request.getReceiverAccountNumber().trim();
        Account receiverAccount = accountRepository.findByAccountNumber(receiverIdentifier)
            .or(() -> userRepository.findByIdentifier(receiverIdentifier)
                .flatMap(u -> accountRepository.findPrimaryCheckingAccountByUserId(u.getId())))
            .orElseThrow(() -> new InvalidCredentialsException("Beneficiary account or user '" + receiverIdentifier + "' not found"));

        if (senderAccount.getId().equals(receiverAccount.getId())) {
            throw new IllegalArgumentException("Cannot transfer funds to the same account");
        }

        if (senderAccount.getBalance().compareTo(amount) < 0) {
            throw new IllegalArgumentException("Insufficient funds. Available balance: $" + senderAccount.getBalance());
        }

        // 1. Atomic Balance Update
        senderAccount.setBalance(senderAccount.getBalance().subtract(amount));
        senderAccount.setAvailableBalance(senderAccount.getAvailableBalance().subtract(amount));

        receiverAccount.setBalance(receiverAccount.getBalance().add(amount));
        receiverAccount.setAvailableBalance(receiverAccount.getAvailableBalance().add(amount));

        accountRepository.save(senderAccount);
        accountRepository.save(receiverAccount);

        // 2. Master Transaction Record
        String ref = generateTransactionReference();
        String memo = request.getMemo() != null && !request.getMemo().isBlank()
            ? request.getMemo().trim()
            : "Transfer to " + receiverAccount.getAccountNumber();

        Transaction masterTx = Transaction.builder()
            .transactionReference(ref)
            .channel("WEB")
            .type("P2P_TRANSFER")
            .amount(amount)
            .totalAmount(amount)
            .senderAccountNumber(senderAccount.getAccountNumber())
            .receiverAccountNumber(receiverAccount.getAccountNumber())
            .currency("USD")
            .status("SETTLED")
            .initiatedByUser(senderAccount.getUser())
            .description(memo)
            .build();
        Transaction savedTx = transactionRepository.save(masterTx);

        // 3. Double-Entry Granular Ledger Entries (Debit Sender, Credit Receiver)
        LedgerEntry debitEntry = LedgerEntry.builder()
            .transaction(savedTx)
            .account(senderAccount)
            .entryType("DEBIT")
            .amount(amount)
            .balanceAfter(senderAccount.getBalance())
            .build();

        LedgerEntry creditEntry = LedgerEntry.builder()
            .transaction(savedTx)
            .account(receiverAccount)
            .entryType("CREDIT")
            .amount(amount)
            .balanceAfter(receiverAccount.getBalance())
            .build();

        ledgerEntryRepository.save(debitEntry);
        ledgerEntryRepository.save(creditEntry);

        // 4. Audit Log
        AuditLog auditLog = AuditLog.builder()
            .actorUser(senderAccount.getUser())
            .action("TRANSFER_EXECUTED")
            .resourceType("TRANSACTIONS")
            .resourceId(ref)
            .ipAddress("127.0.0.1")
            .sha256Fingerprint("SHA256-TX-" + ref + "-" + System.currentTimeMillis())
            .build();
        auditLogRepository.save(auditLog);

        log.info("Committed double-entry transfer of ${} from {} to {} (Ref: {})", amount, senderAccount.getAccountNumber(), receiverAccount.getAccountNumber(), ref);
        return mapToTransactionResponse(savedTx, senderAccount.getAccountNumber(), receiverAccount.getAccountNumber(), "DEBIT");
    }

    @Override
    @Transactional
    public TransactionResponse depositFunds(DepositRequest request) {
        BigDecimal amount = request.getAmount();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Deposit amount must be strictly greater than zero");
        }

        String identifier = request.getAccountNumber().trim();
        Account targetAccount = accountRepository.findByAccountNumber(identifier)
            .or(() -> userRepository.findByIdentifier(identifier)
                .flatMap(u -> accountRepository.findPrimaryCheckingAccountByUserId(u.getId())))
            .orElseThrow(() -> new InvalidCredentialsException("Account with identifier '" + identifier + "' not found"));

        targetAccount.setBalance(targetAccount.getBalance().add(amount));
        targetAccount.setAvailableBalance(targetAccount.getAvailableBalance().add(amount));
        accountRepository.save(targetAccount);

        String ref = generateTransactionReference();
        String memo = request.getMemo() != null && !request.getMemo().isBlank()
            ? request.getMemo().trim()
            : "Admin Capital Deposit";

        // Master Transaction Record
        Transaction masterTx = Transaction.builder()
            .transactionReference(ref)
            .channel("ADMIN_PORTAL")
            .type("DEPOSIT")
            .amount(amount)
            .totalAmount(amount)
            .senderAccountNumber("TREASURY")
            .receiverAccountNumber(targetAccount.getAccountNumber())
            .currency("USD")
            .status("SETTLED")
            .initiatedByUser(targetAccount.getUser())
            .description(memo)
            .build();
        Transaction savedTx = transactionRepository.save(masterTx);

        // Double-Entry Ledger Entry (Credit Target Account)
        LedgerEntry creditEntry = LedgerEntry.builder()
            .transaction(savedTx)
            .account(targetAccount)
            .entryType("CREDIT")
            .amount(amount)
            .balanceAfter(targetAccount.getBalance())
            .build();
        ledgerEntryRepository.save(creditEntry);

        // Audit Log
        AuditLog auditLog = AuditLog.builder()
            .actorUser(targetAccount.getUser())
            .action("ADMIN_DEPOSIT_EXECUTED")
            .resourceType("TRANSACTIONS")
            .resourceId(ref)
            .ipAddress("127.0.0.1")
            .sha256Fingerprint("SHA256-DEP-" + ref + "-" + System.currentTimeMillis())
            .build();
        auditLogRepository.save(auditLog);

        log.info("Admin deposited ${} into account {} (Ref: {})", amount, targetAccount.getAccountNumber(), ref);
        return mapToTransactionResponse(savedTx, "TREASURY", targetAccount.getAccountNumber(), "CREDIT");
    }

    @Override
    @Transactional(readOnly = true)
    public List<TransactionResponse> getTransactionsForAccount(String accountNumber) {
        return ledgerEntryRepository.findByAccountNumberOrderByCreatedAtDesc(accountNumber.trim()).stream()
            .map((entry) -> TransactionResponse.builder()
                .id(entry.getId())
                .transactionReference(entry.getTransaction().getTransactionReference())
                .senderAccountNumber(entry.getEntryType().equals("DEBIT") ? entry.getAccount().getAccountNumber() : "SENDER")
                .receiverAccountNumber(entry.getEntryType().equals("CREDIT") ? entry.getAccount().getAccountNumber() : "BENEFICIARY")
                .amount(entry.getAmount())
                .type(entry.getEntryType().equals("CREDIT") ? "TRANSFER_CREDIT" : "TRANSFER_DEBIT")
                .description(entry.getTransaction().getDescription())
                .status(entry.getTransaction().getStatus())
                .createdAt(entry.getCreatedAt())
                .build())
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TransactionResponse> getAllTransactions() {
        return transactionRepository.findAllByOrderByCreatedAtDesc().stream()
            .map((tx) -> TransactionResponse.builder()
                .id(tx.getId())
                .transactionReference(tx.getTransactionReference())
                .senderAccountNumber(tx.getSenderAccountNumber() != null ? tx.getSenderAccountNumber() : "CORE")
                .receiverAccountNumber(tx.getReceiverAccountNumber() != null ? tx.getReceiverAccountNumber() : "CORE")
                .amount(tx.getTotalAmount() != null ? tx.getTotalAmount() : tx.getAmount())
                .type(tx.getType())
                .description(tx.getDescription())
                .status(tx.getStatus())
                .createdAt(tx.getCreatedAt())
                .build())
            .collect(Collectors.toList());
    }

    private String generateTransactionReference() {
        long num = 10000000L + (long) (secureRandom.nextDouble() * 89999999L);
        return "TXN-" + num;
    }

    private TransactionResponse mapToTransactionResponse(Transaction tx, String sender, String receiver, String entryType) {
        BigDecimal amt = tx.getTotalAmount() != null ? tx.getTotalAmount() : tx.getAmount();
        return TransactionResponse.builder()
            .id(tx.getId())
            .transactionReference(tx.getTransactionReference())
            .senderAccountNumber(sender)
            .receiverAccountNumber(receiver)
            .amount(amt)
            .type(entryType.equals("CREDIT") ? "TRANSFER_CREDIT" : "TRANSFER_DEBIT")
            .description(tx.getDescription())
            .status(tx.getStatus())
            .createdAt(tx.getCreatedAt())
            .build();
    }
}
