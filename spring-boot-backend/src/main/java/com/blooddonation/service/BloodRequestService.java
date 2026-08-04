package com.blooddonation.service;

import com.blooddonation.dto.BloodRequestDTO;
import com.blooddonation.entity.BloodGroup;
import com.blooddonation.entity.BloodRequest;
import com.blooddonation.entity.RequestStatus;
import com.blooddonation.entity.User;
import com.blooddonation.exception.ResourceNotFoundException;
import com.blooddonation.repository.BloodRequestRepository;
import com.blooddonation.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class BloodRequestService {

    @Autowired
    private BloodRequestRepository bloodRequestRepository;

    @Autowired
    private UserRepository userRepository;

    public List<BloodRequestDTO> getAllRequests() {
        return bloodRequestRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public BloodRequestDTO getRequestById(Long id) {
        BloodRequest request = bloodRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BloodRequest", "id", id));
        return mapToDTO(request);
    }

    public BloodRequestDTO createRequest(BloodRequestDTO dto, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        BloodRequest request = BloodRequest.builder()
                .patientName(dto.getPatientName())
                .bloodGroup(BloodGroup.fromString(dto.getBloodGroup()))
                .units(dto.getUnits())
                .hospital(dto.getHospital())
                .city(dto.getCity())
                .status(RequestStatus.PENDING)
                .requestedBy(user)
                .build();

        BloodRequest saved = bloodRequestRepository.save(request);
        return mapToDTO(saved);
    }

    public BloodRequestDTO updateRequest(Long id, BloodRequestDTO dto) {
        BloodRequest request = bloodRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BloodRequest", "id", id));

        if (dto.getPatientName() != null) request.setPatientName(dto.getPatientName());
        if (dto.getBloodGroup() != null) request.setBloodGroup(BloodGroup.fromString(dto.getBloodGroup()));
        if (dto.getUnits() != null) request.setUnits(dto.getUnits());
        if (dto.getHospital() != null) request.setHospital(dto.getHospital());
        if (dto.getCity() != null) request.setCity(dto.getCity());

        BloodRequest updated = bloodRequestRepository.save(request);
        return mapToDTO(updated);
    }

    public BloodRequestDTO updateRequestStatus(Long id, String statusStr) {
        BloodRequest request = bloodRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BloodRequest", "id", id));

        RequestStatus newStatus = RequestStatus.valueOf(statusStr.toUpperCase());
        request.setStatus(newStatus);

        BloodRequest updated = bloodRequestRepository.save(request);
        return mapToDTO(updated);
    }

    public void deleteRequest(Long id) {
        BloodRequest request = bloodRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BloodRequest", "id", id));
        bloodRequestRepository.delete(request);
    }

    private BloodRequestDTO mapToDTO(BloodRequest request) {
        return BloodRequestDTO.builder()
                .id(request.getId())
                .patientName(request.getPatientName())
                .bloodGroup(request.getBloodGroup() != null ? request.getBloodGroup().getValue() : null)
                .units(request.getUnits())
                .hospital(request.getHospital())
                .city(request.getCity())
                .status(request.getStatus().name())
                .requestedById(request.getRequestedBy() != null ? request.getRequestedBy().getId() : null)
                .requestedByName(request.getRequestedBy() != null ? request.getRequestedBy().getName() : null)
                .createdAt(request.getCreatedAt())
                .build();
    }
}
