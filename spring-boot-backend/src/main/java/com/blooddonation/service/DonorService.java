package com.blooddonation.service;

import com.blooddonation.dto.DonorDTO;
import com.blooddonation.entity.BloodGroup;
import com.blooddonation.entity.Donor;
import com.blooddonation.entity.Role;
import com.blooddonation.entity.User;
import com.blooddonation.exception.BadRequestException;
import com.blooddonation.exception.ResourceNotFoundException;
import com.blooddonation.repository.DonorRepository;
import com.blooddonation.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DonorService {

    @Autowired
    private DonorRepository donorRepository;

    @Autowired
    private UserRepository userRepository;

    public List<DonorDTO> getAllDonors() {
        return donorRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public DonorDTO getDonorById(Long id) {
        Donor donor = donorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Donor", "id", id));
        return mapToDTO(donor);
    }

    public DonorDTO addDonor(DonorDTO dto, String currentUserEmail) {
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", currentUserEmail));

        if (donorRepository.findByUser(user).isPresent()) {
            throw new BadRequestException("User is already registered as a donor");
        }

        user.setRole(Role.ROLE_DONOR);
        userRepository.save(user);

        Donor donor = Donor.builder()
                .user(user)
                .bloodGroup(BloodGroup.fromString(dto.getBloodGroup()))
                .phone(dto.getPhone())
                .city(dto.getCity())
                .age(dto.getAge())
                .gender(dto.getGender())
                .lastDonationDate(dto.getLastDonationDate())
                .available(dto.getAvailable() != null ? dto.getAvailable() : true)
                .approved(true)
                .build();

        Donor saved = donorRepository.save(donor);
        return mapToDTO(saved);
    }

    public DonorDTO updateDonor(Long id, DonorDTO dto) {
        Donor donor = donorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Donor", "id", id));

        if (dto.getBloodGroup() != null) {
            donor.setBloodGroup(BloodGroup.fromString(dto.getBloodGroup()));
        }
        if (dto.getPhone() != null) donor.setPhone(dto.getPhone());
        if (dto.getCity() != null) donor.setCity(dto.getCity());
        if (dto.getAge() != null) donor.setAge(dto.getAge());
        if (dto.getGender() != null) donor.setGender(dto.getGender());
        if (dto.getLastDonationDate() != null) donor.setLastDonationDate(dto.getLastDonationDate());
        if (dto.getAvailable() != null) donor.setAvailable(dto.getAvailable());

        Donor updated = donorRepository.save(donor);
        return mapToDTO(updated);
    }

    public void deleteDonor(Long id) {
        Donor donor = donorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Donor", "id", id));
        donorRepository.delete(donor);
    }

    public List<DonorDTO> searchDonors(String bloodGroupStr, String city, Boolean available) {
        BloodGroup bloodGroup = null;
        if (bloodGroupStr != null && !bloodGroupStr.trim().isEmpty()) {
            bloodGroup = BloodGroup.fromString(bloodGroupStr);
        }

        return donorRepository.searchDonors(bloodGroup, city, available).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private DonorDTO mapToDTO(Donor donor) {
        return DonorDTO.builder()
                .id(donor.getId())
                .userId(donor.getUser() != null ? donor.getUser().getId() : null)
                .name(donor.getUser() != null ? donor.getUser().getName() : null)
                .email(donor.getUser() != null ? donor.getUser().getEmail() : null)
                .bloodGroup(donor.getBloodGroup() != null ? donor.getBloodGroup().getValue() : null)
                .phone(donor.getPhone())
                .city(donor.getCity())
                .age(donor.getAge())
                .gender(donor.getGender())
                .lastDonationDate(donor.getLastDonationDate())
                .available(donor.getAvailable())
                .approved(donor.getApproved())
                .build();
    }
}
