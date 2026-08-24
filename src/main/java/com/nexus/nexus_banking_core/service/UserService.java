package com.nexus.nexus_banking_core.service;

import java.util.List;

import com.nexus.nexus_banking_core.dto.ChangePasswordRequest;
import com.nexus.nexus_banking_core.dto.DeactivationRequest;
import com.nexus.nexus_banking_core.dto.UserLoginRequest;
import com.nexus.nexus_banking_core.dto.UserRegisterRequest;
import com.nexus.nexus_banking_core.dto.UserResponse;
import com.nexus.nexus_banking_core.dto.UserUpdateRequest;

public interface UserService {

    UserResponse registerUser(UserRegisterRequest request);

    UserResponse authenticate(UserLoginRequest request);

    UserResponse getUserByAccountNumber(String accountNumber);

    UserResponse getUserById(Long id);

    List<UserResponse> getAllUsers();

    List<UserResponse> searchUsers(String query);

    UserResponse updateUser(Long id, UserUpdateRequest request);

    void changePassword(Long id, ChangePasswordRequest request);

    void submitDeactivationRequest(Long id, DeactivationRequest request);

    void deleteUser(Long id);
}
