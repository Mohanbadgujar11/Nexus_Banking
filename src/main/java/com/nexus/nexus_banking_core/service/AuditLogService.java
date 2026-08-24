package com.nexus.nexus_banking_core.service;

import java.util.List;

import com.nexus.nexus_banking_core.dto.AuditLogResponse;

public interface AuditLogService {
    List<AuditLogResponse> getLogsByUserId(Long userId);
    List<AuditLogResponse> getAllLogs();
}

