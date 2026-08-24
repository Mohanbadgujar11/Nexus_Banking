package com.nexus.nexus_banking_core.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.nexus.nexus_banking_core.model.CustomerProfile;
import com.nexus.nexus_banking_core.model.User;

@Repository
public interface CustomerProfileRepository extends JpaRepository<CustomerProfile, Long> {

    Optional<CustomerProfile> findByUser(User user);

    Optional<CustomerProfile> findByUserId(Long userId);

    boolean existsByPhoneNumber(String phoneNumber);
}

