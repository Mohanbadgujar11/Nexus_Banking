package com.nexus.nexus_banking_core.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.nexus.nexus_banking_core.model.Account;
import com.nexus.nexus_banking_core.model.AccountMetadata;

@Repository
public interface AccountMetadataRepository extends JpaRepository<AccountMetadata, Long> {

    Optional<AccountMetadata> findByAccount(Account account);

    Optional<AccountMetadata> findByAccountId(Long accountId);
}

