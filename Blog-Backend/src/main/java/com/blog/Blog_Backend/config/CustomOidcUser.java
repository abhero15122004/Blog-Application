package com.blog.Blog_Backend.config;

import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

import java.util.Map;

public class CustomOidcUser extends UserPrincipal implements OidcUser {
    private final OidcUser oidcUser;

    public CustomOidcUser(UserPrincipal principal, OidcUser oidcUser) {
        super(principal.getUser(), oidcUser.getAttributes());
        this.oidcUser = oidcUser;
    }

    @Override
    public Map<String, Object> getClaims() {
        return oidcUser.getClaims();
    }

    @Override
    public OidcUserInfo getUserInfo() {
        return oidcUser.getUserInfo();
    }

    @Override
    public OidcIdToken getIdToken() {
        return oidcUser.getIdToken();
    }
}
