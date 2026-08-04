package com.blooddonation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DonationDTO {
    private Long id;
    private Long donorId;
    private String donorName;
    private String donorBloodGroup;
    private Long requestId;
    private LocalDateTime donationDate;
    private String notes;
}
