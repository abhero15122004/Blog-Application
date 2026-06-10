package com.blog.Blog_Backend.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import org.springframework.data.annotation.Id;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class Comment {
    @Id
    private String id;
    private String authorEmail;
    private String content;
    private Date createdAt;

    @JsonManagedReference
    private List<Comment> replies = new ArrayList<>();

    public Comment() {
    }

    public Comment(String id, String authorEmail, String content, Date createdAt, List<Comment> replies) {
        this.id = id;
        this.authorEmail = authorEmail;
        this.content = content;
        this.createdAt = createdAt;
        this.replies = replies;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getAuthorEmail() {
        return authorEmail;
    }

    public void setAuthorEmail(String authorEmail) {
        this.authorEmail = authorEmail;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public List<Comment> getReplies() {
        return replies;
    }

    public void setReplies(List<Comment> replies) {
        this.replies = replies;
    }
}
