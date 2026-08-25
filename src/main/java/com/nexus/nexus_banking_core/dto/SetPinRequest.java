package com.nexus.nexus_banking_core.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SetPinRequest {

    private String currentPin;

    @NotBlank(message = "New 6-digit PIN is required")
    @Pattern(regexp = "^\\d{6}$", message = "PIN must be exactly 6 numeric digits")
    private String newPin;

    private String password;
}

