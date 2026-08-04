package com.blooddonation.controller;

import com.blooddonation.dto.ApiResponse;
import com.blooddonation.dto.HospitalDTO;
import com.blooddonation.service.HospitalService;
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
@RequestMapping("/api/hospitals")
@Tag(name = "Hospital Module", description = "Hospital registration and management endpoints")
public class HospitalController {

    @Autowired
    private HospitalService hospitalService;

    @GetMapping
    @Operation(summary = "Get all registered hospitals", description = "Lists all registered hospitals")
    public ResponseEntity<ApiResponse<List<HospitalDTO>>> getAllHospitals() {
        List<HospitalDTO> hospitals = hospitalService.getAllHospitals();
        return ResponseEntity.ok(ApiResponse.success("Hospitals fetched successfully", hospitals));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get hospital by ID", description = "Returns hospital details by ID")
    public ResponseEntity<ApiResponse<HospitalDTO>> getHospitalById(@PathVariable Long id) {
        HospitalDTO hospital = hospitalService.getHospitalById(id);
        return ResponseEntity.ok(ApiResponse.success("Hospital fetched successfully", hospital));
    }

    @PostMapping
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_HOSPITAL', 'ROLE_USER')")
    @Operation(summary = "Register hospital", description = "Registers a new hospital profile")
    public ResponseEntity<ApiResponse<HospitalDTO>> registerHospital(
            @Valid @RequestBody HospitalDTO dto,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        HospitalDTO registered = hospitalService.registerHospital(dto, email);
        return ResponseEntity.ok(ApiResponse.success("Hospital registered successfully", registered));
    }

    @PutMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_HOSPITAL')")
    @Operation(summary = "Update hospital details", description = "Updates hospital contact and address information")
    public ResponseEntity<ApiResponse<HospitalDTO>> updateHospital(
            @PathVariable Long id,
            @RequestBody HospitalDTO dto) {
        HospitalDTO updated = hospitalService.updateHospital(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Hospital updated successfully", updated));
    }
}
