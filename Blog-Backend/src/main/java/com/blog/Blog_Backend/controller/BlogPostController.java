package com.blog.Blog_Backend.controller;

import com.blog.Blog_Backend.entity.BlogPost;
import com.blog.Blog_Backend.entity.User;
import com.blog.Blog_Backend.repository.BlogPostRepository;
import com.blog.Blog_Backend.service.BlogPostService;
import com.blog.Blog_Backend.service.EmailService;
import com.blog.Blog_Backend.service.UserService;
import com.blog.Blog_Backend.utility.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/blogs")
public class BlogPostController {

    @Autowired
    private BlogPostService service;

    @Autowired
    private UserService userService;

    @Autowired
    private BlogPostRepository blogPostRepository;

    @Autowired
    private EmailService emailService;

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<BlogPost> createBlog(
            @RequestPart("title") String title,
            @RequestPart("content") String content,
            @RequestPart(value = "language", required = false) String language,
            @RequestPart(value = "code", required = false) String code,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) {
        String email = SecurityUtils.getCurrentUserEmail();
        if (email == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }

        BlogPost blog = new BlogPost();
        blog.setTitle(title);
        blog.setContent(content);
        blog.setCodeLanguage(language);
        blog.setCodeSnippet(code);
        if (image != null && !image.isEmpty()) {
            try {
                blog.setImage(image.getBytes());
            } catch (Exception e) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to process image");
            }
        }

        BlogPost saved = service.createBlog(email, blog);
        emailService.sendNewBlogNotification(blog.getTitle(), blog.getId(), email);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @PutMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<BlogPost> updateBlog(
            @RequestPart("id") String id,
            @RequestPart("title") String title,
            @RequestPart("content") String content,
            @RequestPart(value = "language", required = false) String language,
            @RequestPart(value = "code", required = false) String code,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) {
        String email = SecurityUtils.getCurrentUserEmail();
        if (email == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
        if (id == null || id.trim().isEmpty()) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }

        BlogPost updates = new BlogPost();
        updates.setId(id);
        updates.setTitle(title);
        updates.setContent(content);
        updates.setCodeLanguage(language);
        updates.setCodeSnippet(code);
        if (image != null && !image.isEmpty()) {
            try {
                updates.setImage(image.getBytes());
            } catch (Exception e) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to process image");
            }
        }

