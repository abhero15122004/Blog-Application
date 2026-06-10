package com.blog.Blog_Backend.repository;

import com.blog.Blog_Backend.entity.OTP;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface OTPRepository extends MongoRepository<OTP, String> {
    Optional<OTP> findByEmailAndCodeAndUsedFalse(String email, String code);

    void deleteByEmail(String email);
}
