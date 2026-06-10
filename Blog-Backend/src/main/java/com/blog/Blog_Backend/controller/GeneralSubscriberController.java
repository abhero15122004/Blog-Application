package com.blog.Blog_Backend.controller;

import com.blog.Blog_Backend.entity.GeneralSubscriber;
import com.blog.Blog_Backend.repository.GeneralSubscriberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/general-subscribers")
public class GeneralSubscriberController {

    @Autowired
    private GeneralSubscriberRepository generalSubscriberRepository;

    @PostMapping
    public ResponseEntity<?> subscribe(@RequestBody GeneralSubscriber subscriber) {
        try {
            if (subscriber.getEmail() == null || subscriber.getEmail().isEmpty()) {
                return ResponseEntity.badRequest().body(new ErrorResponse("Email is required"));
            }

            if (generalSubscriberRepository.existsByEmail(subscriber.getEmail())) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(new ErrorResponse("Email is already subscribed"));
            }

            GeneralSubscriber savedSubscriber = generalSubscriberRepository.save(subscriber);
            return ResponseEntity.ok(savedSubscriber);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to subscribe: " + e.getMessage()));
        }
    }

    @DeleteMapping("/unsubscribe")
    public ResponseEntity<?> unsubscribe(@RequestParam String email) {
        try {
            if (email == null || email.isEmpty()) {
                return ResponseEntity.badRequest().body(new ErrorResponse("Email is required"));
            }

            GeneralSubscriber subscriber = generalSubscriberRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Subscriber not found"));
            generalSubscriberRepository.delete(subscriber);
            return ResponseEntity.ok(new SuccessResponse("Unsubscribed successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to unsubscribe: " + e.getMessage()));
        }
    }

    static class ErrorResponse {
        private String message;

        public ErrorResponse(String message) {
            this.message = message;
        }

        public String getMessage() {
            return message;
        }
    }

    static class SuccessResponse {
        private String message;

        public SuccessResponse(String message) {
            this.message = message;
        }

        public String getMessage() {
            return message;
        }
    }
}
