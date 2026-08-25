package com.nexus.nexus_banking_core.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nexus.nexus_banking_core.dto.ApiResponse;
import com.nexus.nexus_banking_core.dto.ChangePasswordRequest;
import com.nexus.nexus_banking_core.dto.DeactivationRequest;
import com.nexus.nexus_banking_core.dto.SetPinRequest;
import com.nexus.nexus_banking_core.dto.UserLoginRequest;
import com.nexus.nexus_banking_core.dto.UserRegisterRequest;
import com.nexus.nexus_banking_core.dto.UserResponse;
import com.nexus.nexus_banking_core.dto.UserUpdateRequest;
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

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserUpdateRequest request) {
        UserResponse response = userService.updateUser(id, request);
        return ResponseEntity.ok(ApiResponse.success("User profile updated successfully", response));
    }

    @PostMapping("/{id}/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            @PathVariable Long id,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(id, request);
        return ResponseEntity.ok(ApiResponse.success("Master password updated successfully", "Password changed successfully."));
    }

    @PostMapping("/{id}/pin")
    public ResponseEntity<ApiResponse<String>> setOrUpdatePin(
            @PathVariable Long id,
            @Valid @RequestBody SetPinRequest request) {
        userService.setOrUpdatePin(id, request);
        return ResponseEntity.ok(ApiResponse.success("6-digit security PIN successfully configured and encrypted.", "PIN saved successfully."));
    }

    @PostMapping("/{id}/verify-pin")
    public ResponseEntity<ApiResponse<Boolean>> verifyPin(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body) {
        String pin = body != null ? body.get("pin") : "";
        boolean valid = userService.verifyPin(id, pin);
        return ResponseEntity.ok(ApiResponse.success(valid ? "PIN verified successfully" : "PIN verification failed", valid));
    }

    @PostMapping("/{id}/deactivation-request")
    public ResponseEntity<ApiResponse<String>> submitDeactivationRequest(
            @PathVariable Long id,
            @Valid @RequestBody DeactivationRequest request) {
        userService.submitDeactivationRequest(id, request);
        return ResponseEntity.ok(ApiResponse.success("Deactivation request submitted successfully to compliance & administration", "Request processed."));
    }
}
