package com.jobtrack;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import jakarta.persistence.LockModeType;

interface UserRepository extends JpaRepository<UserAccount, UUID> {
    Optional<UserAccount> findByEmail(String email);
    Optional<UserAccount> findByGoogleId(String googleId);
}
interface SessionRepository extends JpaRepository<UserSession, String> {
    void deleteByUserId(UUID userId);
    void deleteByExpiresAtBefore(Instant date);
}
interface PasswordResetRepository extends JpaRepository<PasswordReset, String> {
    void deleteByUserId(UUID userId);
    void deleteByExpiresAtBefore(Instant date);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from PasswordReset p where p.tokenHash = :hash")
    Optional<PasswordReset> findLocked(String hash);
}
interface ApplicationRepository extends JpaRepository<JobApplication, UUID>, JpaSpecificationExecutor<JobApplication> {
    Optional<JobApplication> findByIdAndUserId(UUID id, UUID userId);
    long countByUserId(UUID userId);
    long countByUserIdAndStatus(UUID userId, ApplicationStatus status);
    long countByUserIdAndStatusIn(UUID userId, List<ApplicationStatus> statuses);
    List<JobApplication> findByUserIdOrderByUpdatedAtDesc(UUID userId);
}
