package com.blooddonation.service;

import com.blooddonation.dto.AdminReportDTO;
import com.blooddonation.dto.BloodRequestDTO;
import com.blooddonation.dto.DashboardStatsDTO;
import com.blooddonation.dto.UserProfileDTO;
import com.blooddonation.entity.*;
import com.blooddonation.exception.ResourceNotFoundException;
import com.blooddonation.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DonorRepository donorRepository;

    @Autowired
    private BloodRequestRepository bloodRequestRepository;

    @Autowired
    private HospitalRepository hospitalRepository;

    public DashboardStatsDTO getDashboardStats() {
        long totalUsers = userRepository.count();
        long totalDonors = donorRepository.count();
        long approvedDonors = donorRepository.findByApproved(true).size();
        long totalRequests = bloodRequestRepository.count();
        long pendingRequests = bloodRequestRepository.countByStatus(RequestStatus.PENDING);
        long acceptedRequests = bloodRequestRepository.countByStatus(RequestStatus.ACCEPTED);
        long totalHospitals = hospitalRepository.count();

        Map<String, Long> bloodGroupCounts = new HashMap<>();
        for (BloodGroup bg : BloodGroup.values()) {
            long count = donorRepository.searchDonors(bg, null, null).size();
            bloodGroupCounts.put(bg.getValue(), count);
        }

        return DashboardStatsDTO.builder()
                .totalUsers(totalUsers)
                .totalDonors(totalDonors)
                .totalApprovedDonors(approvedDonors)
                .totalRequests(totalRequests)
                .pendingRequests(pendingRequests)
                .acceptedRequests(acceptedRequests)
                .totalHospitals(totalHospitals)
                .bloodGroupCounts(bloodGroupCounts)
                .build();
    }

    public List<UserProfileDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> UserProfileDTO.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .role(user.getRole().name())
                        .build())
                .collect(Collectors.toList());
    }

    public UserProfileDTO updateUserRole(Long userId, String roleName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Role newRole = Role.valueOf(roleName.toUpperCase().startsWith("ROLE_") ? roleName.toUpperCase() : "ROLE_" + roleName.toUpperCase());
        user.setRole(newRole);

        User saved = userRepository.save(user);
        return UserProfileDTO.builder()
                .id(saved.getId())
                .name(saved.getName())
                .email(saved.getEmail())
                .role(saved.getRole().name())
                .build();
    }

    public void approveDonor(Long donorId, boolean approved) {
        Donor donor = donorRepository.findById(donorId)
                .orElseThrow(() -> new ResourceNotFoundException("Donor", "id", donorId));

        donor.setApproved(approved);
        donorRepository.save(donor);
    }

    public AdminReportDTO generateReports() {
        Map<String, Long> requestsByStatus = new HashMap<>();
        for (RequestStatus status : RequestStatus.values()) {
            requestsByStatus.put(status.name(), bloodRequestRepository.countByStatus(status));
        }

        Map<String, Long> donorsByBloodGroup = new HashMap<>();
        for (BloodGroup bg : BloodGroup.values()) {
            donorsByBloodGroup.put(bg.getValue(), (long) donorRepository.searchDonors(bg, null, null).size());
        }

        List<BloodRequestDTO> recentRequests = bloodRequestRepository.findAll().stream()
                .limit(10)
                .map(req -> BloodRequestDTO.builder()
                        .id(req.getId())
                        .patientName(req.getPatientName())
                        .bloodGroup(req.getBloodGroup() != null ? req.getBloodGroup().getValue() : null)
                        .units(req.getUnits())
                        .hospital(req.getHospital())
                        .city(req.getCity())
                        .status(req.getStatus().name())
                        .createdAt(req.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return AdminReportDTO.builder()
                .requestsByStatus(requestsByStatus)
                .donorsByBloodGroup(donorsByBloodGroup)
                .recentRequests(recentRequests)
                .build();
    }
}
