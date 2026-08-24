package com.nexus.nexus_banking_core.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.nexus.nexus_banking_core.model.Address;
import com.nexus.nexus_banking_core.model.User;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {

    List<Address> findByUser(User user);

    List<Address> findByUserId(Long userId);

    Optional<Address> findByUserIdAndIsPrimaryTrue(Long userId);
}

