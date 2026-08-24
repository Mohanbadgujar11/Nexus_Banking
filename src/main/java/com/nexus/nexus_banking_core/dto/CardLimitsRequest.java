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
public class CardLimitsRequest {
    @NotNull(message = "Monthly limit is required")
    private BigDecimal monthlyLimit;

    private BigDecimal dailyAtmLimit;
}

