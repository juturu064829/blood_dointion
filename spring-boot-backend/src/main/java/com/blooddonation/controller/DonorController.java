package com.blooddonation.controller;

import com.blooddonation.dto.ApiResponse;
import com.blooddonation.dto.DonorDTO;
import com.blooddonation.service.DonorService;
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
@RequestMapping("/api/donors")
@Tag(name = "Donor Module", description = "Donor registration, search, and management endpoints")
public class DonorController {

    @Autowired
    private DonorService donorService;

    @GetMapping
    @Operation(summary = "List all donors", description = "Returns all registered donors")
    public ResponseEntity<ApiResponse<List<DonorDTO>>> getAllDonors() {
        List<DonorDTO> donors = donorService.getAllDonors();
        return ResponseEntity.ok(ApiResponse.success("Donors fetched successfully", donors));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get donor by ID", description = "Returns single donor by donor ID")
    public ResponseEntity<ApiResponse<DonorDTO>> getDonorById(@PathVariable Long id) {
        DonorDTO donor = donorService.getDonorById(id);
        return ResponseEntity.ok(ApiResponse.success("Donor fetched successfully", donor));
    }

    @GetMapping("/search")
    @Operation(summary = "Search donors by Blood Group and City", description = "Searches donors with filtering parameters: bloodGroup, city, availability")
    public ResponseEntity<ApiResponse<List<DonorDTO>>> searchDonors(
            @RequestParam(required = false) String bloodGroup,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Boolean available) {
        List<DonorDTO> donors = donorService.searchDonors(bloodGroup, city, available);
        return ResponseEntity.ok(ApiResponse.success("Donors search results fetched", donors));
    }

    @PostMapping
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Register as donor", description = "Registers authenticated user as a blood donor")
    public ResponseEntity<ApiResponse<DonorDTO>> addDonor(
            @Valid @RequestBody DonorDTO donorDTO,
            Authentication authentication) {
        DonorDTO created = donorService.addDonor(donorDTO, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Donor registered successfully", created));
    }

    @PutMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAnyAuthority('ROLE_DONOR', 'ROLE_ADMIN')")
    @Operation(summary = "Update donor details", description = "Updates donor details by ID")
    public ResponseEntity<ApiResponse<DonorDTO>> updateDonor(
            @PathVariable Long id,
            @RequestBody DonorDTO donorDTO) {
        DonorDTO updated = donorService.updateDonor(id, donorDTO);
        return ResponseEntity.ok(ApiResponse.success("Donor updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Delete donor", description = "Deletes donor by ID (Admin only)")
    public ResponseEntity<ApiResponse<Void>> deleteDonor(@PathVariable Long id) {
        donorService.deleteDonor(id);
        return ResponseEntity.ok(ApiResponse.success("Donor deleted successfully"));
    }
}
