package com.blog.Blog_Backend.repository;

import com.blog.Blog_Backend.entity.BlogPost;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface BlogPostRepository extends MongoRepository<BlogPost, String> {

    List<BlogPost> findByAuthorEmail(String email);
}
