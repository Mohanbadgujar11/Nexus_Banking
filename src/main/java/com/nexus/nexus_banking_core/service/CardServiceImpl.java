package com.nexus.nexus_banking_core.service;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nexus.nexus_banking_core.dto.CardChannelsRequest;
import com.nexus.nexus_banking_core.dto.CardLimitsRequest;
import com.nexus.nexus_banking_core.dto.CardResponse;
import com.nexus.nexus_banking_core.dto.IssueCardRequest;
import com.nexus.nexus_banking_core.exception.InvalidCredentialsException;
import com.nexus.nexus_banking_core.model.Account;
import com.nexus.nexus_banking_core.model.AuditLog;
import com.nexus.nexus_banking_core.model.Card;
import com.nexus.nexus_banking_core.model.User;
import com.nexus.nexus_banking_core.repository.AccountRepository;
import com.nexus.nexus_banking_core.repository.AuditLogRepository;
import com.nexus.nexus_banking_core.repository.CardRepository;
import com.nexus.nexus_banking_core.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class CardServiceImpl implements CardService {

    private final CardRepository cardRepository;
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    @Transactional(readOnly = true)
    public List<CardResponse> getCardsByUserId(Long userId) {
        return cardRepository.findByUserIdAndIsDeletedFalse(userId).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CardResponse toggleFreezeCard(Long cardId) {
        Card card = cardRepository.findById(cardId)
            .orElseThrow(() -> new InvalidCredentialsException("Card with ID " + cardId + " not found"));

        boolean newFrozenState = !Boolean.TRUE.equals(card.getIsFrozen());
        card.setIsFrozen(newFrozenState);
        card.setStatus(newFrozenState ? "FROZEN" : "ACTIVE");
        Card updated = cardRepository.save(card);

        // Audit Log
        AuditLog auditLog = AuditLog.builder()
            .actorUser(card.getUser())
            .action(newFrozenState ? "CARD_FROZEN" : "CARD_UNFROZEN")
            .resourceType("CARDS")
            .resourceId(String.valueOf(card.getId()))
            .ipAddress("127.0.0.1")
            .sha256Fingerprint("SHA256-CARD-FRZ-" + card.getId() + "-" + System.currentTimeMillis())
            .build();
        auditLogRepository.save(auditLog);

        log.info("Updated card {} freeze status to {}", cardId, newFrozenState);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public CardResponse updateCardLimits(Long cardId, CardLimitsRequest request) {
        Card card = cardRepository.findById(cardId)
            .orElseThrow(() -> new InvalidCredentialsException("Card with ID " + cardId + " not found"));

        if (request.getMonthlyLimit() != null && request.getMonthlyLimit().compareTo(BigDecimal.ZERO) > 0) {
            card.setSpendingLimitMonthly(request.getMonthlyLimit());
        }
        if (request.getDailyAtmLimit() != null && request.getDailyAtmLimit().compareTo(BigDecimal.ZERO) > 0) {
            card.setAtmWithdrawalLimitDaily(request.getDailyAtmLimit());
        }

        Card updated = cardRepository.save(card);

        AuditLog auditLog = AuditLog.builder()
            .actorUser(card.getUser())
            .action("CARD_LIMITS_UPDATED")
            .resourceType("CARDS")
            .resourceId(String.valueOf(card.getId()))
            .ipAddress("127.0.0.1")
            .sha256Fingerprint("SHA256-CARD-LMT-" + card.getId() + "-" + System.currentTimeMillis())
            .build();
        auditLogRepository.save(auditLog);

        log.info("Updated limits on card {}: monthly={}, dailyATM={}", cardId, card.getSpendingLimitMonthly(), card.getAtmWithdrawalLimitDaily());
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public CardResponse updateCardChannels(Long cardId, CardChannelsRequest request) {
        Card card = cardRepository.findById(cardId)
            .orElseThrow(() -> new InvalidCredentialsException("Card with ID " + cardId + " not found"));

        if (request.getIsContactlessEnabled() != null) {
            card.setIsContactlessEnabled(request.getIsContactlessEnabled());
        }
        if (request.getIsInternationalEnabled() != null) {
            card.setIsInternationalEnabled(request.getIsInternationalEnabled());
        }

        Card updated = cardRepository.save(card);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public CardResponse issueCard(IssueCardRequest request) {
        User user = userRepository.findById(request.getUserId())
            .orElseThrow(() -> new InvalidCredentialsException("User with ID " + request.getUserId() + " not found"));

        Account account;
        if (request.getAccountNumber() != null && !request.getAccountNumber().isBlank()) {
            account = accountRepository.findByAccountNumber(request.getAccountNumber().trim())
                .orElseThrow(() -> new InvalidCredentialsException("Account not found"));
        } else {
            account = accountRepository.findPrimaryCheckingAccountByUserId(user.getId())
                .orElseThrow(() -> new InvalidCredentialsException("Primary account not found for user"));
        }

        String cardType = request.getCardType() != null ? request.getCardType() : "VIRTUAL_DISPOSABLE";
        int randomLast4 = 1000 + secureRandom.nextInt(9000);
        int randomMid4 = 1000 + secureRandom.nextInt(9000);
        String prefix = cardType.contains("VIRTUAL") ? "4290" : "4829";
        String cardMasked = prefix + " •••• •••• " + randomLast4;
        String tokenHash = "TKN-" + prefix + randomMid4 + randomLast4 + "-" + System.currentTimeMillis();

        BigDecimal monthlyLimit = request.getMonthlyLimit() != null ? request.getMonthlyLimit() : new BigDecimal("5000.0000");
        BigDecimal dailyAtmLimit = request.getDailyAtmLimit() != null ? request.getDailyAtmLimit() : new BigDecimal("1000.0000");

        String holderName = user.getFullName() != null && !user.getFullName().isBlank()
            ? user.getFullName().toUpperCase()
            : user.getUsername().toUpperCase();

        Card newCard = Card.builder()
            .cardNumberMasked(cardMasked)
            .cardTokenHash(tokenHash)
            .account(account)
            .user(user)
            .cardholderName(holderName)
            .cardType(cardType)
            .expirationDate("09/29")
            .cvvHash(passwordEncoder.encode(String.valueOf(100 + secureRandom.nextInt(900))))
            .spendingLimitMonthly(monthlyLimit)
            .atmWithdrawalLimitDaily(dailyAtmLimit)
            .isFrozen(false)
            .isContactlessEnabled(true)
            .isInternationalEnabled(cardType.contains("TITANIUM"))
            .status("ACTIVE")
            .isDeleted(false)
            .build();

        Card savedCard = cardRepository.save(newCard);

        AuditLog auditLog = AuditLog.builder()
            .actorUser(user)
            .action("CARD_ISSUED_" + cardType)
            .resourceType("CARDS")
            .resourceId(String.valueOf(savedCard.getId()))
            .ipAddress("127.0.0.1")
            .sha256Fingerprint("SHA256-CARD-ISSUE-" + savedCard.getId() + "-" + System.currentTimeMillis())
            .build();
        auditLogRepository.save(auditLog);

        log.info("Issued new {} card {} for user {}", cardType, cardMasked, user.getUsername());
        return mapToResponse(savedCard);
    }

    private CardResponse mapToResponse(Card card) {
        return CardResponse.builder()
            .id(card.getId())
            .cardNumberMasked(card.getCardNumberMasked())
            .cardTokenHash(card.getCardTokenHash())
            .cardholderName(card.getCardholderName())
            .cardType(card.getCardType())
            .expirationDate(card.getExpirationDate())
            .spendingLimitMonthly(card.getSpendingLimitMonthly())
            .atmWithdrawalLimitDaily(card.getAtmWithdrawalLimitDaily())
            .isFrozen(card.getIsFrozen())
            .isContactlessEnabled(card.getIsContactlessEnabled())
            .isInternationalEnabled(card.getIsInternationalEnabled())
            .status(card.getStatus())
            .accountNumber(card.getAccount() != null ? card.getAccount().getAccountNumber() : "NX-CORE")
            .createdAt(card.getCreatedAt())
            .build();
    }
}

