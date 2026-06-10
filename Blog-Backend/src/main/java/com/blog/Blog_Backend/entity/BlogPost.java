package com.blog.Blog_Backend.entity;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Document(collection = "blogposts")
@CompoundIndex(name = "author_email_idx", def = "{'authorEmail': 1}")
public class BlogPost {
    @Id
    private String id;
    private String title;
    private String authorEmail;
    private String content;
    private String codeLanguage;
    private String codeSnippet;
    private byte[] image;
    private List<Comment> comments = new ArrayList<>();
    @CreatedDate
    private Date createdAt;
    @LastModifiedDate
    private Date updatedAt;

    public BlogPost() {
    }

    public BlogPost(String id,
                    String title,
                    String authorEmail,
                    String content,
                    String codeLanguage,
                    String codeSnippet,
                    byte[] image,
                    List<Comment> comments,
                    Date createdAt,
                    Date updatedAt) {
        this.id = id;
        this.title = title;
        this.authorEmail = authorEmail;
        this.content = content;
        this.codeLanguage = codeLanguage;
        this.codeSnippet = codeSnippet;
        this.image = image;
        this.comments = comments;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
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

    public String getCodeLanguage() {
        return codeLanguage;
    }

    public void setCodeLanguage(String codeLanguage) {
        this.codeLanguage = codeLanguage;
    }

    public String getCodeSnippet() {
        return codeSnippet;
    }

    public void setCodeSnippet(String codeSnippet) {
        this.codeSnippet = codeSnippet;
    }

    public byte[] getImage() {
        return image;
    }

    public void setImage(byte[] image) {
        this.image = image;
    }

    public List<Comment> getComments() {
        return comments;
    }

    public void setComments(List<Comment> comments) {
        this.comments = comments;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Date getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
    }
}
