# Blood Donation System - Spring Boot REST API Backend

A production-ready **Java Spring Boot 3** REST API backend for the **Blood Donation System**, built with Spring Data JPA (PostgreSQL / MySQL / H2), Spring Security with JWT Authentication & BCrypt, Rate Limiting, OpenAPI (Swagger UI), and Docker containerization.

---

## 🚀 Features

- **User Module**: Register, Login, View Profile, Update Profile, Change Password.
- **Donor Module**: Add donor, update donor, delete donor, search donors by `bloodGroup`, `city`, and `availability`.
- **Blood Request Module**: Create blood request, accept/reject request, update status (`PENDING`, `ACCEPTED`, `REJECTED`, `COMPLETED`, `CANCELLED`), track request.
- **Hospital Module**: Register hospital profiles, manage blood requests.
- **Admin Module**: Dashboard metrics, user role management, donor approvals, system report generation.
- **Security & Performance**:
  - JWT (JSON Web Token) stateless authentication.
  - BCrypt password hashing.
  - Role-based Access Control (`ROLE_ADMIN`, `ROLE_DONOR`, `ROLE_HOSPITAL`, `ROLE_USER`).
  - Rate limiting filter on auth endpoints.
  - Standardized JSON responses with `ApiResponse<T>` and global exception handling.
- **API Documentation**: Interactive OpenAPI 3 / Swagger UI at `/swagger-ui.html`.

---

## 🛠️ Technology Stack

- **Framework**: Spring Boot 3.2.3 (Java 17)
- **Security**: Spring Security + JJWT 0.12.5
- **ORM / Database**: Spring Data JPA / Hibernate (PostgreSQL / MySQL / H2 fallback)
- **Documentation**: Springdoc OpenAPI 2.3.0
- **Build & Containerization**: Maven, Docker, Docker Compose

---

## 📂 Project Structure

```
spring-boot-backend
 ├── Dockerfile
 ├── docker-compose.yml
 ├── pom.xml
 └── src/main
      ├── java/com/blooddonation
      │    ├── config/          # SecurityConfig, RateLimiterFilter, OpenApiConfig, DataInitializer
      │    ├── controller/      # AuthController, UserController, DonorController, BloodRequestController, HospitalController, AdminController
      │    ├── dto/             # RegisterRequest, LoginRequest, JwtResponse, DonorDTO, BloodRequestDTO, etc.
      │    ├── entity/          # User, Donor, BloodRequest, Hospital, Donation, Role, BloodGroup, RequestStatus
      │    ├── exception/       # ResourceNotFoundException, BadRequestException, GlobalExceptionHandler
      │    ├── repository/      # UserRepository, DonorRepository, BloodRequestRepository, HospitalRepository, DonationRepository
      │    ├── security/        # JwtUtils, JwtAuthenticationFilter, UserPrincipal, UserDetailsServiceImpl, AuthEntryPointJwt
      │    ├── service/         # AuthService, UserService, DonorService, BloodRequestService, HospitalService, AdminService
      │    └── BloodDonationApplication.java
      └── resources
           └── application.properties
```

---

## ⚡ Quick Start & Running Locally

### Option 1: Run with Docker Compose (Recommended)
```bash
# Build and launch Spring Boot app + PostgreSQL database
docker-compose up --build
```
Access Swagger UI at: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

### Option 2: Run with Maven (Local JDK 17)
```bash
# Clean and package
mvn clean package

# Run application
mvn spring-boot:run
```

---

## 📡 REST API Endpoints Overview

| Method | Endpoint | Description | Access |
|---|---|---|---|
| **POST** | `/api/auth/register` | Register new user | Public |
| **POST** | `/api/auth/login` | Authenticate user & get JWT token | Public |
| **GET** | `/api/users/profile` | Get current user profile | Authenticated |
| **PUT** | `/api/users/profile` | Update profile information | Authenticated |
| **PUT** | `/api/users/change-password` | Change password | Authenticated |
| **GET** | `/api/donors` | List all donors | Public |
| **GET** | `/api/donors/{id}` | Get donor by ID | Public |
| **GET** | `/api/donors/search?bloodGroup=O+&city=Hyderabad` | Search donors by blood group/city | Public |
| **POST** | `/api/donors` | Register as donor | Authenticated |
| **PUT** | `/api/donors/{id}` | Update donor details | Donor / Admin |
| **DELETE** | `/api/donors/{id}` | Delete donor | Admin |
| **POST** | `/api/requests` | Create emergency blood request | Authenticated |
| **GET** | `/api/requests` | List all blood requests | Public |
| **PUT** | `/api/requests/{id}/status?status=ACCEPTED` | Accept / Reject / Update request status | Donor / Hospital / Admin |
| **POST** | `/api/hospitals` | Register hospital profile | Authenticated |
| **GET** | `/api/hospitals` | List all hospitals | Public |
| **GET** | `/api/admin/dashboard` | Dashboard metrics | Admin |
| **GET** | `/api/admin/users` | List all registered users | Admin |
| **PUT** | `/api/admin/donors/{id}/approve` | Approve donor profile | Admin |
| **GET** | `/api/admin/reports` | Analytics & system reports | Admin |

---

## 🗝️ Default Seed Credentials

Upon initial startup, the application auto-populates demo accounts for quick testing:

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@blooddonation.org` | `admin123` |
| **Donor** | `rajesh@gmail.com` | `donor123` |
| **Donor** | `priya@gmail.com` | `donor123` |
| **Hospital** | `apollo@hospital.org` | `hospital123` |
