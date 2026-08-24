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
@Table(name = "transactions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "transaction_reference", nullable = false, unique = true, length = 64)
    private String transactionReference;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_transaction_id")
    private Transaction parentTransaction;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String channel = "WEB"; // WEB, MOBILE, API, ADMIN_PORTAL, WIRE_NETWORK

    @Column(nullable = false, length = 30)
    private String type; // DEPOSIT, P2P_TRANSFER, WIRE_DOMESTIC, WIRE_SWIFT, INTEREST_CREDIT, FEE_CHARGE

    @Column(name = "amount", precision = 19, scale = 4)
    private BigDecimal amount;

    @Column(name = "total_amount", precision = 19, scale = 4)
    private BigDecimal totalAmount;

    @Column(name = "sender_account_number", length = 25)
    private String senderAccountNumber;

    @Column(name = "receiver_account_number", length = 25)
    private String receiverAccountNumber;

    @Column(nullable = false, length = 3)
    @Builder.Default
    private String currency = "USD";

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "SETTLED"; // PENDING, POSTED, SETTLED, FAILED, REVERSED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "initiated_by_user_id")
    private User initiatedByUser;

    @Column(nullable = false, length = 255)
    private String description;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.channel == null) {
            this.channel = "WEB";
        }
        if (this.currency == null) {
            this.currency = "USD";
        }
        if (this.status == null) {
            this.status = "SETTLED";
        }
        if (this.totalAmount == null && this.amount != null) {
            this.totalAmount = this.amount;
        }
        if (this.amount == null && this.totalAmount != null) {
            this.amount = this.totalAmount;
        }
        if (this.senderAccountNumber == null) {
            this.senderAccountNumber = "TREASURY";
        }
        if (this.receiverAccountNumber == null) {
            this.receiverAccountNumber = "BENEFICIARY";
        }
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        if (this.totalAmount == null && this.amount != null) {
            this.totalAmount = this.amount;
        }
        if (this.amount == null && this.totalAmount != null) {
            this.amount = this.totalAmount;
        }
        this.updatedAt = LocalDateTime.now();
    }
}
