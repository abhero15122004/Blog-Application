package com.blog.Blog_Backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class TestController {

    @Autowired
    private MongoTemplate mongoTemplate;

    @GetMapping("/test-collections")
    public Map<String, Integer> testAllCollections() {
        Map<String, Integer> counts = new HashMap<>();
        counts.put("blogposts", (int) mongoTemplate.count(new Query(), "blogposts"));
        counts.put("notifications", (int) mongoTemplate.count(new Query(), "notifications"));
        counts.put("otps", (int) mongoTemplate.count(new Query(), "otps"));
        counts.put("subscribers", (int) mongoTemplate.count(new Query(), "subscribers"));
        counts.put("users", (int) mongoTemplate.count(new Query(), "users"));
        counts.put("general_subscribers", (int) mongoTemplate.count(new Query(), "general_subscribers"));
        return counts;
    }
}
