package com.blooddonation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminReportDTO {
    private Map<String, Long> requestsByStatus;
    private Map<String, Long> donorsByCity;
    private Map<String, Long> donorsByBloodGroup;
    private List<BloodRequestDTO> recentRequests;
}