        BlogPost updated = service.updateBlog(email, updates);
        emailService.sendUpdatedBlogNotification(updated.getTitle(), updated.getId(), email);
        return ResponseEntity.ok(updated);
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllBlogs() {
        List<BlogPost> blogs = service.getAllBlogs();

        Set<String> authorEmails = blogs.stream()
                .map(BlogPost::getAuthorEmail)
                .collect(Collectors.toSet());
        Map<String, User> authors = userService.getUsersByEmails(authorEmails);

        Map<String, String> encodedImages = service.getEncodedImages(blogs); // New method for cached encoding

        List<Map<String, Object>> response = new ArrayList<>(blogs.size());
        for (BlogPost blog : blogs) {
            Map<String, Object> blogData = new HashMap<>(12);
            blogData.put("id", blog.getId());
            blogData.put("title", blog.getTitle());
            blogData.put("content", blog.getContent());
            blogData.put("codeLanguage", blog.getCodeLanguage());
            blogData.put("codeSnippet", blog.getCodeSnippet());
            blogData.put("image", encodedImages.get(blog.getId()));
            blogData.put("createdAt", blog.getCreatedAt());
            blogData.put("updatedAt", blog.getUpdatedAt());
            blogData.put("authorEmail", blog.getAuthorEmail());

            User author = authors.get(blog.getAuthorEmail());
            if (author != null) {
                Map<String, Object> authorInfo = new HashMap<>(6);
                authorInfo.put("name", author.getName());
                authorInfo.put("photo", author.getPhoto());
                authorInfo.put("about", author.getAbout());
                authorInfo.put("linkedin", author.getLinkedin());
                authorInfo.put("github", author.getGithub());
                authorInfo.put("twitter", author.getTwitter());
                blogData.put("author", authorInfo);
            }

            response.add(blogData);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{blogId}")
    public ResponseEntity<Map<String, Object>> getBlogById(@PathVariable String blogId) {
        BlogPost blog = service.getBlogById(blogId);

        Set<String> allAuthorEmails = service.extractAuthorEmailsFromComments(blog.getComments());
        allAuthorEmails.add(blog.getAuthorEmail());
        Map<String, User> authors = userService.getUsersByEmails(allAuthorEmails);

        Map<String, String> emailToNameMap = authors.entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, e -> e.getValue().getName()));

        Map<String, Object> response = new HashMap<>(16);
        response.put("id", blog.getId());
        response.put("title", blog.getTitle());
        response.put("content", blog.getContent());
        response.put("codeLanguage", blog.getCodeLanguage());
        response.put("codeSnippet", blog.getCodeSnippet());
        response.put("image", blog.getImage() != null ?
                Base64.getEncoder().encodeToString(blog.getImage()) : null);
        response.put("createdAt", blog.getCreatedAt());
        response.put("updatedAt", blog.getUpdatedAt());
        response.put("authorEmail", blog.getAuthorEmail());

        User author = authors.get(blog.getAuthorEmail());
        if (author == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Author not found");
        }

        Map<String, Object> authorInfo = new HashMap<>(6);
        authorInfo.put("name", author.getName());
        authorInfo.put("photo", author.getPhoto());
        authorInfo.put("about", author.getAbout());
        authorInfo.put("linkedin", author.getLinkedin());
        authorInfo.put("github", author.getGithub());
        authorInfo.put("twitter", author.getTwitter());
        response.put("author", authorInfo);

        response.put("comments", service.transformCommentsWithNames(blog.getComments(), emailToNameMap));

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{blogId}")
    public ResponseEntity<Void> deleteBlog(@PathVariable String blogId) {
        service.deleteBlog(blogId);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @PostMapping("/{blogId}/comments")
    public ResponseEntity<BlogPost> addComment(
            @PathVariable String blogId,
            @RequestBody Map<String, String> commentData
    ) {
        String authorEmail = SecurityUtils.getCurrentUserEmail();
        if (authorEmail == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
        String content = commentData.get("content");
        if (content == null) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        BlogPost updatedBlog = service.addComment(blogId, authorEmail, content);
        return ResponseEntity.ok(updatedBlog);
    }

    @PostMapping("/{blogId}/comments/{parentCommentId}/replies")
    public ResponseEntity<BlogPost> addReply(
            @PathVariable String blogId,
            @PathVariable String parentCommentId,
            @RequestBody Map<String, String> replyData
    ) {
        String authorEmail = SecurityUtils.getCurrentUserEmail();
        if (authorEmail == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
        String content = replyData.get("content");
        if (content == null) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        BlogPost updatedBlog = service.addReply(blogId, parentCommentId, authorEmail, content);
        return ResponseEntity.ok(updatedBlog);
    }

    @DeleteMapping("/{blogId}/comments/{commentId}")
    public ResponseEntity<BlogPost> deleteComment(
            @PathVariable String blogId,
            @PathVariable String commentId
    ) {
        String authorEmail = SecurityUtils.getCurrentUserEmail();
        if (authorEmail == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
        BlogPost updatedBlog = service.deleteComment(blogId, commentId, authorEmail);
        return ResponseEntity.ok(updatedBlog);
    }

    @DeleteMapping("/{blogId}/comments/{commentId}/replies/{replyId}")
    public ResponseEntity<BlogPost> deleteReply(
            @PathVariable String blogId,
            @PathVariable String commentId,
            @PathVariable String replyId
    ) {
        String authorEmail = SecurityUtils.getCurrentUserEmail();
        if (authorEmail == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
        BlogPost updatedBlog = service.deleteReply(blogId, commentId, replyId, authorEmail);
        return ResponseEntity.ok(updatedBlog);
    }
}
