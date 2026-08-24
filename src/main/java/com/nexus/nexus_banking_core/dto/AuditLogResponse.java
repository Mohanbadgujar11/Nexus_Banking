package com.nexus.nexus_banking_core.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponse {
    private Long id;
    private String action;
    private String resourceType;
    private String resourceId;
    private String ipAddress;
    private String sha256Fingerprint;
    private LocalDateTime createdAt;
}

