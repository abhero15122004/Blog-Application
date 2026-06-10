package com.blog.Blog_Backend.repository;

import com.blog.Blog_Backend.entity.GeneralSubscriber;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface GeneralSubscriberRepository extends MongoRepository<GeneralSubscriber, String> {
    boolean existsByEmail(String email);

    Optional<GeneralSubscriber> findByEmail(String email);
}
