package com.financeapp.service;

public interface OtpService {

    String PURPOSE_PASSWORD_RESET = "PASSWORD_RESET";

    void createAndSendOtp(String email, String purpose);

    boolean verifyOtp(String email, String otp, String purpose);

    default void createAndSendPasswordResetOtp(String email) {
        createAndSendOtp(email, PURPOSE_PASSWORD_RESET);
    }
}
