package com.nexus.nexus_banking_core.service;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nexus.nexus_banking_core.dto.ChangePasswordRequest;
import com.nexus.nexus_banking_core.dto.DeactivationRequest;
import com.nexus.nexus_banking_core.dto.SetPinRequest;
import com.nexus.nexus_banking_core.dto.UserLoginRequest;
import com.nexus.nexus_banking_core.dto.UserRegisterRequest;
import com.nexus.nexus_banking_core.dto.UserResponse;
import com.nexus.nexus_banking_core.dto.UserUpdateRequest;
import com.nexus.nexus_banking_core.exception.InvalidCredentialsException;
import com.nexus.nexus_banking_core.exception.UserAlreadyExistsException;
import com.nexus.nexus_banking_core.model.Account;
import com.nexus.nexus_banking_core.model.AccountMetadata;
import com.nexus.nexus_banking_core.model.Address;
import com.nexus.nexus_banking_core.model.AuditLog;
import com.nexus.nexus_banking_core.model.Card;
import com.nexus.nexus_banking_core.model.CustomerProfile;
import com.nexus.nexus_banking_core.model.User;
import com.nexus.nexus_banking_core.repository.AccountMetadataRepository;
import com.nexus.nexus_banking_core.repository.AccountRepository;
import com.nexus.nexus_banking_core.repository.AddressRepository;
import com.nexus.nexus_banking_core.repository.AuditLogRepository;
import com.nexus.nexus_banking_core.repository.CardRepository;
import com.nexus.nexus_banking_core.repository.CustomerProfileRepository;
import com.nexus.nexus_banking_core.repository.TransactionRepository;
import com.nexus.nexus_banking_core.repository.UserRepository;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final AddressRepository addressRepository;
    private final AccountRepository accountRepository;
    private final AccountMetadataRepository accountMetadataRepository;
    private final CardRepository cardRepository;
    private final AuditLogRepository auditLogRepository;
    private final TransactionRepository transactionRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    @PostConstruct
    @Transactional
    public void initDefaultAdmin() {
        if (!userRepository.existsByUsername("admin")) {
            User admin = User.builder()
                .accountNumber("NX-ADMIN-0001")
                .fullName("System Administrator")
                .username("admin")
                .email("admin@nexus.io")
                .password(passwordEncoder.encode("Admin@123456"))
                .transactionPinHash(passwordEncoder.encode("123456"))
                .phoneNumber("+1 800-NEXUS-01")
                .dateOfBirth("1990-01-01")
                .address("100 Wall Street, 42nd Floor, New York, NY")
                .balance(new BigDecimal("1000000.0000"))
                .role("ROLE_ADMIN")
                .status("ACTIVE")
                .isDeleted(false)
                .build();
            User savedAdmin = userRepository.save(admin);

            CustomerProfile profile = CustomerProfile.builder()
                .user(savedAdmin)
                .firstName("System")
                .lastName("Administrator")
                .phoneNumber("+1 800-NEXUS-01")
                .dateOfBirth("1990-01-01")
                .tier("PRIVATE_RESERVE")
                .build();
            customerProfileRepository.save(profile);

            Address address = Address.builder()
                .user(savedAdmin)
                .addressType("CORPORATE")
                .addressLine1("100 Wall Street, 42nd Floor")
                .city("New York")
                .stateProvince("NY")
                .postalCode("10005")
                .countryCode("US")
                .isPrimary(true)
                .build();
            addressRepository.save(address);

            Account treasuryAccount = Account.builder()
                .accountNumber("NX-ADMIN-0001")
                .user(savedAdmin)
                .accountType("CHECKING")
                .currency("USD")
                .balance(new BigDecimal("1000000.0000"))
                .availableBalance(new BigDecimal("1000000.0000"))
                .status("ACTIVE")
                .isDeleted(false)
                .build();
            Account savedAcc = accountRepository.save(treasuryAccount);

            AccountMetadata metadata = AccountMetadata.builder()
                .account(savedAcc)
                .routingNumber("021000089")
                .swiftBic("NXUSUS33NYC")
                .dailyTransferLimit(new BigDecimal("5000000.0000"))
                .build();
            accountMetadataRepository.save(metadata);

            log.info("Initialized default administrator account: admin (NX-ADMIN-0001) with treasury reserve");
        }
    }

    @Override
    @Transactional
    public UserResponse registerUser(UserRegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new UserAlreadyExistsException("Username '" + request.getUsername() + "' is already taken");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Email '" + request.getEmail() + "' is already registered");
        }

        // Enforce ROLE_USER on client registration
        String assignedRole = "ROLE_USER";

        String uniqueAccountNumber = generateUniqueAccountNumber();

        String pinHash = (request.getTransactionPin() != null && !request.getTransactionPin().isBlank())
            ? passwordEncoder.encode(request.getTransactionPin().trim())
            : null;

        // 1. Create Core User
        User user = User.builder()
            .accountNumber(uniqueAccountNumber)
            .fullName(request.getFullName().trim())
            .username(request.getUsername().trim())
            .email(request.getEmail().trim().toLowerCase())
            .password(passwordEncoder.encode(request.getPassword()))
            .transactionPinHash(pinHash)
            .phoneNumber(request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : "")
            .dateOfBirth(request.getDateOfBirth() != null ? request.getDateOfBirth().trim() : "")
            .address(request.getAddress() != null ? request.getAddress().trim() : "")
            .balance(BigDecimal.ZERO)
            .role(assignedRole)
            .status("ACTIVE")
            .isDeleted(false)
            .build();
        User savedUser = userRepository.save(user);

        // 2. Parse Names & Create Customer Profile
        String[] nameParts = request.getFullName().trim().split("\\s+", 2);
        String firstName = nameParts[0];
        String lastName = nameParts.length > 1 ? nameParts[1] : firstName;

        CustomerProfile profile = CustomerProfile.builder()
            .user(savedUser)
            .firstName(firstName)
            .lastName(lastName)
            .phoneNumber(request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : "")
            .dateOfBirth(request.getDateOfBirth() != null ? request.getDateOfBirth().trim() : "2000-01-01")
            .tier("PRIVATE_RESERVE")
            .build();
        customerProfileRepository.save(profile);

        // 3. Create Physical Address
        Address address = Address.builder()
            .user(savedUser)
            .addressType("RESIDENTIAL")
            .addressLine1(request.getAddress() != null ? request.getAddress().trim() : "100 Wall St")
            .city("New York")
            .stateProvince("NY")
            .postalCode("10005")
            .countryCode("US")
            .isPrimary(true)
            .build();
        addressRepository.save(address);

        // 4. Provision Primary Checking Account with $0.00 balance
        Account primaryAccount = Account.builder()
            .accountNumber(uniqueAccountNumber)
            .user(savedUser)
            .accountType("CHECKING")
            .currency("USD")
            .balance(BigDecimal.ZERO)
            .availableBalance(BigDecimal.ZERO)
            .status("ACTIVE")
            .isDeleted(false)
            .build();
        Account savedAccount = accountRepository.save(primaryAccount);

        // 5. Account Metadata
        AccountMetadata metadata = AccountMetadata.builder()
            .account(savedAccount)
            .routingNumber("021000089")
            .swiftBic("NXUSUS33NYC")
            .dailyTransferLimit(new BigDecimal("50000.0000"))
            .build();
        accountMetadataRepository.save(metadata);

        // 6. Provision Primary Titanium Card
        String cardMasked = "4829 " + uniqueAccountNumber.replace("NX-", "").substring(0, 4) + " •••• 8829";
        Card primaryCard = Card.builder()
            .cardNumberMasked(cardMasked)
            .cardTokenHash("TKN-" + uniqueAccountNumber + "-" + System.currentTimeMillis())
            .account(savedAccount)
            .user(savedUser)
            .cardholderName(request.getFullName().toUpperCase())
            .cardType("TITANIUM_PHYSICAL")
            .expirationDate("08/31")
            .cvvHash(passwordEncoder.encode("829"))
            .spendingLimitMonthly(new BigDecimal("25000.0000"))
            .atmWithdrawalLimitDaily(new BigDecimal("5000.0000"))
            .isFrozen(false)
            .isContactlessEnabled(true)
            .isInternationalEnabled(false)
            .status("ACTIVE")
            .isDeleted(false)
            .build();
        cardRepository.save(primaryCard);

        // 7. Audit Log
        AuditLog auditLog = AuditLog.builder()
            .actorUser(savedUser)
            .action("USER_REGISTERED")
            .resourceType("USERS")
            .resourceId(String.valueOf(savedUser.getId()))
            .ipAddress("127.0.0.1")
            .sha256Fingerprint("SHA256-REG-" + savedUser.getId() + "-" + System.currentTimeMillis())
            .build();
        auditLogRepository.save(auditLog);

        log.info("Provisioned user {}, account {}, profile, address, and titanium card", savedUser.getUsername(), uniqueAccountNumber);
        return buildUserResponse(savedUser, profile, address, savedAccount);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse authenticate(UserLoginRequest request) {
        String identifier = request.getIdentifier().trim();
        User user = userRepository.findByIdentifier(identifier)
            .orElseThrow(() -> new InvalidCredentialsException("Invalid username, email, or account number"));

        if (Boolean.TRUE.equals(user.getIsDeleted())) {
            throw new InvalidCredentialsException("Account has been closed or removed");
        }

        if ("FROZEN".equalsIgnoreCase(user.getStatus()) || "SUSPENDED".equalsIgnoreCase(user.getStatus())) {
            throw new InvalidCredentialsException("Account access is currently locked. Contact administration to unlock.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid credentials provided");
        }

        // Audit Log
        AuditLog auditLog = AuditLog.builder()
            .actorUser(user)
            .action("USER_AUTHENTICATED")
            .resourceType("USERS")
            .resourceId(String.valueOf(user.getId()))
            .ipAddress("127.0.0.1")
            .sha256Fingerprint("SHA256-AUTH-" + user.getId() + "-" + System.currentTimeMillis())
            .build();
        auditLogRepository.save(auditLog);

        log.info("Authenticated user {} ({})", user.getUsername(), user.getRole());
        return mapToUserResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserByAccountNumber(String accountNumber) {
        User user = userRepository.findByAccountNumber(accountNumber)
            .orElseThrow(() -> new InvalidCredentialsException("Account with number '" + accountNumber + "' was not found"));
        return mapToUserResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new InvalidCredentialsException("User with ID '" + id + "' was not found"));
        return mapToUserResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
            .filter(u -> !Boolean.TRUE.equals(u.getIsDeleted()))
            .map(this::mapToUserResponse)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> searchUsers(String query) {
        if (query == null || query.isBlank()) {
            return getAllUsers();
        }
        return userRepository.searchUsers(query.trim()).stream()
            .filter(u -> !Boolean.TRUE.equals(u.getIsDeleted()))
            .map(this::mapToUserResponse)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long id, UserUpdateRequest request) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new InvalidCredentialsException("User with ID '" + id + "' was not found"));

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            user.setEmail(request.getEmail().trim().toLowerCase());
        }
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber().trim());
        }
        if (request.getAddress() != null) {
            user.setAddress(request.getAddress().trim());
        }
        if (request.getRole() != null && !request.getRole().isBlank()) {
            user.setRole(request.getRole());
        }

        User updatedUser = userRepository.save(user);

        // Sync CustomerProfile
        customerProfileRepository.findByUserId(id).ifPresent((p) -> {
            if (request.getFullName() != null && !request.getFullName().isBlank()) {
                String[] parts = request.getFullName().trim().split("\\s+", 2);
                p.setFirstName(parts[0]);
                p.setLastName(parts.length > 1 ? parts[1] : parts[0]);
            }
            if (request.getPhoneNumber() != null) {
                p.setPhoneNumber(request.getPhoneNumber().trim());
            }
            customerProfileRepository.save(p);
        });

        // Sync Address
        addressRepository.findByUserIdAndIsPrimaryTrue(id).ifPresent((addr) -> {
            if (request.getAddress() != null) {
                addr.setAddressLine1(request.getAddress().trim());
                addressRepository.save(addr);
            }
        });

        // Audit Log
        AuditLog auditLog = AuditLog.builder()
            .actorUser(updatedUser)
            .action("USER_PROFILE_UPDATED")
            .resourceType("USERS")
            .resourceId(String.valueOf(updatedUser.getId()))
            .ipAddress("127.0.0.1")
            .sha256Fingerprint("SHA256-UPD-" + updatedUser.getId() + "-" + System.currentTimeMillis())
            .build();
        auditLogRepository.save(auditLog);

        log.info("Updated profile for user ID {}", id);
        return mapToUserResponse(updatedUser);
    }

    @Override
    @Transactional
    public void changePassword(Long id, ChangePasswordRequest request) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new InvalidCredentialsException("User with ID '" + id + "' was not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Current password does not match our records");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Audit Log
        AuditLog auditLog = AuditLog.builder()
            .actorUser(user)
            .action("PASSWORD_CHANGED")
            .resourceType("USERS")
            .resourceId(String.valueOf(user.getId()))
            .ipAddress("127.0.0.1")
            .sha256Fingerprint("SHA256-PWD-" + user.getId() + "-" + System.currentTimeMillis())
            .build();
        auditLogRepository.save(auditLog);

        log.info("Password changed successfully for user ID {}", id);
    }

    @Override
    @Transactional
    public void setOrUpdatePin(Long id, SetPinRequest request) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new InvalidCredentialsException("User with ID '" + id + "' was not found"));

        if (user.getTransactionPinHash() != null && !user.getTransactionPinHash().isBlank()) {
            // Updating existing PIN: verify current PIN or password
            boolean verified = false;
            if (request.getCurrentPin() != null && !request.getCurrentPin().isBlank()) {
                verified = passwordEncoder.matches(request.getCurrentPin().trim(), user.getTransactionPinHash());
            } else if (request.getPassword() != null && !request.getPassword().isBlank()) {
                verified = passwordEncoder.matches(request.getPassword(), user.getPassword());
            }

            if (!verified) {
                throw new InvalidCredentialsException("Verification failed. Please enter your correct current PIN or Master Password.");
            }
        } else {
            // First-time PIN setup: verify password if provided
            if (request.getPassword() != null && !request.getPassword().isBlank()) {
                if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                    throw new InvalidCredentialsException("Master password verification failed.");
                }
            }
        }

        user.setTransactionPinHash(passwordEncoder.encode(request.getNewPin().trim()));
        userRepository.save(user);

        // Audit Log
        AuditLog auditLog = AuditLog.builder()
            .actorUser(user)
            .action("SECURITY_PIN_CONFIGURED")
            .resourceType("USERS")
            .resourceId(String.valueOf(user.getId()))
            .ipAddress("127.0.0.1")
            .sha256Fingerprint("SHA256-PIN-" + user.getId() + "-" + System.currentTimeMillis())
            .build();
        auditLogRepository.save(auditLog);

        log.info("6-digit security PIN configured successfully for user ID {}", id);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean verifyPin(Long id, String pin) {
        if (pin == null || pin.isBlank()) {
            return false;
        }
        User user = userRepository.findById(id).orElse(null);
        if (user == null || user.getTransactionPinHash() == null) {
            return false;
        }
        return passwordEncoder.matches(pin.trim(), user.getTransactionPinHash());
    }

    @Override
    @Transactional
    public void submitDeactivationRequest(Long id, DeactivationRequest request) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new InvalidCredentialsException("User with ID '" + id + "' was not found"));

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                throw new InvalidCredentialsException("Master password verification failed");
            }
        }

        String action = "DEACTIVATION_REQUESTED_" + request.getDeactivationType();
        if ("TEMPORARY_FREEZE".equalsIgnoreCase(request.getDeactivationType())) {
            user.setStatus("FROZEN");
            userRepository.save(user);
        }

        // Audit Log
        AuditLog auditLog = AuditLog.builder()
            .actorUser(user)
            .action(action)
            .resourceType("USERS")
            .resourceId(String.valueOf(user.getId()))
            .ipAddress("127.0.0.1")
            .sha256Fingerprint("SHA256-DEACT-" + user.getId() + "-" + System.currentTimeMillis())
            .build();
        auditLogRepository.save(auditLog);

        log.info("Deactivation request submitted for user ID {}: type={}, reason={}", id, request.getDeactivationType(), request.getReason());
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new InvalidCredentialsException("User with ID '" + id + "' was not found"));

        // 1. Disassociate Audit Logs
        auditLogRepository.findByActorUserIdOrderByCreatedAtDesc(id).forEach(logEntry -> {
            logEntry.setActorUser(null);
            auditLogRepository.save(logEntry);
        });

        // 2. Disassociate Transactions
        transactionRepository.findByInitiatedByUserId(id).forEach(tx -> {
            tx.setInitiatedByUser(null);
            transactionRepository.save(tx);
        });

        // 3. Delete Cards
        cardRepository.findByUserId(id).forEach(cardRepository::delete);

        // 4. Delete Accounts and Account Metadata
        accountRepository.findByUserId(id).forEach(acc -> {
            accountMetadataRepository.findByAccountId(acc.getId()).ifPresent(accountMetadataRepository::delete);
            accountRepository.delete(acc);
        });

        // 5. Delete Customer Profile and Address
        addressRepository.findByUserId(id).forEach(addressRepository::delete);
        customerProfileRepository.findByUserId(id).ifPresent(customerProfileRepository::delete);

        // 6. Hard Delete User Record from Database
        userRepository.delete(user);

        log.info("Hard deleted user with ID {}, completely purged database records and freed username {}", id, user.getUsername());
    }

    private String generateUniqueAccountNumber() {
        String accountNumber;
        do {
            long number = 1000000000L + (long) (secureRandom.nextDouble() * 8999999999L);
            accountNumber = "NX-" + number;
        } while (accountRepository.existsByAccountNumber(accountNumber));
        return accountNumber;
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
            .id(user.getId())
            .accountNumber(user.getAccountNumber())
            .fullName(user.getFullName())
            .username(user.getUsername())
            .email(user.getEmail())
            .phoneNumber(user.getPhoneNumber())
            .dateOfBirth(user.getDateOfBirth())
            .address(user.getAddress())
            .role(user.getRole())
            .balance(user.getBalance())
            .hasPinSet(user.getTransactionPinHash() != null && !user.getTransactionPinHash().isBlank())
            .createdAt(user.getCreatedAt())
            .build();
    }

    private UserResponse buildUserResponse(User user, CustomerProfile profile, Address address, Account account) {
        return UserResponse.builder()
            .id(user.getId())
            .accountNumber(account != null ? account.getAccountNumber() : user.getAccountNumber())
            .fullName(user.getFullName())
            .username(user.getUsername())
            .email(user.getEmail())
            .phoneNumber(profile != null ? profile.getPhoneNumber() : user.getPhoneNumber())
            .dateOfBirth(profile != null ? profile.getDateOfBirth() : user.getDateOfBirth())
            .address(address != null ? address.getAddressLine1() : user.getAddress())
            .role(user.getRole())
            .balance(account != null ? account.getBalance() : user.getBalance())
            .hasPinSet(user.getTransactionPinHash() != null && !user.getTransactionPinHash().isBlank())
            .createdAt(user.getCreatedAt())
            .build();
    }
}
