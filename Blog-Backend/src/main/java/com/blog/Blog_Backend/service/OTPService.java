package com.blog.Blog_Backend.service;

import com.blog.Blog_Backend.entity.OTP;
import com.blog.Blog_Backend.repository.OTPRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class OTPService {

    @Autowired
    private OTPRepository otpRepository;

    @Autowired
    private EmailService emailService;

    private static final int OTP_LENGTH = 4;
    private static final int OTP_EXPIRY_MINUTES = 5;

    private String generateOTP() {
        SecureRandom random = new SecureRandom();
        StringBuilder otp = new StringBuilder();
        for (int i = 0; i < OTP_LENGTH; i++) {
            otp.append(random.nextInt(10));
        }
        return otp.toString();
    }

    public void sendOTP(String email) {
        otpRepository.deleteByEmail(email);

        String code = generateOTP();
        System.out.println("\n🔑 [SECURITY] Generated OTP for " + email + ": " + code + "\n");
        LocalDateTime now = LocalDateTime.now();
        OTP otp = new OTP(email, code, now, now.plusMinutes(OTP_EXPIRY_MINUTES));
        otpRepository.save(otp);

        String subject = "Verify Your AIDEN Account";
        String htmlContent = "<html>" +
                "<body style='font-family: Arial, sans-serif; color: #333;'>" +
                "<h2>Welcome to AIDEN!</h2>" +
                "<p>Please use the following 4-digit code to verify your account:</p>" +
                "<p style='font-size: 24px; font-weight: bold; color: #4B6CB7;'>" + code + "</p>" +
                "<p>This code will expire in " + OTP_EXPIRY_MINUTES + " minutes.</p>" +
                "<p>If you did not request this, please ignore this email.</p>" +
                "</body>" +
                "</html>";
        emailService.sendEmail(email, subject, htmlContent);
    }

    public boolean verifyOTP(String email, String code) {
        Optional<OTP> otpOpt = otpRepository.findByEmailAndCodeAndUsedFalse(email, code);
        if (otpOpt.isEmpty()) {
            return false;
        }
        OTP otp = otpOpt.get();
        if (otp.getExpiresAt().isBefore(LocalDateTime.now()) || otp.isUsed()) {
            return false;
        }
        otp.setUsed(true);
        otpRepository.save(otp);
        return true;
    }
}