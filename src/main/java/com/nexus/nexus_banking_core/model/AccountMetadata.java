package com.nexus.nexus_banking_core.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "account_metadata")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountMetadata {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false, unique = true)
    private Account account;

    @Column(name = "routing_number", nullable = false, length = 20)
    @Builder.Default
    private String routingNumber = "021000089";

    @Column(name = "swift_bic", nullable = false, length = 15)
    @Builder.Default
    private String swiftBic = "NXUSUS33NYC";

    @Column(length = 34, unique = true)
    private String iban;

    @Column(name = "interest_rate_apy", nullable = false, precision = 6, scale = 4)
    @Builder.Default
    private BigDecimal interestRateApy = BigDecimal.ZERO;

    @Column(name = "daily_transfer_limit", nullable = false, precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal dailyTransferLimit = new BigDecimal("50000.0000");

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.routingNumber == null) {
            this.routingNumber = "021000089";
        }
        if (this.swiftBic == null) {
            this.swiftBic = "NXUSUS33NYC";
        }
        if (this.interestRateApy == null) {
            this.interestRateApy = BigDecimal.ZERO;
        }
        if (this.dailyTransferLimit == null) {
            this.dailyTransferLimit = new BigDecimal("50000.0000");
        }
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}

