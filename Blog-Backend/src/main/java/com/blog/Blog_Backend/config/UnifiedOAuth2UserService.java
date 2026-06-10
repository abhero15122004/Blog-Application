package com.blog.Blog_Backend.config;

import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;

public interface UnifiedOAuth2UserService {
    OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException;

    OidcUser loadUser(OidcUserRequest request) throws OAuth2AuthenticationException;
}
