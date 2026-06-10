package com.blog.Blog_Backend.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "subscribers")
public class Subscriber {

    @Id
    private String id;

    @Indexed(unique = true)
    private String email;

    @Indexed
    private List<String> subscribedAuthors = new ArrayList<>();

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public List<String> getSubscribedAuthors() {
        return subscribedAuthors;
    }

    public void setSubscribedAuthors(List<String> subscribedAuthors) {
        this.subscribedAuthors = subscribedAuthors != null ? subscribedAuthors : new ArrayList<>();
    }
}
