package com.nexus.nexus_banking_core.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nexus.nexus_banking_core.dto.ApiResponse;
import com.nexus.nexus_banking_core.dto.AuditLogResponse;
import com.nexus.nexus_banking_core.service.AuditLogService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> getLogsByUserId(@PathVariable Long userId) {
        List<AuditLogResponse> logs = auditLogService.getLogsByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success("Audit logs retrieved successfully", logs));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> getAllLogs() {
        List<AuditLogResponse> logs = auditLogService.getAllLogs();
        return ResponseEntity.ok(ApiResponse.success("All security audit logs retrieved", logs));
    }
}

