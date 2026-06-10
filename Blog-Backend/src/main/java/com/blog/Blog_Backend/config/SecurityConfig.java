package com.blog.Blog_Backend.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private UserDetailsService userDetailsService;

    private final UnifiedOAuth2UserService unifiedOAuth2UserService;

    private final CustomAuthenticationEntryPoint customAuthenticationEntryPoint;

    @Value("${app.cors.allowed-origins}")
    private List<String> allowedOrigins;

    @Value("${app.oauth.success-url}")
    private String oauthSuccessUrl;

    @Value("${app.oauth.failure-url}")
    private String oauthFailureUrl;

    public SecurityConfig(UnifiedOAuth2UserService unifiedOAuth2UserService, CustomAuthenticationEntryPoint customAuthenticationEntryPoint) {
        this.unifiedOAuth2UserService = unifiedOAuth2UserService;
        this.customAuthenticationEntryPoint = customAuthenticationEntryPoint;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/login/**", "/oauth2/**").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/users").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/blogs").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/users/verify").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/users/resend-otp").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/blogs/{blogId}").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/blogs").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/blogs").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/blogs/{blogId}").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/blogs/{blogId}/comments").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/blogs/{blogId}/comments/{parentCommentId}/replies").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/users/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/users/**").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/api/users/**").authenticated()
                        .requestMatchers("/api/notifications/**").authenticated()
                        .anyRequest().permitAll()
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                )
                .userDetailsService(userDetailsService)
                .httpBasic(Customizer.withDefaults())
                .exceptionHandling(exceptions ->
                        exceptions.authenticationEntryPoint(customAuthenticationEntryPoint)
                )
                .oauth2Login(oauth -> oauth
                        .userInfoEndpoint(ue -> ue
                                .userService(unifiedOAuth2UserService::loadUser)
                                .oidcUserService(unifiedOAuth2UserService::loadUser)
                        )
                        .defaultSuccessUrl(oauthSuccessUrl, true)
                        .failureUrl(oauthFailureUrl)
                );
        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(Arrays.asList("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
