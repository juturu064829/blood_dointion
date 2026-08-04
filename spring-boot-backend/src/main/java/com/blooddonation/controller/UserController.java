package com.blooddonation.controller;

import com.blooddonation.dto.ApiResponse;
import com.blooddonation.dto.ChangePasswordRequest;
import com.blooddonation.dto.UserProfileDTO;
import com.blooddonation.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@Tag(name = "User Module", description = "User profile and password management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/profile")
    @Operation(summary = "Get current profile", description = "Returns user profile details for authenticated user")
    public ResponseEntity<ApiResponse<UserProfileDTO>> getProfile(Authentication authentication) {
        UserProfileDTO profile = userService.getUserProfile(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Profile fetched successfully", profile));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update profile", description = "Updates profile information for authenticated user")
    public ResponseEntity<ApiResponse<UserProfileDTO>> updateProfile(
            Authentication authentication,
            @RequestBody UserProfileDTO dto) {
        UserProfileDTO updated = userService.updateProfile(authentication.getName(), dto);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", updated));
    }

    @PutMapping("/change-password")
    @Operation(summary = "Change password", description = "Changes password for authenticated user")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully"));
    }
}
