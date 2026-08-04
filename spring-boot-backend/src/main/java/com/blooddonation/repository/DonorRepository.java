package com.blooddonation.repository;

import com.blooddonation.entity.BloodGroup;
import com.blooddonation.entity.Donor;
import com.blooddonation.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DonorRepository extends JpaRepository<Donor, Long>, JpaSpecificationExecutor<Donor> {
    Optional<Donor> findByUser(User user);
    Optional<Donor> findByUserId(Long userId);

    @Query("SELECT d FROM Donor d WHERE " +
           "(:bloodGroup IS NULL OR d.bloodGroup = :bloodGroup) AND " +
           "(:city IS NULL OR LOWER(d.city) LIKE LOWER(CONCAT('%', :city, '%'))) AND " +
           "(:available IS NULL OR d.available = :available) AND " +
           "(d.approved = true)")
    List<Donor> searchDonors(@Param("bloodGroup") BloodGroup bloodGroup,
                             @Param("city") String city,
                             @Param("available") Boolean available);

    List<Donor> findByApproved(Boolean approved);
}
