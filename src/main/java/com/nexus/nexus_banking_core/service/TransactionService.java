package com.nexus.nexus_banking_core.service;

import java.util.List;

import com.nexus.nexus_banking_core.dto.DepositRequest;
import com.nexus.nexus_banking_core.dto.TransactionResponse;
import com.nexus.nexus_banking_core.dto.TransferRequest;

public interface TransactionService {

    TransactionResponse transferFunds(TransferRequest request);

    TransactionResponse depositFunds(DepositRequest request);

    List<TransactionResponse> getTransactionsForAccount(String accountNumber);

    List<TransactionResponse> getAllTransactions();
}

