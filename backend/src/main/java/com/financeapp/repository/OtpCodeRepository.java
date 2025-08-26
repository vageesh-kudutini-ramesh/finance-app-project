package com.financeapp.repository;

import com.financeapp.entity.OtpCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OtpCodeRepository extends JpaRepository<OtpCode, Long> {
    Optional<OtpCode> findTopByPhoneE164OrderByCreatedAtDesc(String phoneE164);
    Optional<OtpCode> findByPhoneE164AndResetTokenAndVerifiedIsTrueAndConsumedIsFalse(String phoneE164, String resetToken);
    void deleteByPhoneE164(String phoneE164);
}
