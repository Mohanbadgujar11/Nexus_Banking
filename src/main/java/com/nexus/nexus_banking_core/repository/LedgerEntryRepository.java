package com.nexus.nexus_banking_core.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.nexus.nexus_banking_core.model.Account;
import com.nexus.nexus_banking_core.model.LedgerEntry;
import com.nexus.nexus_banking_core.model.Transaction;

@Repository
public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, Long> {

    List<LedgerEntry> findByTransaction(Transaction transaction);

    List<LedgerEntry> findByAccountOrderByCreatedAtDesc(Account account);

    @Query("SELECT le FROM LedgerEntry le WHERE le.account.accountNumber = :accountNumber ORDER BY le.createdAt DESC")
    List<LedgerEntry> findByAccountNumberOrderByCreatedAtDesc(@Param("accountNumber") String accountNumber);

    List<LedgerEntry> findAllByOrderByCreatedAtDesc();
}

