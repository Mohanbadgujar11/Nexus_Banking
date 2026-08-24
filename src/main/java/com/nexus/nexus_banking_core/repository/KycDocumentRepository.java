package com.nexus.nexus_banking_core.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.nexus.nexus_banking_core.model.KycDocument;
import com.nexus.nexus_banking_core.model.User;

@Repository
public interface KycDocumentRepository extends JpaRepository<KycDocument, Long> {

    List<KycDocument> findByUser(User user);

    List<KycDocument> findByUserId(Long userId);

    List<KycDocument> findByVerificationStatus(String verificationStatus);
}

