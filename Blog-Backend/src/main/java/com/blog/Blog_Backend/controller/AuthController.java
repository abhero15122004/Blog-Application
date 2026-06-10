package com.blog.Blog_Backend.controller;

import com.blog.Blog_Backend.utility.SecurityUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @GetMapping("/check")
    public ResponseEntity<Map<String, Boolean>> checkAuthentication() {
        String email = SecurityUtils.getCurrentUserEmail();
        boolean isAuthenticated = email != null;
        return ResponseEntity.ok(Map.of("isAuthenticated", isAuthenticated));
    }
}
