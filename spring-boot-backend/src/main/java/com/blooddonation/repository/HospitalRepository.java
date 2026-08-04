package com.blooddonation.repository;

import com.blooddonation.entity.Hospital;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HospitalRepository extends JpaRepository<Hospital, Long> {
    Optional<Hospital> findByUserId(Long userId);
    Boolean existsByHospitalNameIgnoreCase(String hospitalName);
}
