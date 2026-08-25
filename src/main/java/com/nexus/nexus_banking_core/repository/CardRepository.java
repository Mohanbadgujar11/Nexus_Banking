package com.nexus.nexus_banking_core.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.nexus.nexus_banking_core.model.Account;
import com.nexus.nexus_banking_core.model.Card;
import com.nexus.nexus_banking_core.model.User;

@Repository
public interface CardRepository extends JpaRepository<Card, Long> {

    Optional<Card> findByCardTokenHash(String cardTokenHash);

    List<Card> findByUserAndIsDeletedFalse(User user);

    List<Card> findByUserIdAndIsDeletedFalse(Long userId);

    List<Card> findByUserId(Long userId);

    List<Card> findByAccountAndIsDeletedFalse(Account account);
}

