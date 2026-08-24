package com.nexus.nexus_banking_core.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.nexus.nexus_banking_core.dto.UserLoginRequest;
import com.nexus.nexus_banking_core.dto.UserRegisterRequest;
import com.nexus.nexus_banking_core.dto.UserResponse;
import com.nexus.nexus_banking_core.exception.InvalidCredentialsException;
import com.nexus.nexus_banking_core.exception.UserAlreadyExistsException;
import com.nexus.nexus_banking_core.model.Account;
import com.nexus.nexus_banking_core.model.CustomerProfile;
import com.nexus.nexus_banking_core.model.User;
import com.nexus.nexus_banking_core.repository.AccountMetadataRepository;
import com.nexus.nexus_banking_core.repository.AccountRepository;
import com.nexus.nexus_banking_core.repository.AddressRepository;
import com.nexus.nexus_banking_core.repository.AuditLogRepository;
import com.nexus.nexus_banking_core.repository.CardRepository;
import com.nexus.nexus_banking_core.repository.CustomerProfileRepository;
import com.nexus.nexus_banking_core.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CustomerProfileRepository customerProfileRepository;

    @Mock
    private AddressRepository addressRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private AccountMetadataRepository accountMetadataRepository;

    @Mock
    private CardRepository cardRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserServiceImpl userService;

    private UserRegisterRequest validRegisterRequest;
    private UserLoginRequest validLoginRequest;
    private User mockUser;
    private Account mockAccount;
    private CustomerProfile mockProfile;

    @BeforeEach
    void setUp() {
        validRegisterRequest = UserRegisterRequest.builder()
                .fullName("John Doe")
                .username("john_doe")
                .email("john@example.com")
                .password("Password@123")
                .phoneNumber("+1 555-0199")
                .dateOfBirth("1995-05-15")
                .address("100 Wall St, New York, NY")
                .role("ROLE_USER")
                .build();

        validLoginRequest = UserLoginRequest.builder()
                .identifier("john_doe")
                .password("Password@123")
                .build();

        mockUser = User.builder()
                .id(1L)
                .username("john_doe")
                .email("john@example.com")
                .password("hashedPassword")
                .role("ROLE_USER")
                .status("ACTIVE")
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .build();

        mockAccount = Account.builder()
                .id(1L)
                .accountNumber("NX-1002948192")
                .user(mockUser)
                .accountType("CHECKING")
                .balance(BigDecimal.ZERO)
                .availableBalance(BigDecimal.ZERO)
                .status("ACTIVE")
                .build();

        mockProfile = CustomerProfile.builder()
                .id(1L)
                .user(mockUser)
                .firstName("John")
                .lastName("Doe")
                .phoneNumber("+1 555-0199")
                .dateOfBirth("1995-05-15")
                .tier("STANDARD")
                .build();
    }

    @Test
    void registerUser_Success() {
        when(userRepository.existsByUsername("john_doe")).thenReturn(false);
        when(userRepository.existsByEmail("john@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Password@123")).thenReturn("hashedPassword");
        when(userRepository.save(any(User.class))).thenReturn(mockUser);
        when(accountRepository.existsByAccountNumber(any())).thenReturn(false);
        when(accountRepository.save(any(Account.class))).thenReturn(mockAccount);

        UserResponse response = userService.registerUser(validRegisterRequest);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("john_doe", response.getUsername());
        assertEquals("john@example.com", response.getEmail());
        assertEquals("NX-1002948192", response.getAccountNumber());
        assertEquals(BigDecimal.ZERO, response.getBalance());

        verify(passwordEncoder).encode("Password@123");
        verify(userRepository).save(any(User.class));
        verify(accountRepository).save(any(Account.class));
    }

    @Test
    void registerUser_DuplicateUsername_ThrowsException() {
        when(userRepository.existsByUsername("john_doe")).thenReturn(true);

        assertThrows(UserAlreadyExistsException.class, () -> {
            userService.registerUser(validRegisterRequest);
        });

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void registerUser_DuplicateEmail_ThrowsException() {
        when(userRepository.existsByUsername("john_doe")).thenReturn(false);
        when(userRepository.existsByEmail("john@example.com")).thenReturn(true);

        assertThrows(UserAlreadyExistsException.class, () -> {
            userService.registerUser(validRegisterRequest);
        });

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void authenticate_Success() {
        when(userRepository.findByIdentifier("john_doe")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("Password@123", "hashedPassword")).thenReturn(true);
        when(customerProfileRepository.findByUser(mockUser)).thenReturn(Optional.of(mockProfile));
        when(accountRepository.findPrimaryCheckingAccountByUserId(1L)).thenReturn(Optional.of(mockAccount));

        UserResponse response = userService.authenticate(validLoginRequest);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("john_doe", response.getUsername());
        assertEquals("NX-1002948192", response.getAccountNumber());
    }

    @Test
    void authenticate_WrongPassword_ThrowsInvalidCredentials() {
        when(userRepository.findByIdentifier("john_doe")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("Password@123", "hashedPassword")).thenReturn(false);

        assertThrows(InvalidCredentialsException.class, () -> {
            userService.authenticate(validLoginRequest);
        });
    }

    @Test
    void authenticate_UserNotFound_ThrowsInvalidCredentials() {
        when(userRepository.findByIdentifier("john_doe")).thenReturn(Optional.empty());

        assertThrows(InvalidCredentialsException.class, () -> {
            userService.authenticate(validLoginRequest);
        });
    }
}
