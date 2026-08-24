package com.nexus.nexus_banking_core.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.nexus.nexus_banking_core.model.AuditLog;
import com.nexus.nexus_banking_core.model.User;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByActorUserOrderByCreatedAtDesc(User actorUser);

    List<AuditLog> findByResourceTypeAndResourceIdOrderByCreatedAtDesc(String resourceType, String resourceId);

    List<AuditLog> findAllByOrderByCreatedAtDesc();
}

