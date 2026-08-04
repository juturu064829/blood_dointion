package com.blooddonation.service;

import com.blooddonation.dto.HospitalDTO;
import com.blooddonation.entity.Hospital;
import com.blooddonation.entity.Role;
import com.blooddonation.entity.User;
import com.blooddonation.exception.ResourceNotFoundException;
import com.blooddonation.repository.HospitalRepository;
import com.blooddonation.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class HospitalService {

    @Autowired
    private HospitalRepository hospitalRepository;

    @Autowired
    private UserRepository userRepository;

    public List<HospitalDTO> getAllHospitals() {
        return hospitalRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public HospitalDTO getHospitalById(Long id) {
        Hospital hospital = hospitalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital", "id", id));
        return mapToDTO(hospital);
    }

    public HospitalDTO registerHospital(HospitalDTO dto, String userEmail) {
        User user = null;
        if (userEmail != null) {
            user = userRepository.findByEmail(userEmail).orElse(null);
            if (user != null) {
                user.setRole(Role.ROLE_HOSPITAL);
                userRepository.save(user);
            }
        }

        Hospital hospital = Hospital.builder()
                .hospitalName(dto.getHospitalName())
                .address(dto.getAddress())
                .phone(dto.getPhone())
                .user(user)
                .build();

        Hospital saved = hospitalRepository.save(hospital);
        return mapToDTO(saved);
    }

    public HospitalDTO updateHospital(Long id, HospitalDTO dto) {
        Hospital hospital = hospitalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital", "id", id));

        if (dto.getHospitalName() != null) hospital.setHospitalName(dto.getHospitalName());
        if (dto.getAddress() != null) hospital.setAddress(dto.getAddress());
        if (dto.getPhone() != null) hospital.setPhone(dto.getPhone());

        Hospital updated = hospitalRepository.save(hospital);
        return mapToDTO(updated);
    }

    private HospitalDTO mapToDTO(Hospital hospital) {
        return HospitalDTO.builder()
                .id(hospital.getId())
                .hospitalName(hospital.getHospitalName())
                .address(hospital.getAddress())
                .phone(hospital.getPhone())
                .userId(hospital.getUser() != null ? hospital.getUser().getId() : null)
                .build();
    }
}
