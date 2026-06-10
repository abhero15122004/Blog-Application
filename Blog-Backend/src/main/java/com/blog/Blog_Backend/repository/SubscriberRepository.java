package com.blog.Blog_Backend.repository;

import com.blog.Blog_Backend.entity.Subscriber;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface SubscriberRepository extends MongoRepository<Subscriber, String> {
    boolean existsByEmail(String email);

    Optional<Subscriber> findByEmail(String email);

    @Query("{ 'subscribedAuthors': ?0 }")
    List<Subscriber> findBySubscribedAuthorsContaining(String authorId);
}
