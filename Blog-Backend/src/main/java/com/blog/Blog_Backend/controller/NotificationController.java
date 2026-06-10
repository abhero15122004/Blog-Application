package com.blog.Blog_Backend.controller;

import com.blog.Blog_Backend.entity.Notification;
import com.blog.Blog_Backend.repository.NotificationRepository;
import com.blog.Blog_Backend.utility.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<List<Notification>> getAllNotifications() {
        String email = SecurityUtils.getCurrentUserEmail();
        if (email == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
        List<Notification> notifications = notificationRepository.findByUserEmail(email);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/unread")
    public ResponseEntity<List<Notification>> getUnreadNotifications() {
        String email = SecurityUtils.getCurrentUserEmail();
        if (email == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
        List<Notification> notifications = notificationRepository.findByUserEmailAndIsReadFalse(email);
        return ResponseEntity.ok(notifications);
    }

    @PostMapping("/mark-read")
    public ResponseEntity<?> markAllNotificationsAsRead() {
        String email = SecurityUtils.getCurrentUserEmail();
        if (email == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
        List<Notification> notifications = notificationRepository.findByUserEmailAndIsReadFalse(email);
        notifications.forEach(notification -> notification.setRead(true));
        notificationRepository.saveAll(notifications);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/mark-read")
    public ResponseEntity<?> markNotificationAsRead(@PathVariable String id) {
        String email = SecurityUtils.getCurrentUserEmail();
        if (email == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        if (!notification.getUserEmail().equals(email)) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        notification.setRead(true);
        notificationRepository.save(notification);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable String id) {
        String email = SecurityUtils.getCurrentUserEmail();
        if (email == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        if (!notification.getUserEmail().equals(email)) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        notificationRepository.delete(notification);
        return ResponseEntity.ok().build();
    }
}
