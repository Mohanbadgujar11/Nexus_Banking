package com.nexus.nexus_banking_core.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.nexus.nexus_banking_core.model.Account;
import com.nexus.nexus_banking_core.model.User;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {

    Optional<Account> findByAccountNumber(String accountNumber);

    boolean existsByAccountNumber(String accountNumber);

    List<Account> findByUser(User user);

    List<Account> findByUserId(Long userId);

    @Query("SELECT a FROM Account a WHERE a.user.id = :userId AND a.accountType = 'CHECKING' AND a.isDeleted = false")
    Optional<Account> findPrimaryCheckingAccountByUserId(@Param("userId") Long userId);

    @Query("SELECT a FROM Account a WHERE " +
           "(LOWER(a.accountNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(a.user.username) LIKE LOWER(CONCAT('%', :query, '%'))) AND a.isDeleted = false")
    List<Account> searchAccounts(@Param("query") String query);
}

