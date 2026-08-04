package com.blooddonation.controller;

import com.blooddonation.dto.AdminReportDTO;
import com.blooddonation.dto.ApiResponse;
import com.blooddonation.dto.DashboardStatsDTO;
import com.blooddonation.dto.UserProfileDTO;
import com.blooddonation.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin Module", description = "Admin dashboard metrics, user management, donor approval, and reports")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @GetMapping("/dashboard")
    @Operation(summary = "Get Admin Dashboard statistics", description = "Returns total users, donors, requests, hospitals, and blood group metrics")
    public ResponseEntity<ApiResponse<DashboardStatsDTO>> getDashboardStats() {
        DashboardStatsDTO stats = adminService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success("Dashboard statistics fetched successfully", stats));
    }

    @GetMapping("/users")
    @Operation(summary = "Manage Users - List all users", description = "Lists all registered users in system")
    public ResponseEntity<ApiResponse<List<UserProfileDTO>>> getAllUsers() {
        List<UserProfileDTO> users = adminService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success("All users fetched successfully", users));
    }

    @PutMapping("/users/{userId}/role")
    @Operation(summary = "Manage Users - Change user role", description = "Updates role for specified user (ADMIN, DONOR, HOSPITAL, USER)")
    public ResponseEntity<ApiResponse<UserProfileDTO>> updateUserRole(
            @PathVariable Long userId,
            @RequestParam String role) {
        UserProfileDTO updated = adminService.updateUserRole(userId, role);
        return ResponseEntity.ok(ApiResponse.success("User role updated successfully", updated));
    }

    @PutMapping("/donors/{donorId}/approve")
    @Operation(summary = "Approve or Reject Donors", description = "Admin approval for donor profiles")
    public ResponseEntity<ApiResponse<Void>> approveDonor(
            @PathVariable Long donorId,
            @RequestParam(defaultValue = "true") boolean approved) {
        adminService.approveDonor(donorId, approved);
        String msg = approved ? "Donor approved successfully" : "Donor approval revoked";
        return ResponseEntity.ok(ApiResponse.success(msg));
    }

    @GetMapping("/reports")
    @Operation(summary = "View Analytics & System Reports", description = "Generates system reports for requests by status, donors by city/blood group")
    public ResponseEntity<ApiResponse<AdminReportDTO>> getReports() {
        AdminReportDTO report = adminService.generateReports();
        return ResponseEntity.ok(ApiResponse.success("System reports generated successfully", report));
    }
}
