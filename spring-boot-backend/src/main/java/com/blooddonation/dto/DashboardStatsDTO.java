package com.blooddonation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsDTO {
    private long totalUsers;
    private long totalDonors;
    private long totalApprovedDonors;
    private long totalRequests;
    private long pendingRequests;
    private long acceptedRequests;
    private long totalHospitals;
    private Map<String, Long> bloodGroupCounts;
}
