package com.blog.Blog_Backend.config;

import com.blog.Blog_Backend.entity.User;
import com.blog.Blog_Backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class CustomOAuth2UserService implements UnifiedOAuth2UserService {

    private static final Logger logger = LoggerFactory.getLogger(CustomOAuth2UserService.class);

    private final UserRepository userRepo;
    private final RestTemplate restTemplate;
    private final OidcUserService oidcDelegate = new OidcUserService();
    private final DefaultOAuth2UserService oauth2Delegate = new DefaultOAuth2UserService();

    public CustomOAuth2UserService(UserRepository userRepo, RestTemplate restTemplate) {
        this.userRepo = userRepo;
        this.restTemplate = restTemplate;
        logger.info("CustomOAuth2UserService initialized");
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest req) throws OAuth2AuthenticationException {
        OAuth2User oauthUser = oauth2Delegate.loadUser(req);
        return processUser(req, oauthUser);
    }

    @Override
    public OidcUser loadUser(OidcUserRequest req) throws OAuth2AuthenticationException {
        OidcUser oidcUser = oidcDelegate.loadUser(req);
        return (OidcUser) processUser(req, oidcUser);
    }

    private OAuth2User processUser(OAuth2UserRequest req, OAuth2User oauthUser) {
        String provider = req.getClientRegistration().getRegistrationId();
        logger.info("OAuth login attempt from provider: {}", provider);
        logger.debug("OAuth attributes: {}", oauthUser.getAttributes());

        String email = oauthUser.getAttribute("email");
        String name = oauthUser.getAttribute("name");

        if ("github".equals(provider)) {
            if (email == null) {
                email = fetchGitHubEmail(req.getAccessToken().getTokenValue());
                if (email == null) {
                    email = oauthUser.getAttribute("login") + "@users.noreply.github.com";
                }
            }
        } else if ("google".equals(provider)) {
            Map<String, Object> attributes = oauthUser.getAttributes();
            email = (String) attributes.get("email");
            name = (String) attributes.get("name");

            if (name == null) {
                String givenName = oauthUser.getAttribute("given_name");
                String familyName = oauthUser.getAttribute("family_name");
                name = (givenName != null ? givenName : "") + " " + (familyName != null ? familyName : "");
            }
        }

        if (email == null) {
            logger.error("Email not found in OAuth2 user attributes for provider: {}", provider);
            throw new OAuth2AuthenticationException("Email not found in OAuth2 user attributes");
        }

        String finalEmail = email;
        String finalName = name;
        User user = userRepo.findByEmail(email).map(existingUser -> {
            existingUser.setName(Objects.toString(finalName, existingUser.getName()));
            existingUser.setVerified(true);
            return userRepo.save(existingUser);
        }).orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(finalEmail);
            newUser.setName(Objects.toString(finalName, "User"));
            newUser.setVerified(true);
            newUser.setPassword("OAUTH_PASSWORD");
            return userRepo.save(newUser);
        });

        logger.info("OAuth user processed: {}", user.getEmail());

        if (oauthUser instanceof OidcUser) {
            return new CustomOidcUser(new UserPrincipal(user, oauthUser.getAttributes()), (OidcUser) oauthUser);
        }

        return new UserPrincipal(user, oauthUser.getAttributes());
    }

    private String fetchGitHubEmail(String accessToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + accessToken);
            headers.set("Accept", "application/vnd.github.v3+json");

            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    "https://api.github.com/user/emails",
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {
                    }
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody().stream()
                        .filter(email -> Boolean.TRUE.equals(email.get("primary")))
                        .filter(email -> Boolean.TRUE.equals(email.get("verified")))
                        .map(email -> (String) email.get("email"))
                        .findFirst()
                        .orElse(null);
            }
            return null;
        } catch (Exception e) {
            logger.error("Error fetching GitHub emails", e);
            return null;
        }
    }
}
