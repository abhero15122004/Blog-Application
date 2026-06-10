package com.blog.Blog_Backend.utility;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;

@Component
public class SecurityUtils {

    public static String getCurrentUserEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;

        Object principal = auth.getPrincipal();

        if (principal instanceof UserDetails ud) {
            return ud.getUsername();
        }

        if (principal instanceof OAuth2User oAuth2User) {
            Object email = oAuth2User.getAttribute("email");
            if (email == null) {
                email = oAuth2User.getAttribute("login");
            }
            return email != null ? email.toString() : null;
        }
        return null;
    }
}
