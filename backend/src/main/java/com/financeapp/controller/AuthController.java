package com.financeapp.controller;

import com.financeapp.dto.*;
import com.financeapp.entity.User;
import com.financeapp.repository.UserRepository;
import com.financeapp.security.JwtUtils;
import com.financeapp.service.OtpService;
import com.financeapp.service.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired private AuthenticationManager authenticationManager;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder encoder;
    @Autowired private JwtUtils jwtUtils;
    @Autowired private OtpService otpService;

    // ================= LOGIN =================
    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsernameOrEmail(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        return ResponseEntity.ok(new JwtResponse(
                jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail()
        ));
    }

    // ================= SIGNUP =================
    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {

        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Username is already taken!"));
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Email is already in use!"));
        }

        if (!signUpRequest.getPassword().equals(signUpRequest.getConfirmPassword())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Passwords do not match!"));
        }

        // Create user entity (confirmPassword is not saved)
        User user = new User(
                signUpRequest.getUsername(),
                signUpRequest.getEmail(),
                encoder.encode(signUpRequest.getPassword())
        );
        user.setFirstName(signUpRequest.getFirstName());
        user.setLastName(signUpRequest.getLastName());

        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
    }

    // ================= REQUEST OTP FOR PASSWORD RESET =================
    @PostMapping("/forgot-password/send-otp")
    public ResponseEntity<?> sendOtp(@Valid @RequestBody SendOtpRequest req) {
        userRepository.findByEmail(req.getEmail()).ifPresent(user ->
                otpService.createAndSendPasswordResetOtp(req.getEmail())
        );
        return ResponseEntity.ok(new MessageResponse("If the email exists, an OTP has been sent."));
    }

    // ================= VERIFY OTP =================
    @PostMapping("/forgot-password/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody VerifyOtpRequest req) {
        boolean ok = otpService.verifyOtp(req.getEmail(), OtpService.PURPOSE_PASSWORD_RESET, req.getOtp());
        if (!ok) {
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid or expired OTP"));
        }
        return ResponseEntity.ok(new MessageResponse("OTP verified successfully"));
    }

    // ================= RESET PASSWORD =================
    @PostMapping("/forgot-password/reset")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        if (!req.getNewPassword().equals(req.getConfirmNewPassword())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Passwords do not match"));
        }

        boolean ok = otpService.verifyOtp(req.getEmail(), OtpService.PURPOSE_PASSWORD_RESET, req.getOtp());
        if (!ok) {
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid or expired OTP"));
        }

        return userRepository.findByEmail(req.getEmail())
                .map(user -> {
                    user.setPassword(encoder.encode(req.getNewPassword()));
                    userRepository.save(user);
                    return ResponseEntity.ok(new MessageResponse("Password changed successfully"));
                })
                .orElseGet(() -> ResponseEntity.badRequest().body(new MessageResponse("User not found")));
    }
}
