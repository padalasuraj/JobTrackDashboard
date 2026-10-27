package com.jobtrack;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity @Table(name = "app_users")
class UserAccount {
    @Id UUID id = UUID.randomUUID();
    @Column(nullable = false, length = 100) String name;
    @Column(nullable = false, unique = true, length = 254) String email;
    @Column(name = "password_hash", length = 100) String passwordHash;
    @Column(name = "google_id", unique = true) String googleId;
    @Column(name = "created_at", nullable = false) Instant createdAt = Instant.now();
    protected UserAccount() {}
}

@Entity @Table(name = "user_sessions")
class UserSession {
    @Id @Column(name = "token_hash", length = 64) String tokenHash;
    @Column(name = "user_id", nullable = false) UUID userId;
    @Column(name = "expires_at", nullable = false) Instant expiresAt;
    protected UserSession() {}
}

@Entity @Table(name = "password_resets")
class PasswordReset {
    @Id @Column(name = "token_hash", length = 64) String tokenHash;
    @Column(name = "user_id", nullable = false) UUID userId;
    @Column(name = "expires_at", nullable = false) Instant expiresAt;
    protected PasswordReset() {}
}

@Entity @Table(name = "applications")
class JobApplication {
    @Id UUID id = UUID.randomUUID();
    @Column(name = "user_id", nullable = false) UUID userId;
    @Column(nullable = false, length = 150) String company;
    @Column(nullable = false, length = 150) String title;
    @Column(nullable = false, length = 100) String salary = "";
    @Column(nullable = false, length = 150) String location = "";
    @Enumerated(EnumType.STRING) @Column(name = "work_mode", nullable = false, length = 20)
    WorkMode workMode = WorkMode.UNSPECIFIED;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    ApplicationStatus status = ApplicationStatus.SAVED;
    @Column(name = "application_url", nullable = false, length = 2048) String applicationUrl;
    @Column(name = "status_url", nullable = false, length = 2048) String statusUrl = "";
    @Column(name = "applied_date") LocalDate appliedDate;
    LocalDate deadline;
    @Column(nullable = false, length = 5000) String notes = "";
    @Column(name = "created_at", nullable = false) Instant createdAt = Instant.now();
    @Column(name = "updated_at", nullable = false) Instant updatedAt = Instant.now();
    protected JobApplication() {}
}

enum ApplicationStatus { SAVED, APPLIED, ASSESSMENT, INTERVIEW, OFFER, REJECTED, WITHDRAWN }
enum WorkMode { REMOTE, HYBRID, ONSITE, UNSPECIFIED }
