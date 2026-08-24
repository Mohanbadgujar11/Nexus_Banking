package com.nexus.nexus_banking_core.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nexus.nexus_banking_core.dto.ApiResponse;
import com.nexus.nexus_banking_core.dto.UserLoginRequest;
import com.nexus.nexus_banking_core.dto.UserRegisterRequest;
import com.nexus.nexus_banking_core.dto.UserResponse;
import com.nexus.nexus_banking_core.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponse>> registerUser(@Valid @RequestBody UserRegisterRequest request) {
        UserResponse response = userService.registerUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Account created successfully. Unique account number assigned.", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<UserResponse>> loginUser(@Valid @RequestBody UserLoginRequest request) {
        UserResponse response = userService.authenticate(request);
        return ResponseEntity.ok(ApiResponse.success("Authentication successful", response));
    }

    @GetMapping("/account/{accountNumber}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserByAccountNumber(@PathVariable String accountNumber) {
        UserResponse response = userService.getUserByAccountNumber(accountNumber);
        return ResponseEntity.ok(ApiResponse.success("Account details retrieved successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long id) {
        UserResponse response = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success("User retrieved successfully", response));
    }
}
