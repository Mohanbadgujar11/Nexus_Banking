package com.nexus.nexus_banking_core.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nexus.nexus_banking_core.dto.ApiResponse;
import com.nexus.nexus_banking_core.dto.TransactionResponse;
import com.nexus.nexus_banking_core.dto.TransferRequest;
import com.nexus.nexus_banking_core.service.TransactionService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping({"/transfers", "/transactions/transfer"})
    public ResponseEntity<ApiResponse<TransactionResponse>> executeTransfer(@Valid @RequestBody TransferRequest request) {
        TransactionResponse response = transactionService.transferFunds(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Transfer executed and committed to core ledger successfully", response));
    }

    @GetMapping({"/transactions/account/{accountNumber}", "/accounts/{accountNumber}/transactions"})
    public ResponseEntity<ApiResponse<List<TransactionResponse>>> getAccountTransactions(@PathVariable String accountNumber) {
        List<TransactionResponse> transactions = transactionService.getTransactionsForAccount(accountNumber);
        return ResponseEntity.ok(ApiResponse.success("Transaction history retrieved successfully", transactions));
    }

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<List<TransactionResponse>>> getAllTransactions() {
        List<TransactionResponse> transactions = transactionService.getAllTransactions();
        return ResponseEntity.ok(ApiResponse.success("All transactions retrieved successfully", transactions));
    }
}
