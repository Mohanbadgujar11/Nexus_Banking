package com.nexus.nexus_banking_core.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardResponse {
    private Long id;
    private String cardNumberMasked;
    private String cardTokenHash;
    private String cardholderName;
    private String cardType;
    private String expirationDate;
    private BigDecimal spendingLimitMonthly;
    private BigDecimal atmWithdrawalLimitDaily;
    private Boolean isFrozen;
    private Boolean isContactlessEnabled;
    private Boolean isInternationalEnabled;
    private String status;
    private String accountNumber;
    private LocalDateTime createdAt;
}

