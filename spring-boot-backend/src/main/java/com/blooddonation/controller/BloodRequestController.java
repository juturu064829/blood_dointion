package com.blooddonation.controller;

import com.blooddonation.dto.ApiResponse;
import com.blooddonation.dto.BloodRequestDTO;
import com.blooddonation.service.BloodRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
@Tag(name = "Blood Request Module", description = "Blood request creation, status tracking, and management")
public class BloodRequestController {

    @Autowired
    private BloodRequestService bloodRequestService;

    @GetMapping
    @Operation(summary = "Get all blood requests", description = "Lists all submitted blood requests")
    public ResponseEntity<ApiResponse<List<BloodRequestDTO>>> getAllRequests() {
        List<BloodRequestDTO> requests = bloodRequestService.getAllRequests();
        return ResponseEntity.ok(ApiResponse.success("Blood requests fetched successfully", requests));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get blood request by ID", description = "Fetches blood request details by ID")
    public ResponseEntity<ApiResponse<BloodRequestDTO>> getRequestById(@PathVariable Long id) {
        BloodRequestDTO request = bloodRequestService.getRequestById(id);
        return ResponseEntity.ok(ApiResponse.success("Blood request fetched successfully", request));
    }

    @PostMapping
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Create blood request", description = "Creates a new emergency blood request")
    public ResponseEntity<ApiResponse<BloodRequestDTO>> createRequest(
            @Valid @RequestBody BloodRequestDTO dto,
            Authentication authentication) {
        BloodRequestDTO created = bloodRequestService.createRequest(dto, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Blood request created successfully", created));
    }

    @PutMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Update blood request", description = "Updates blood request details")
    public ResponseEntity<ApiResponse<BloodRequestDTO>> updateRequest(
            @PathVariable Long id,
            @RequestBody BloodRequestDTO dto) {
        BloodRequestDTO updated = bloodRequestService.updateRequest(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Blood request updated successfully", updated));
    }

    @PutMapping("/{id}/status")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_HOSPITAL', 'ROLE_DONOR')")
    @Operation(summary = "Accept, Reject, or Update blood request status", description = "Updates request status (ACCEPTED, REJECTED, COMPLETED, CANCELLED)")
    public ResponseEntity<ApiResponse<BloodRequestDTO>> updateRequestStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        BloodRequestDTO updated = bloodRequestService.updateRequestStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Blood request status updated to " + status, updated));
    }

    @DeleteMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Delete blood request", description = "Deletes blood request by ID (Admin only)")
    public ResponseEntity<ApiResponse<Void>> deleteRequest(@PathVariable Long id) {
        bloodRequestService.deleteRequest(id);
        return ResponseEntity.ok(ApiResponse.success("Blood request deleted successfully"));
    }
}
