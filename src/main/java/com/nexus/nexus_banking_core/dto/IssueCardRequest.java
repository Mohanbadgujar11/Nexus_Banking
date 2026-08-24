package com.nexus.nexus_banking_core.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IssueCardRequest {
    @NotNull(message = "User ID is required")
    private Long userId;

    private String accountNumber;
    
    private String cardType; // TITANIUM_PHYSICAL, VIRTUAL_DISPOSABLE, OBSIDIAN_METAL
    
    private BigDecimal monthlyLimit;
    
    private BigDecimal dailyAtmLimit;
}

