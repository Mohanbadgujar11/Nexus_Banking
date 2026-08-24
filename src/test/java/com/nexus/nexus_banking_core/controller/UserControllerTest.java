package com.nexus.nexus_banking_core.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.nexus.nexus_banking_core.dto.UserLoginRequest;
import com.nexus.nexus_banking_core.dto.UserRegisterRequest;
import com.nexus.nexus_banking_core.dto.UserResponse;
import com.nexus.nexus_banking_core.exception.GlobalExceptionHandler;
import com.nexus.nexus_banking_core.exception.InvalidCredentialsException;
import com.nexus.nexus_banking_core.exception.UserAlreadyExistsException;
import com.nexus.nexus_banking_core.service.UserService;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    private MockMvc mockMvc;

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(userController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void registerUser_ValidPayload_ReturnsCreated() throws Exception {
        UserResponse response = UserResponse.builder()
                .id(1L)
                .accountNumber("NX-1002948192")
                .fullName("John Doe")
                .username("john_doe")
                .email("john@example.com")
                .role("ROLE_USER")
                .balance(BigDecimal.ZERO)
                .createdAt(LocalDateTime.now())
                .build();

        when(userService.registerUser(any(UserRegisterRequest.class))).thenReturn(response);

        String jsonPayload = """
                {
                    "fullName": "John Doe",
                    "username": "john_doe",
                    "email": "john@example.com",
                    "password": "SecurePassword123",
                    "phoneNumber": "+1 555-0199",
                    "dateOfBirth": "1995-05-15",
                    "address": "100 Wall St, New York, NY"
                }
                """;

        mockMvc.perform(post("/api/users/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.username").value("john_doe"))
                .andExpect(jsonPath("$.data.accountNumber").value("NX-1002948192"));
    }

    @Test
    void registerUser_InvalidEmail_ReturnsBadRequest() throws Exception {
        String jsonPayload = """
                {
                    "fullName": "John Doe",
                    "username": "john_doe",
                    "email": "invalid-email-format",
                    "password": "SecurePassword123",
                    "phoneNumber": "+1 555-0199",
                    "dateOfBirth": "1995-05-15",
                    "address": "100 Wall St, New York, NY"
                }
                """;

        mockMvc.perform(post("/api/users/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors.email").exists());
    }

    @Test
    void registerUser_DuplicateUser_ReturnsConflict() throws Exception {
        when(userService.registerUser(any(UserRegisterRequest.class)))
                .thenThrow(new UserAlreadyExistsException("Username 'john_doe' is already taken"));

        String jsonPayload = """
                {
                    "fullName": "John Doe",
                    "username": "john_doe",
                    "email": "john@example.com",
                    "password": "SecurePassword123",
                    "phoneNumber": "+1 555-0199",
                    "dateOfBirth": "1995-05-15",
                    "address": "100 Wall St, New York, NY"
                }
                """;

        mockMvc.perform(post("/api/users/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonPayload))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Username 'john_doe' is already taken"));
    }

    @Test
    void loginUser_ValidCredentials_ReturnsOk() throws Exception {
        UserResponse response = UserResponse.builder()
                .id(1L)
                .accountNumber("NX-1002948192")
                .fullName("John Doe")
                .username("john_doe")
                .email("john@example.com")
                .role("ROLE_USER")
                .balance(BigDecimal.ZERO)
                .createdAt(LocalDateTime.now())
                .build();

        when(userService.authenticate(any(UserLoginRequest.class))).thenReturn(response);

        String jsonPayload = """
                {
                    "identifier": "john_doe",
                    "password": "SecurePassword123"
                }
                """;

        mockMvc.perform(post("/api/users/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.username").value("john_doe"));
    }

    @Test
    void loginUser_InvalidCredentials_ReturnsUnauthorized() throws Exception {
        when(userService.authenticate(any(UserLoginRequest.class)))
                .thenThrow(new InvalidCredentialsException("Invalid username/email or password"));

        String jsonPayload = """
                {
                    "identifier": "john_doe",
                    "password": "WrongPassword"
                }
                """;

        mockMvc.perform(post("/api/users/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonPayload))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Invalid username/email or password"));
    }
}
