package com.blog.Blog_Backend.service;

import com.blog.Blog_Backend.entity.BlogPost;
import com.blog.Blog_Backend.entity.Comment;
import com.blog.Blog_Backend.entity.User;
import com.blog.Blog_Backend.repository.BlogPostRepository;
import com.blog.Blog_Backend.utility.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class BlogPostService {

    @Autowired
    private BlogPostRepository repo;

    @Autowired
    private UserService userService;

    @Cacheable(value = "blogs", key = "#blogs.hashCode()")
    public Map<String, String> getEncodedImages(List<BlogPost> blogs) {
        Map<String, String> encodedImages = new HashMap<>();
        for (BlogPost blog : blogs) {
            if (blog.getImage() != null) {
                encodedImages.put(blog.getId(), Base64.getEncoder().encodeToString(blog.getImage()));
            }
        }
        return encodedImages;
    }

    private List<Comment> transformComments(List<Comment> comments) {
        List<Comment> transformed = new ArrayList<>();
        Deque<Comment> stack = new ArrayDeque<>(comments);
        while (!stack.isEmpty()) {
            Comment comment = stack.pop();
            Comment transformedComment = new Comment();
            transformedComment.setId(comment.getId());
            transformedComment.setContent(comment.getContent());
            User author = userService.getUserByEmail(comment.getAuthorEmail());
            transformedComment.setAuthorEmail(author.getName());
            transformedComment.setCreatedAt(comment.getCreatedAt());
            transformedComment.setReplies(transformComments(comment.getReplies()));
            transformed.add(transformedComment);
        }
        return transformed;
    }

    public BlogPost createBlog(String email, BlogPost blog) {
        String currentUserEmail = SecurityUtils.getCurrentUserEmail();
        if (currentUserEmail == null || !currentUserEmail.equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized to create a blog for this user");
        }
        blog.setAuthorEmail(email);
        return repo.save(blog);
    }

    public BlogPost updateBlog(String email, BlogPost updates) {
        String currentUserEmail = SecurityUtils.getCurrentUserEmail();
        if (currentUserEmail == null || !currentUserEmail.equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized to update this blog");
        }

        BlogPost existing = repo.findById(updates.getId())
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Blog not found")
                );
        if (!existing.getAuthorEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized to update this blog");
        }
        existing.setTitle(updates.getTitle());
        existing.setContent(updates.getContent());
        existing.setCodeLanguage(updates.getCodeLanguage());
        existing.setCodeSnippet(updates.getCodeSnippet());
        if (updates.getImage() != null) {
            existing.setImage(updates.getImage());
        }
        if (updates.getComments() != null) {
            existing.setComments(updates.getComments());
        }
        return repo.save(existing);
    }

    public List<BlogPost> getAllBlogs() {
        return repo.findAll();
    }

    public BlogPost getBlogById(String blogId) {
        BlogPost blog = repo.findById(blogId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Blog not found"));

        return blog;
    }

    public List<BlogPost> getBlogsByAuthorEmail(String email) {
        return repo.findByAuthorEmail(email);
    }

    public void deleteBlog(String blogId) {
        BlogPost blog = repo.findById(blogId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Blog not found"));
        String currentUserEmail = SecurityUtils.getCurrentUserEmail();
        if (currentUserEmail == null || !currentUserEmail.equals(blog.getAuthorEmail())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized to delete this blog");
        }
        repo.deleteById(blogId);
    }

    public BlogPost addComment(String blogId, String authorEmail, String content) {
        String currentUserEmail = SecurityUtils.getCurrentUserEmail();
        if (currentUserEmail == null || !currentUserEmail.equals(authorEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized to comment as this user");
        }

        BlogPost blog = repo.findById(blogId)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Blog not found")
                );
        Comment comment = new Comment();
        comment.setId(UUID.randomUUID().toString());
        comment.setContent(content);
        comment.setAuthorEmail(authorEmail);
        blog.getComments().add(comment);
        return repo.save(blog);
    }

    public BlogPost addReply(String blogId, String parentCommentId, String authorEmail, String content) {
        String currentUserEmail = SecurityUtils.getCurrentUserEmail();
        if (currentUserEmail == null || !currentUserEmail.equals(authorEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized to reply as this user");
        }

        BlogPost blog = repo.findById(blogId)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Blog not found")
                );

        Comment parentComment = findCommentById(blog.getComments(), parentCommentId);
        if (parentComment == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Parent comment not found");
        }

        Comment reply = new Comment();
        reply.setId(UUID.randomUUID().toString());
        reply.setContent(content);
        reply.setAuthorEmail(authorEmail);

        parentComment.getReplies().add(reply);

        return repo.save(blog);
    }

    private Comment findCommentById(List<Comment> comments, String commentId) {
        for (Comment comment : comments) {
            if (comment.getId().equals(commentId)) {
                return comment;
            }
            Comment found = findCommentById(comment.getReplies(), commentId);
            if (found != null) {
                return found;
            }
        }
        return null;
    }

    public BlogPost deleteComment(String blogId, String commentId, String authorEmail) {
        String currentUserEmail = SecurityUtils.getCurrentUserEmail();
        if (currentUserEmail == null || !currentUserEmail.equals(authorEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized to delete this comment");
        }

        BlogPost blog = repo.findById(blogId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Blog not found"));

        Comment comment = findCommentById(blog.getComments(), commentId);
        if (comment == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found");
        }
        if (!comment.getAuthorEmail().equals(authorEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized to delete this comment");
        }

        blog.getComments().removeIf(c -> c.getId().equals(commentId));
        return repo.save(blog);
    }

    public BlogPost deleteReply(String blogId, String commentId, String replyId, String authorEmail) {
        String currentUserEmail = SecurityUtils.getCurrentUserEmail();
        if (currentUserEmail == null || !currentUserEmail.equals(authorEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized to delete this reply");
        }

        BlogPost blog = repo.findById(blogId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Blog not found"));

        Comment parentComment = findCommentById(blog.getComments(), commentId);
        if (parentComment == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Parent comment not found");
        }

        Comment reply = parentComment.getReplies().stream()
                .filter(r -> r.getId().equals(replyId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reply not found"));

        if (!reply.getAuthorEmail().equals(authorEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized to delete this reply");
        }

        parentComment.getReplies().removeIf(r -> r.getId().equals(replyId));
        return repo.save(blog);
    }

    public Set<String> extractAuthorEmailsFromComments(List<Comment> comments) {
        Set<String> emails = new HashSet<>();
        if (comments == null) return emails;

        for (Comment comment : comments) {
            emails.add(comment.getAuthorEmail());
            emails.addAll(extractAuthorEmailsFromComments(comment.getReplies()));
        }
        return emails;
    }

    public List<Map<String, Object>> transformCommentsWithNames(List<Comment> comments, Map<String, String> emailToNameMap) {
        List<Map<String, Object>> transformed = new ArrayList<>();
        Deque<Comment> stack = new ArrayDeque<>(comments);
        Map<Comment, Map<String, Object>> commentMap = new HashMap<>();

        while (!stack.isEmpty()) {
            Comment current = stack.pop();
            if (commentMap.containsKey(current)) continue;

            Map<String, Object> commentData = new HashMap<>();
            commentData.put("id", current.getId());
            commentData.put("content", current.getContent());
            commentData.put("author", emailToNameMap.getOrDefault(current.getAuthorEmail(), "Unknown"));
            commentData.put("createdAt", current.getCreatedAt());
            commentData.put("replies", new ArrayList<>());

            commentMap.put(current, commentData);

            for (Comment reply : current.getReplies()) {
                stack.push(reply);
            }
        }

        for (Comment comment : commentMap.keySet()) {
            Map<String, Object> commentData = commentMap.get(comment);
            List<Map<String, Object>> replyData = new ArrayList<>();
            for (Comment reply : comment.getReplies()) {
                replyData.add(commentMap.get(reply));
            }
            commentData.put("replies", replyData);
        }

        for (Comment topLevel : comments) {
            transformed.add(commentMap.get(topLevel));
        }

        return transformed;
    }

}
