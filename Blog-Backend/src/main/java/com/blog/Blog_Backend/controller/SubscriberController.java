package com.blog.Blog_Backend.controller;

import com.blog.Blog_Backend.entity.Subscriber;
import com.blog.Blog_Backend.repository.SubscriberRepository;
import com.blog.Blog_Backend.utility.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/subscribers")
public class SubscriberController {

    @Autowired
    private SubscriberRepository subscriberRepository;

    @PostMapping("/author/email/{authorEmail}")
    public ResponseEntity<?> subscribeToAuthor(@PathVariable String authorEmail) {
        String email = SecurityUtils.getCurrentUserEmail();
        if (email == null) {
            return new ResponseEntity<>(new ErrorResponse("User not authenticated"), HttpStatus.UNAUTHORIZED);
        }

        try {
            Subscriber subscriber = subscriberRepository.findByEmail(email)
                    .orElseGet(() -> {
                        Subscriber newSubscriber = new Subscriber();
                        newSubscriber.setEmail(email);
                        return newSubscriber;
                    });

            if (subscriber.getSubscribedAuthors().contains(authorEmail)) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(new ErrorResponse("Already subscribed to this author"));
            }

            subscriber.getSubscribedAuthors().add(authorEmail);
            Subscriber savedSubscriber = subscriberRepository.save(subscriber);
            return ResponseEntity.ok(savedSubscriber);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to subscribe: " + e.getMessage()));
        }
    }

    @DeleteMapping("/author/email/{authorEmail}/unsubscribe")
    public ResponseEntity<?> unsubscribeFromAuthor(@PathVariable String authorEmail) {
        String email = SecurityUtils.getCurrentUserEmail();
        if (email == null) {
            return new ResponseEntity<>(new ErrorResponse("User not authenticated"), HttpStatus.UNAUTHORIZED);
        }

        try {
            Subscriber subscriber = subscriberRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Subscriber not found"));

            if (!subscriber.getSubscribedAuthors().contains(authorEmail)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ErrorResponse("Not subscribed to this author"));
            }

            subscriber.getSubscribedAuthors().remove(authorEmail);
            if (subscriber.getSubscribedAuthors().isEmpty()) {
                subscriberRepository.delete(subscriber);
            } else {
                subscriberRepository.save(subscriber);
            }
            return ResponseEntity.ok(new SuccessResponse("Unsubscribed successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to unsubscribe: " + e.getMessage()));
        }
    }

    @GetMapping("/author/email/{authorEmail}/status")
    public ResponseEntity<Map<String, Boolean>> getSubscriptionStatus(@PathVariable String authorEmail) {
        String email = SecurityUtils.getCurrentUserEmail();
        if (email == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }

        boolean isSubscribed = subscriberRepository.findByEmail(email)
                .map(subscriber -> subscriber.getSubscribedAuthors().contains(authorEmail))
                .orElse(false);

        Map<String, Boolean> response = new HashMap<>();
        response.put("isSubscribed", isSubscribed);
        return ResponseEntity.ok(response);
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
