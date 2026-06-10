package com.blog.Blog_Backend.service;

import com.blog.Blog_Backend.entity.User;
import com.blog.Blog_Backend.repository.UserRepository;
import com.blog.Blog_Backend.utility.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private OTPService otpService;

    public User createUser(User user) {
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already registered");
        }
        if (user.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        user.setVerified(false);
        User savedUser = userRepository.save(user);
        otpService.sendOTP(user.getEmail());
        return savedUser;
    }

    public User verifyUser(String email, String otp) {
        if (!otpService.verifyOTP(email, otp)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired OTP");
        }
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setVerified(true);
        return userRepository.save(user);
    }

    @CachePut(value = "users", key = "#email")
    public User updateUserByEmail(String email, User updates) {
        String currentUserEmail = SecurityUtils.getCurrentUserEmail();
        if (currentUserEmail == null || !currentUserEmail.equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized to update this user");
        }

        User existing = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if ("OAUTH_PASSWORD".equals(existing.getPassword()) && updates.getPassword() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OAuth users cannot set passwords");
        }

        existing.setName(updates.getName());

        if (updates.getPassword() != null && !"OAUTH_PASSWORD".equals(existing.getPassword())) {
            existing.setPassword(passwordEncoder.encode(updates.getPassword()));
        }

        existing.setPhone(updates.getPhone());
        existing.setLinkedin(updates.getLinkedin());
        existing.setGithub(updates.getGithub());
        existing.setTwitter(updates.getTwitter());
        existing.setAbout(updates.getAbout());

        return userRepository.save(existing);
    }

    @CachePut(value = "users", key = "#email")
    public User updateProfilePicByEmail(String email, MultipartFile file) {
        String currentUserEmail = SecurityUtils.getCurrentUserEmail();
        if (currentUserEmail == null || !currentUserEmail.equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized to update this user");
        }

        User existing = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        try {
            existing.setPhoto(file.getBytes());
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unable to read file");
        }
        return userRepository.save(existing);
    }

    @Cacheable(value = "users", key = "#email")
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    public String getLinkedInLinkByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return user.getLinkedin();
    }

    public String getTwitterLinkByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return user.getTwitter();
    }

    public String getGitHubLinkByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return user.getGithub();
    }

    @Cacheable(value = "users", key = "#emails.hashCode()")
    public Map<String, User> getUsersByEmails(Set<String> emails) {
        if (emails.isEmpty()) return Collections.emptyMap();

        return userRepository.findByEmailIn(new ArrayList<>(emails))
                .stream()
                .collect(Collectors.toMap(User::getEmail, Function.identity()));
    }

    public Map<String, String> getUserNamesByEmails(Set<String> emails) {
        return getUsersByEmails(emails).entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> e.getValue().getName())
                );
    }
    @Autowired
    private UserRepository userRepository;
    public void registerUserWithIP(User user, String ipAdress){
        user.setRegisteredIp(ipAdress);
        userRepository.save(user);
    }
    public boolean isIpAllowed(String email, String currentIp){
        User user = userRepository.findByEmail(email).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User Not Found"));
        return user.getRegisteredIp() != null && user.getRegisteredIp().equals(currentIp);
    }

    @Async
    public void sendSecurityAlert(String email, String attemptedIp){
        String htmlContent= "html>" +
                "<body style = font-family: Arial, color: blue;>" +
                "<h2> Sevurity Alert </h2"+
                "<p> A login Attempt was made out of unknown IP address"+
                "</body>"+
                "</html";
        sendEmail(email, subject, htmlContent);
        logger.warn("Security alert sent to {} for IP {}, email, attemptedIP");
    }
}
