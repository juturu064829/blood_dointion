package com.blooddonation.controller;

import com.blooddonation.dto.ApiResponse;
import com.blooddonation.dto.JwtResponse;
import com.blooddonation.dto.LoginRequest;
import com.blooddonation.dto.RegisterRequest;
import com.blooddonation.dto.UserProfileDTO;
import com.blooddonation.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "User registration and login endpoints")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register new user", description = "Creates a new user account with specified role")
    public ResponseEntity<ApiResponse<UserProfileDTO>> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        UserProfileDTO registeredUser = authService.registerUser(registerRequest);
        return ResponseEntity.ok(ApiResponse.success("User registered successfully!", registeredUser));
    }

    @PostMapping("/login")
    @Operation(summary = "User Login", description = "Authenticates user and returns JWT Bearer token")
    public ResponseEntity<ApiResponse<JwtResponse>> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        JwtResponse jwtResponse = authService.authenticateUser(loginRequest);
        return ResponseEntity.ok(ApiResponse.success("Login successful!", jwtResponse));
    }
}
