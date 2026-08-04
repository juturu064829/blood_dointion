package com.blooddonation.repository;

import com.blooddonation.entity.Donation;
import com.blooddonation.entity.Donor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DonationRepository extends JpaRepository<Donation, Long> {
    List<Donation> findByDonor(Donor donor);
    List<Donation> findByDonorId(Long donorId);
    List<Donation> findByRequestId(Long requestId);
}
