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
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "cards")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Card {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "card_number_masked", nullable = false, length = 20)
    private String cardNumberMasked;

    @Column(name = "card_token_hash", nullable = false, unique = true, length = 128)
    private String cardTokenHash;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "cardholder_name", nullable = false, length = 100)
    private String cardholderName;

    @Column(name = "card_type", nullable = false, length = 30)
    @Builder.Default
    private String cardType = "TITANIUM_PHYSICAL"; // TITANIUM_PHYSICAL, VIRTUAL_DISPOSABLE, CORPORATE_METAL

    @Column(name = "expiration_date", nullable = false, length = 20)
    private String expirationDate;

    @Column(name = "cvv_hash", nullable = false, length = 255)
    private String cvvHash;

    @Column(name = "spending_limit_monthly", nullable = false, precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal spendingLimitMonthly = new BigDecimal("25000.0000");

    @Column(name = "atm_withdrawal_limit_daily", nullable = false, precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal atmWithdrawalLimitDaily = new BigDecimal("5000.0000");

    @Column(name = "is_frozen", nullable = false)
    @Builder.Default
    private Boolean isFrozen = false;

    @Column(name = "is_contactless_enabled", nullable = false)
    @Builder.Default
    private Boolean isContactlessEnabled = true;

    @Column(name = "is_international_enabled", nullable = false)
    @Builder.Default
    private Boolean isInternationalEnabled = false;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, BLOCKED, EXPIRED, TERMINATED

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.spendingLimitMonthly == null) {
            this.spendingLimitMonthly = new BigDecimal("25000.0000");
        }
        if (this.atmWithdrawalLimitDaily == null) {
            this.atmWithdrawalLimitDaily = new BigDecimal("5000.0000");
        }
        if (this.isFrozen == null) {
            this.isFrozen = false;
        }
        if (this.isContactlessEnabled == null) {
            this.isContactlessEnabled = true;
        }
        if (this.isInternationalEnabled == null) {
            this.isInternationalEnabled = false;
        }
        if (this.status == null) {
            this.status = "ACTIVE";
        }
        if (this.isDeleted == null) {
            this.isDeleted = false;
        }
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}

