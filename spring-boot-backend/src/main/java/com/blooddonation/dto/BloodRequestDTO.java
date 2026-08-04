package com.blooddonation.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BloodRequestDTO {
    private Long id;

    @NotBlank(message = "Patient name is required")
    private String patientName;

    @NotBlank(message = "Blood Group is required")
    private String bloodGroup;

    @NotNull(message = "Units count is required")
    @Min(value = 1, message = "At least 1 unit is required")
    private Integer units;

    @NotBlank(message = "Hospital name is required")
    private String hospital;

    @NotBlank(message = "City is required")
    private String city;

    private String status;
    private Long requestedById;
    private String requestedByName;
    private LocalDateTime createdAt;
}
