package com.nexus.nexus_banking_core.service;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

        String assignedRole = (request.getRole() != null && request.getRole().equalsIgnoreCase("ROLE_ADMIN"))
            ? "ROLE_ADMIN"
            : "ROLE_USER";

        String uniqueAccountNumber = generateUniqueAccountNumber();

        // 1. Create Core User
        User user = User.builder()
            .accountNumber(uniqueAccountNumber)
            .fullName(request.getFullName().trim())
            .username(request.getUsername().trim())
            .email(request.getEmail().trim().toLowerCase())
            .password(passwordEncoder.encode(request.getPassword()))
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
            .orElseThrow(() -> new InvalidCredentialsException("Invalid username/email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid username/email or password");
        }

        CustomerProfile profile = customerProfileRepository.findByUser(user).orElse(null);
        Address address = addressRepository.findByUserIdAndIsPrimaryTrue(user.getId()).orElse(null);
        Account primaryAccount = accountRepository.findPrimaryCheckingAccountByUserId(user.getId()).orElse(null);

        return buildUserResponse(user, profile, address, primaryAccount);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserByAccountNumber(String accountNumber) {
        Account account = accountRepository.findByAccountNumber(accountNumber.trim())
            .orElseThrow(() -> new InvalidCredentialsException("Account with number '" + accountNumber + "' was not found"));
        User user = account.getUser();
        CustomerProfile profile = customerProfileRepository.findByUser(user).orElse(null);
        Address address = addressRepository.findByUserIdAndIsPrimaryTrue(user.getId()).orElse(null);
        return buildUserResponse(user, profile, address, account);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new InvalidCredentialsException("User with ID '" + id + "' was not found"));
        CustomerProfile profile = customerProfileRepository.findByUser(user).orElse(null);
        Address address = addressRepository.findByUserIdAndIsPrimaryTrue(user.getId()).orElse(null);
        Account primaryAccount = accountRepository.findPrimaryCheckingAccountByUserId(user.getId()).orElse(null);
        return buildUserResponse(user, profile, address, primaryAccount);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findByIsDeletedFalse().stream()
            .map((user) -> {
                CustomerProfile profile = customerProfileRepository.findByUser(user).orElse(null);
                Address address = addressRepository.findByUserIdAndIsPrimaryTrue(user.getId()).orElse(null);
                Account primaryAccount = accountRepository.findPrimaryCheckingAccountByUserId(user.getId()).orElse(null);
                return buildUserResponse(user, profile, address, primaryAccount);
            })
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> searchUsers(String query) {
        if (query == null || query.isBlank()) {
            return getAllUsers();
        }
        return userRepository.searchUsers(query.trim()).stream()
            .map((user) -> {
                CustomerProfile profile = customerProfileRepository.findByUser(user).orElse(null);
                Address address = addressRepository.findByUserIdAndIsPrimaryTrue(user.getId()).orElse(null);
                Account primaryAccount = accountRepository.findPrimaryCheckingAccountByUserId(user.getId()).orElse(null);
                return buildUserResponse(user, profile, address, primaryAccount);
            })
            .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long id, UserUpdateRequest request) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new InvalidCredentialsException("User with ID '" + id + "' was not found"));

        if (!user.getEmail().equalsIgnoreCase(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Email '" + request.getEmail() + "' is already in use by another account");
        }

        user.setEmail(request.getEmail().trim().toLowerCase());
        if (request.getRole() != null && !request.getRole().isBlank()) {
            user.setRole(request.getRole().trim());
        }
        user.setFullName(request.getFullName().trim());
        if (request.getPhoneNumber() != null) user.setPhoneNumber(request.getPhoneNumber().trim());
        if (request.getAddress() != null) user.setAddress(request.getAddress().trim());
        User updated = userRepository.save(user);

        CustomerProfile profile = customerProfileRepository.findByUser(user).orElse(null);
        if (profile != null) {
            String[] nameParts = request.getFullName().trim().split("\\s+", 2);
            profile.setFirstName(nameParts[0]);
            profile.setLastName(nameParts.length > 1 ? nameParts[1] : nameParts[0]);
            if (request.getPhoneNumber() != null) profile.setPhoneNumber(request.getPhoneNumber().trim());
            customerProfileRepository.save(profile);
        }

        Address address = addressRepository.findByUserIdAndIsPrimaryTrue(user.getId()).orElse(null);
        if (address != null && request.getAddress() != null) {
            address.setAddressLine1(request.getAddress().trim());
            addressRepository.save(address);
        }

        Account primaryAccount = accountRepository.findPrimaryCheckingAccountByUserId(user.getId()).orElse(null);
        return buildUserResponse(updated, profile, address, primaryAccount);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new InvalidCredentialsException("User with ID '" + id + "' was not found"));
        user.setIsDeleted(true);
        user.setStatus("CLOSED");
        userRepository.save(user);

        accountRepository.findPrimaryCheckingAccountByUserId(id).ifPresent((acc) -> {
            acc.setIsDeleted(true);
            acc.setStatus("CLOSED");
            accountRepository.save(acc);
        });

        log.info("Soft deleted user with ID {}", id);
    }

    private String generateUniqueAccountNumber() {
        String accountNumber;
        do {
            long number = 1000000000L + (long) (secureRandom.nextDouble() * 8999999999L);
            accountNumber = "NX-" + number;
        } while (accountRepository.existsByAccountNumber(accountNumber));
        return accountNumber;
    }

    private UserResponse buildUserResponse(User user, CustomerProfile profile, Address address, Account account) {
        String fullName = profile != null && profile.getFirstName() != null
            ? profile.getFirstName() + " " + profile.getLastName()
            : user.getFullName() != null ? user.getFullName() : user.getUsername();
        String phone = profile != null ? profile.getPhoneNumber() : user.getPhoneNumber() != null ? user.getPhoneNumber() : "";
        String dob = profile != null ? profile.getDateOfBirth() : user.getDateOfBirth() != null ? user.getDateOfBirth() : "";
        String addr = address != null && address.getAddressLine1() != null
            ? address.getAddressLine1() + ", " + address.getCity() + ", " + address.getStateProvince()
            : user.getAddress() != null ? user.getAddress() : "";
        String accNum = account != null ? account.getAccountNumber() : user.getAccountNumber() != null ? user.getAccountNumber() : "NX-PENDING";
        BigDecimal bal = account != null ? account.getBalance() : user.getBalance() != null ? user.getBalance() : BigDecimal.ZERO;

        return UserResponse.builder()
            .id(user.getId())
            .accountNumber(accNum)
            .fullName(fullName)
            .username(user.getUsername())
            .email(user.getEmail())
            .phoneNumber(phone)
            .dateOfBirth(dob)
            .address(addr)
            .role(user.getRole())
            .balance(bal)
            .createdAt(user.getCreatedAt())
            .build();
    }
}
