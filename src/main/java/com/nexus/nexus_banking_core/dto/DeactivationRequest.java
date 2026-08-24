package com.nexus.nexus_banking_core.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeactivationRequest {

    @NotBlank(message = "Deactivation type is required (TEMPORARY_FREEZE or PERMANENT_CLOSURE)")
    private String deactivationType; // 'TEMPORARY_FREEZE' | 'PERMANENT_CLOSURE'

    @NotBlank(message = "Reason is required")
    private String reason;

    private String password;
}

