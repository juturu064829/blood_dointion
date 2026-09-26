package com.blooddonation.service;

import com.blooddonation.dto.JwtResponse;
import com.blooddonation.dto.LoginRequest;
import com.blooddonation.dto.RegisterRequest;
import com.blooddonation.dto.UserProfileDTO;
import com.blooddonation.entity.Role;
import com.blooddonation.entity.User;
import com.blooddonation.exception.BadRequestException;
import com.blooddonation.repository.UserRepository;
import com.blooddonation.security.JwtUtils;
import com.blooddonation.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.blooddonation.exception.ResourceNotFoundException;
import java.util.Map;
import java.util.HashMap;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    private static final Map<String, ResetTokenRecord> resetTokens = new ConcurrentHashMap<>();

    private static class ResetTokenRecord {
        final String email;
        final long expiresAt;

        ResetTokenRecord(String email, long expiresAt) {
            this.email = email;
            this.expiresAt = expiresAt;
        }
    }

    public JwtResponse authenticateUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserPrincipal userDetails = (UserPrincipal) authentication.getPrincipal();
        String role = userDetails.getAuthorities().stream()
                .findFirst()
                .map(item -> item.getAuthority())
                .orElse("ROLE_USER");

        return JwtResponse.builder()
                .token(jwt)
                .id(userDetails.getId())
                .name(userDetails.getName())
                .email(userDetails.getEmail())
                .role(role)
                .build();
    }

    public UserProfileDTO registerUser(RegisterRequest registerRequest) {
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new BadRequestException("Error: Email address is already in use!");
        }

        Role userRole = registerRequest.getRole() != null ? registerRequest.getRole() : Role.ROLE_USER;

        User user = User.builder()
                .name(registerRequest.getName())
                .email(registerRequest.getEmail())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .role(userRole)
                .build();

        User savedUser = userRepository.save(user);

        return UserProfileDTO.builder()
                .id(savedUser.getId())
                .name(savedUser.getName())
                .email(savedUser.getEmail())
                .role(savedUser.getRole().name())
                .build();
    }

    public Map<String, String> forgotPassword(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new BadRequestException("Email address is required");
        }
        String normalizedEmail = email.toLowerCase().trim();

        // Create reset token
        String resetToken = "rst_" + UUID.randomUUID().toString().replace("-", "");
        resetTokens.put(resetToken, new ResetTokenRecord(normalizedEmail, System.currentTimeMillis() + 3600000));

        Map<String, String> response = new HashMap<>();
        response.put("message", "Password reset token generated successfully.");
        response.put("resetToken", resetToken);
        return response;
    }

    public Map<String, String> resetPassword(String resetToken, String newPassword) {
        if (resetToken == null || resetToken.trim().isEmpty()) {
            throw new BadRequestException("Reset token is required");
        }
        if (newPassword == null || newPassword.trim().isEmpty()) {
            throw new BadRequestException("New password is required");
        }

        ResetTokenRecord record = resetTokens.get(resetToken);
        if (record == null || record.expiresAt < System.currentTimeMillis()) {
            throw new BadRequestException("Invalid or expired password reset token.");
        }

        User user = userRepository.findByEmail(record.email)
                .orElse(null);

        if (user != null) {
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);
        }

        resetTokens.remove(resetToken);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Password reset successful! You can now log in with your new password.");
        return response;
    }
}

