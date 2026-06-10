package com.blog.Blog_Backend.repository;

import com.blog.Blog_Backend.entity.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByUserEmailAndIsReadFalse(String userEmail);

    List<Notification> findByUserEmail(String userEmail);
}
