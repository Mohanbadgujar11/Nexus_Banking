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
public class UserResponse {
    private Long id;
    private String accountNumber;
    private String fullName;
    private String username;
    private String email;
    private String phoneNumber;
    private String dateOfBirth;
    private String address;
    private String role;
    private BigDecimal balance;
    private Boolean hasPinSet;
    private LocalDateTime createdAt;
}
