package com.blooddonation.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DonorDTO {
    private Long id;
    private Long userId;
    private String name;
    private String email;

    @NotBlank(message = "Blood Group is required (e.g. O+, A+, AB-)")
    private String bloodGroup;

    @NotBlank(message = "Phone number is required")
    private String phone;

    @NotBlank(message = "City is required")
    private String city;

    @Min(value = 18, message = "Donor age must be at least 18")
    private Integer age;

    private String gender;
    private LocalDate lastDonationDate;
    private Boolean available;
    private Boolean approved;
}
