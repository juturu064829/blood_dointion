package com.blooddonation.repository;

import com.blooddonation.entity.BloodGroup;
import com.blooddonation.entity.BloodRequest;
import com.blooddonation.entity.RequestStatus;
import com.blooddonation.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BloodRequestRepository extends JpaRepository<BloodRequest, Long> {
    List<BloodRequest> findByRequestedBy(User user);
    List<BloodRequest> findByStatus(RequestStatus status);
    List<BloodRequest> findByBloodGroup(BloodGroup bloodGroup);
    List<BloodRequest> findByCityIgnoreCase(String city);
    long countByStatus(RequestStatus status);
}
