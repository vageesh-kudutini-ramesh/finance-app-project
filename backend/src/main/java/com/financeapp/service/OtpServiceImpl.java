package com.financeapp.service;

import com.financeapp.entity.Otp;
import com.financeapp.repository.OtpRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;

@Service
public class OtpServiceImpl implements OtpService {

    @Autowired
    private OtpRepository otpRepository;

    @Autowired
    private EmailService emailService;

    private static final int EXPIRY_MINUTES = 5;

    @Override
    public void createAndSendOtp(String email, String purpose) {
        // Generate 6-digit OTP
        String otpCode = String.format("%06d", new Random().nextInt(999999));

        Otp otp = new Otp();
        otp.setEmail(email);
        otp.setOtp(otpCode);
        otp.setPurpose(purpose);
        otp.setExpiryTime(LocalDateTime.now().plusMinutes(EXPIRY_MINUTES));
        otp.setVerified(false);

        otpRepository.save(otp);

        // Send OTP via email
        emailService.send(email, "Your OTP for " + purpose,
                "Your OTP is: " + otpCode + " (valid for 5 minutes)");
    }

    @Override
    public boolean verifyOtp(String email, String purpose, String otp) {
        Otp otpEntity = otpRepository.findTopByEmailAndPurposeOrderByExpiryTimeDesc(email, purpose)
                .orElse(null);

        if (otpEntity == null) return false;

        // Check OTP and expiry
        if (!otpEntity.getOtp().equals(otp) || otpEntity.getExpiryTime().isBefore(LocalDateTime.now())) {
            return false;
        }

        // Mark OTP as verified
        otpEntity.setVerified(true);
        otpRepository.save(otpEntity);

        return true;
    }
}
