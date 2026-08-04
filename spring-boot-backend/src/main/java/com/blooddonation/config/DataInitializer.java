package com.blooddonation.config;

import com.blooddonation.entity.*;
import com.blooddonation.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DonorRepository donorRepository;

    @Autowired
    private BloodRequestRepository bloodRequestRepository;

    @Autowired
    private HospitalRepository hospitalRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            // Seed Admin User
            User admin = User.builder()
                    .name("System Administrator")
                    .email("admin@blooddonation.org")
                    .password(passwordEncoder.encode("admin123"))
                    .role(Role.ROLE_ADMIN)
                    .build();
            userRepository.save(admin);

            // Seed Regular Donor User
            User donorUser1 = User.builder()
                    .name("Rajesh Kumar")
                    .email("rajesh@gmail.com")
                    .password(passwordEncoder.encode("donor123"))
                    .role(Role.ROLE_DONOR)
                    .build();
            userRepository.save(donorUser1);

            Donor donor1 = Donor.builder()
                    .user(donorUser1)
                    .bloodGroup(BloodGroup.O_POSITIVE)
                    .phone("+91-9876543210")
                    .city("Hyderabad")
                    .age(28)
                    .gender("Male")
                    .available(true)
                    .approved(true)
                    .lastDonationDate(LocalDate.now().minusMonths(4))
                    .build();
            donorRepository.save(donor1);

            // Seed Second Donor User
            User donorUser2 = User.builder()
                    .name("Priya Sharma")
                    .email("priya@gmail.com")
                    .password(passwordEncoder.encode("donor123"))
                    .role(Role.ROLE_DONOR)
                    .build();
            userRepository.save(donorUser2);

            Donor donor2 = Donor.builder()
                    .user(donorUser2)
                    .bloodGroup(BloodGroup.A_POSITIVE)
                    .phone("+91-9123456789")
                    .city("Hyderabad")
                    .age(25)
                    .gender("Female")
                    .available(true)
                    .approved(true)
                    .lastDonationDate(LocalDate.now().minusMonths(6))
                    .build();
            donorRepository.save(donor2);

            // Seed Hospital User
            User hospitalUser = User.builder()
                    .name("Apollo Hospital Admin")
                    .email("apollo@hospital.org")
                    .password(passwordEncoder.encode("hospital123"))
                    .role(Role.ROLE_HOSPITAL)
                    .build();
            userRepository.save(hospitalUser);

            Hospital hospital = Hospital.builder()
                    .hospitalName("Apollo Hospital")
                    .address("Jubilee Hills, Hyderabad")
                    .phone("+91-40-23607777")
                    .user(hospitalUser)
                    .build();
            hospitalRepository.save(hospital);

            // Seed Sample Blood Requests
            BloodRequest request1 = BloodRequest.builder()
                    .patientName("Suresh Rao")
                    .bloodGroup(BloodGroup.O_POSITIVE)
                    .units(2)
                    .hospital("Apollo Hospital")
                    .city("Hyderabad")
                    .status(RequestStatus.PENDING)
                    .requestedBy(donorUser1)
                    .build();
            bloodRequestRepository.save(request1);

            BloodRequest request2 = BloodRequest.builder()
                    .patientName("Ananya Verma")
                    .bloodGroup(BloodGroup.A_POSITIVE)
                    .units(3)
                    .hospital("Yashoda Hospital")
                    .city("Hyderabad")
                    .status(RequestStatus.PENDING)
                    .requestedBy(donorUser2)
                    .build();
            bloodRequestRepository.save(request2);
        }
    }
}
