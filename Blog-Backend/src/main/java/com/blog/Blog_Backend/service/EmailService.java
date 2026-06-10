package com.blog.Blog_Backend.service;

import com.blog.Blog_Backend.entity.GeneralSubscriber;
import com.blog.Blog_Backend.entity.Notification;
import com.blog.Blog_Backend.entity.Subscriber;
import com.blog.Blog_Backend.repository.GeneralSubscriberRepository;
import com.blog.Blog_Backend.repository.NotificationRepository;
import com.blog.Blog_Backend.repository.SubscriberRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.ErrorManager;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private SubscriberRepository subscriberRepository;

    @Autowired
    private GeneralSubscriberRepository generalSubscriberRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Value("${app.frontend.base-url}")
    private String frontendBaseUrl;

    @Autowired
    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
        if (mailSender instanceof JavaMailSenderImpl) {
            JavaMailSenderImpl impl = (JavaMailSenderImpl) mailSender;
            impl.getJavaMailProperties().setProperty("mail.smtp.connectiontimeout", "10000");
            impl.getJavaMailProperties().setProperty("mail.smtp.timeout", "10000");
            impl.getJavaMailProperties().setProperty("mail.smtp.writetimeout", "10000");
        }
    }

    private void configureMailSession() {
        if (mailSender instanceof JavaMailSenderImpl) {
            JavaMailSenderImpl impl = (JavaMailSenderImpl) mailSender;
            impl.getJavaMailProperties().setProperty("mail.smtp.auth", "true");
            impl.getJavaMailProperties().setProperty("mail.smtp.starttls.enable", "true");
        }
    }

    @Async
    public void sendNewBlogNotification(String blogTitle, String blogId, String authorEmail) {
        logger.info("⏳ Sending notifications for new blog: {}", blogTitle);
        List<Notification> notifications = new ArrayList<>();

        List<Subscriber> authorSubscribers = subscriberRepository.findBySubscribedAuthorsContaining(authorEmail);
        for (Subscriber subscriber : authorSubscribers) {
            notifications.add(createNotification(blogTitle, blogId, authorEmail, subscriber.getEmail()));
        }

        List<GeneralSubscriber> generalSubscribers = generalSubscriberRepository.findAll();
        for (GeneralSubscriber subscriber : generalSubscribers) {
            notifications.add(createNotification(blogTitle, blogId, authorEmail, subscriber.getEmail()));
        }

        notificationRepository.saveAll(notifications);

        for (Subscriber subscriber : authorSubscribers) {
            sendEmailAsync(
                    subscriber.getEmail(),
                    "New Blog Posted by Your Subscribed Author",
                    createNewBlogEmailContent(blogTitle, blogId, subscriber.getEmail(), authorEmail, true)
            );
        }

        for (GeneralSubscriber subscriber : generalSubscribers) {
            sendEmailAsync(
                    subscriber.getEmail(),
                    "New Blog Posted on AIDEN",
                    createNewBlogEmailContent(blogTitle, blogId, subscriber.getEmail(), null, false)
            );
        }

        logger.info("📬 Sent to {} subscribers", authorSubscribers.size() + generalSubscribers.size());
    }

    @Async
    public void sendUpdatedBlogNotification(String blogTitle, String blogId, String authorEmail) {
        List<Notification> notifications = new ArrayList<>();

        List<Subscriber> authorSubscribers = subscriberRepository.findBySubscribedAuthorsContaining(authorEmail);
        for (Subscriber subscriber : authorSubscribers) {
            notifications.add(createNotification(blogTitle, blogId, authorEmail, subscriber.getEmail()));
        }

        List<GeneralSubscriber> generalSubscribers = generalSubscriberRepository.findAll();
        for (GeneralSubscriber subscriber : generalSubscribers) {
            notifications.add(createNotification(blogTitle, blogId, authorEmail, subscriber.getEmail()));
        }

        notificationRepository.saveAll(notifications);

        for (Subscriber subscriber : authorSubscribers) {
            sendEmailAsync(
                    subscriber.getEmail(),
                    "Blog Updated by Your Subscribed Author",
                    createUpdatedBlogEmailContent(blogTitle, blogId, subscriber.getEmail(), authorEmail, true)
            );
        }

        for (GeneralSubscriber subscriber : generalSubscribers) {
            sendEmailAsync(
                    subscriber.getEmail(),
                    "Blog Updated on AIDEN",
                    createUpdatedBlogEmailContent(blogTitle, blogId, subscriber.getEmail(), null, false)
            );
        }
    }

    @Async
    public void sendEmailAsync(String to, String subject, String htmlContent) {
        MimeMessage message = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (Exception e) {
            logger.error("Failed to send email to {}", to, e);
        }
    }

    private Notification createNotification(String blogTitle, String blogId, String authorEmail, String userEmail) {
        Notification notification = new Notification();
        notification.setUserEmail(userEmail);
        notification.setBlogId(blogId);
        notification.setAuthorEmail(authorEmail);
        notification.setBlogTitle(blogTitle);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setRead(false);
        return notification;
    }

    public void sendEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send email to " + to + ": " + e.getMessage());
        }
    }

    private String trimmedBaseUrl() {
        return frontendBaseUrl.endsWith("/")
                ? frontendBaseUrl.substring(0, frontendBaseUrl.length() - 1)
                : frontendBaseUrl;
    }

    private String buildUnsubscribeUrl(String email, String authorEmail, boolean isAuthorSpecific) {
        String encodedEmail = URLEncoder.encode(email, StandardCharsets.UTF_8);
        String base = trimmedBaseUrl();
        return isAuthorSpecific
                ? base + "/unsubscribe/author?email=" + encodedEmail
                + "&authorEmail=" + URLEncoder.encode(authorEmail, StandardCharsets.UTF_8)
                : base + "/unsubscribe/general?email=" + encodedEmail;
    }

    private String createNewBlogEmailContent(String blogTitle, String blogId, String email, String authorEmail, boolean isAuthorSpecific) {
        String unsubscribeUrl = buildUnsubscribeUrl(email, authorEmail, isAuthorSpecific);
        String blogUrl = trimmedBaseUrl() + "/blog/" + blogId;
        String message = isAuthorSpecific
                ? "A new blog titled <strong>" + blogTitle + "</strong> has been posted by your subscribed author."
                : "A new blog titled <strong>" + blogTitle + "</strong> has been posted on AIDEN.";
        String unsubscribeText = isAuthorSpecific
                ? "Unsubscribe from this author"
                : "Unsubscribe from AIDEN updates";

        return "<html>" +
                "<body style='font-family: Arial, sans-serif; color: #333;'>" +
                "<h2>New Blog Posted on AIDEN!</h2>" +
                "<p>" + message + "</p>" +
                "<p>Read it now: <a href='" + blogUrl + "' style='color: #4B6CB7; text-decoration: none;'>View Blog</a></p>" +
                "<p>Stay tuned for more updates!</p>" +
                "<p><small><a href='" + unsubscribeUrl + "' style='color: #999;'>" + unsubscribeText + "</a></small></p>" +
                "</body>" +
                "</html>";
    }

    private String createUpdatedBlogEmailContent(String blogTitle, String blogId, String email, String authorEmail, boolean isAuthorSpecific) {
        String unsubscribeUrl = buildUnsubscribeUrl(email, authorEmail, isAuthorSpecific);
        String blogUrl = trimmedBaseUrl() + "/blog/" + blogId;
        String message = isAuthorSpecific
                ? "The blog titled <strong>" + blogTitle + "</strong> has been updated by your subscribed author."
                : "The blog titled <strong>" + blogTitle + "</strong> has been updated on AIDEN.";
        String unsubscribeText = isAuthorSpecific
                ? "Unsubscribe from this author"
                : "Unsubscribe from AIDEN updates";

        return "<html>" +
                "<body style='font-family: Arial, sans-serif; color: #333;'>" +
                "<h2>Blog Updated on AIDEN!</h2>" +
                "<p>" + message + "</p>" +
                "<p>Check out the updates: <a href='" + blogUrl + "' style='color: #4B6CB7; text-decoration: none;'>View Blog</a></p>" +
                "<p>Stay tuned for more updates!</p>" +
                "<p><small><a href='" + unsubscribeUrl + "' style='color: #999;'>" + unsubscribeText + "</a></small></p>" +
                "</body>" +
                "</html>";
    }
}