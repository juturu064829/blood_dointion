package com.blooddonation.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "donations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Donation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "donor_id", nullable = false)
    private Donor donor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id")
    private BloodRequest request;

    @Column(name = "donation_date", nullable = false)
    private LocalDateTime donationDate;

    private String notes;

    @PrePersist
    protected void onCreate() {
        if (this.donationDate == null) {
            this.donationDate = LocalDateTime.now();
        }
    }
}
