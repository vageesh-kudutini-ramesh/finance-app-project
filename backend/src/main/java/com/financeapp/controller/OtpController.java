package com.financeapp.controller;

import com.financeapp.dto.MessageResponse;
import com.financeapp.dto.OtpRequest;
import com.financeapp.dto.OtpVerifyRequest;
import com.financeapp.service.OtpService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/otp")
public class OtpController {

    @Autowired
    private OtpService otpService;

    /**
     * Endpoint to send OTP to user's email
     * Example: POST /api/otp/send
     */
    @PostMapping("/send")
    public ResponseEntity<MessageResponse> sendOtp(@Valid @RequestBody OtpRequest request) {
        otpService.createAndSendOtp(request.getEmail(), OtpService.PURPOSE_PASSWORD_RESET);
        return ResponseEntity.ok(new MessageResponse("OTP has been sent to your email."));
    }

    /**
     * Endpoint to verify OTP
     * Example: POST /api/otp/verify
     */
    @PostMapping("/verify")
    public ResponseEntity<MessageResponse> verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
        boolean valid = otpService.verifyOtp(request.getEmail(), request.getOtp(), OtpService.PURPOSE_PASSWORD_RESET);

        if (!valid) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Invalid or expired OTP."));
        }

        return ResponseEntity.ok(new MessageResponse("OTP verified successfully."));
    }
}
