package com.blog.Blog_Backend.repository;

import com.blog.Blog_Backend.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByEmail(String email);

    @Query(value = "{'email': {$in: ?0}}", fields = "{'name': 1, 'email': 1, 'photo': 1, 'about': 1, 'linkedin': 1, 'github': 1, 'twitter': 1}") // Optimized projection
    List<User> findByEmailIn(List<String> emails);
}
