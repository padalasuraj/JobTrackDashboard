package com.jobtrack;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

@RestController
@RequestMapping("/api/auth")
class AuthController {
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    private final UserRepository users;
    private final SessionService sessions;
    private final PasswordEncoder passwords;
    private final AppProperties properties;
    private final RateLimiter limiter;
    private final RecoveryService recovery;
    private final RestClient http;
    private final String dummyHash;

    AuthController(UserRepository users, SessionService sessions, PasswordEncoder passwords,
                   AppProperties properties, RateLimiter limiter, RecoveryService recovery) {
        this.users = users; this.sessions = sessions; this.passwords = passwords;
        this.properties = properties; this.limiter = limiter; this.recovery = recovery;
        var client = java.net.http.HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(8)).build();
        var factory = new JdkClientHttpRequestFactory(client); factory.setReadTimeout(Duration.ofSeconds(12));
        this.http = RestClient.builder().requestFactory(factory).build();
        this.dummyHash = passwords.encode(Tokens.random());
    }

    record RegisterInput(@NotBlank @Size(min = 2, max = 100) String name,
                         @NotBlank @Email @Size(max = 254) String email,
                         @NotBlank @Size(min = 10, max = 128) String password) {
        @Override public String toString() { return "RegisterInput[redacted]"; }
    }
    record LoginInput(@NotBlank @Email @Size(max = 254) String email,
                      @NotBlank @Size(max = 128) String password) {
        @Override public String toString() { return "LoginInput[redacted]"; }
    }
    record ForgotInput(@NotBlank @Email @Size(max = 254) String email) {}
    record ResetInput(@NotBlank @Size(max = 100) String token,
                      @NotBlank @Size(min = 10, max = 128) String password) {
        @Override public String toString() { return "ResetInput[redacted]"; }
    }
    record UserView(UUID id, String name, String email, String provider) {
        static UserView of(UserAccount user) { return new UserView(user.id, user.name, user.email, user.googleId == null ? "EMAIL" : "GOOGLE"); }
    }

    @GetMapping("/config") Map<String, Boolean> config() {
        return Map.of("googleEnabled", properties.googleEnabled(), "passwordResetEnabled", properties.passwordResetEnabled());
    }

    @PostMapping("/register") @ResponseStatus(HttpStatus.CREATED)
    Map<String, UserView> register(@Valid @RequestBody RegisterInput input, HttpServletRequest request, HttpServletResponse response) {
        authLimit(request, "register", normalize(input.email()), 8);
        validatePassword(input.password());
        if (input.name().trim().length() < 2) throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "Please enter your name.");
        if (users.findByEmail(normalize(input.email())).isPresent()) throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists. Please sign in.");
        UserAccount user = new UserAccount(); user.name = input.name().trim(); user.email = normalize(input.email());
        user.passwordHash = passwords.encode(input.password()); users.saveAndFlush(user);
        sessions.signIn(user, request, response);
        return Map.of("user", UserView.of(user));
    }

    @PostMapping("/login")
    Map<String, UserView> login(@Valid @RequestBody LoginInput input, HttpServletRequest request, HttpServletResponse response) {
        authLimit(request, "login", normalize(input.email()), 15);
        if (input.password().getBytes(StandardCharsets.UTF_8).length > 72) throw credentialsError();
        var user = users.findByEmail(normalize(input.email()));
        String hash = user.map(u -> u.passwordHash).orElse(null);
        boolean matches = passwords.matches(input.password(), hash == null ? dummyHash : hash);
        if (user.isEmpty() || hash == null || !matches) throw credentialsError();
        sessions.signIn(user.get(), request, response);
        return Map.of("user", UserView.of(user.get()));
    }

    @GetMapping("/me")
    Map<String, UserView> me(Authentication auth) {
        if (auth == null || !(auth.getPrincipal() instanceof UUID id)) throw ApiException.unauthorized();
        return Map.of("user", UserView.of(users.findById(id).orElseThrow(ApiException::unauthorized)));
    }

    @PostMapping("/logout")
    Map<String, String> logout(HttpServletRequest request, HttpServletResponse response) {
        sessions.signOut(request, response); return Map.of("message", "Signed out.");
    }

    @PostMapping("/forgot-password")
    Map<String, String> forgot(@Valid @RequestBody ForgotInput input, HttpServletRequest request) {
        authLimit(request, "reset", normalize(input.email()), 3);
        if (!properties.passwordResetEnabled()) throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Password recovery is not configured for this deployment.");
        recovery.send(normalize(input.email()));
        return Map.of("message", "If an account exists for this email, a reset link will arrive shortly. You can also sign in with Google if you registered with Google.");
    }

    @PostMapping("/reset-password")
    Map<String, String> reset(@Valid @RequestBody ResetInput input, HttpServletRequest request, HttpServletResponse response) {
        limiter.check("reset-token:" + request.getRemoteAddr(), 30, 300);
        validatePassword(input.password()); recovery.consume(input.token(), input.password());
        sessions.signOut(request, response);
        return Map.of("message", "Your password has been reset. Please sign in.");
    }

    @GetMapping("/google")
    void google(HttpServletRequest request, HttpServletResponse response) throws java.io.IOException {
        limiter.check("google:" + request.getRemoteAddr(), 60, 60);
        if (!properties.googleEnabled()) { response.sendRedirect(properties.url() + "/login?error=google_unavailable"); return; }
        String state = Tokens.random(); String verifier = Tokens.random();
        sessions.cookie(response, "jobtrack_oauth_state", state, Duration.ofMinutes(10));
        sessions.cookie(response, "jobtrack_oauth_verifier", verifier, Duration.ofMinutes(10));
        String url = UriComponentsBuilder.fromUriString("https://accounts.google.com/o/oauth2/v2/auth")
            .queryParam("client_id", properties.googleClientId()).queryParam("redirect_uri", callback())
            .queryParam("response_type", "code").queryParam("scope", "openid email profile")
            .queryParam("state", state).queryParam("code_challenge", Tokens.challenge(verifier))
            .queryParam("code_challenge_method", "S256").queryParam("prompt", "select_account").build().encode().toUriString();
        response.sendRedirect(url);
    }

    @GetMapping("/google/callback")
    void callback(@RequestParam(required = false) String code, @RequestParam(required = false) String state,
                  HttpServletRequest request, HttpServletResponse response) throws java.io.IOException {
        String expected = SessionService.cookieValue(request, "jobtrack_oauth_state");
        String verifier = SessionService.cookieValue(request, "jobtrack_oauth_verifier");
        sessions.cookie(response, "jobtrack_oauth_state", "", Duration.ZERO);
        sessions.cookie(response, "jobtrack_oauth_verifier", "", Duration.ZERO);
        if (!properties.googleEnabled() || code == null || code.length() > 2048 || !Tokens.equal(expected, state) || verifier == null || verifier.length() != 43) {
            response.sendRedirect(properties.url() + "/login?error=google_failed"); return;
        }
        try {
            var body = new LinkedMultiValueMap<String, String>();
            body.add("code", code); body.add("client_id", properties.googleClientId()); body.add("client_secret", properties.googleClientSecret());
            body.add("redirect_uri", callback()); body.add("grant_type", "authorization_code"); body.add("code_verifier", verifier);
            var token = http.post().uri("https://oauth2.googleapis.com/token").contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(body).retrieve().body(GoogleToken.class);
            if (token == null || token.access_token() == null) throw new IllegalStateException("Missing token");
            var profile = http.get().uri("https://openidconnect.googleapis.com/v1/userinfo")
                .headers(headers -> headers.setBearerAuth(token.access_token())).retrieve().body(GoogleProfile.class);
            if (profile == null || !Boolean.TRUE.equals(profile.email_verified()) || profile.sub() == null || profile.email() == null
                || profile.email().length() > 254 || profile.sub().length() > 255) throw new IllegalStateException("Invalid Google profile");
            UserAccount user = users.findByGoogleId(profile.sub()).orElse(null);
            if (user == null) {
                // Never silently attach Google to an unverified password registration.
                if (users.findByEmail(normalize(profile.email())).isPresent()) {
                    response.sendRedirect(properties.url() + "/login?error=existing_email"); return;
                }
                user = new UserAccount(); user.googleId = profile.sub(); user.email = normalize(profile.email());
                String name = profile.name() == null || profile.name().isBlank() ? profile.email().split("@")[0] : profile.name();
                user.name = name.substring(0, Math.min(name.length(), 100)); users.saveAndFlush(user);
            }
            sessions.signIn(user, request, response); response.sendRedirect(properties.url() + "/applications");
        } catch (Exception ex) {
            log.warn("Google sign-in failed: {}", ex.getClass().getSimpleName());
            response.sendRedirect(properties.url() + "/login?error=google_failed");
        }
    }
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    private record GoogleToken(String access_token) {}
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    private record GoogleProfile(String sub, String email, Boolean email_verified, String name) {}
    private String callback() { return properties.url() + "/api/auth/google/callback"; }
    private void authLimit(HttpServletRequest request, String kind, String email, int count) {
        limiter.check("auth-ip:" + request.getRemoteAddr(), 100, 60);
        limiter.check(kind + ":" + email, count, 900);
    }
    private static String normalize(String email) { return email.trim().toLowerCase(Locale.ROOT); }
    private static ApiException credentialsError() { return new ApiException(HttpStatus.UNAUTHORIZED, "Email or password is incorrect. If you registered with Google, use Continue with Google."); }
    static void validatePassword(String password) {
        if (password.getBytes(StandardCharsets.UTF_8).length > 72) throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "Password must be at most 72 UTF-8 bytes.");
    }
}

@Service
class RecoveryService {
    private static final Logger log = LoggerFactory.getLogger(RecoveryService.class);
    private final PasswordResetRepository resets;
    private final UserRepository users;
    private final SessionRepository sessions;
    private final PasswordEncoder passwords;
    private final AppProperties properties;
    private final RestClient http;
    RecoveryService(PasswordResetRepository resets, UserRepository users, SessionRepository sessions, PasswordEncoder passwords, AppProperties properties) {
        this.resets = resets; this.users = users; this.sessions = sessions; this.passwords = passwords; this.properties = properties;
        var factory = new JdkClientHttpRequestFactory(java.net.http.HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(8)).build());
        factory.setReadTimeout(Duration.ofSeconds(12)); this.http = RestClient.builder().requestFactory(factory).build();
    }
    @Transactional
    void send(String email) {
        UserAccount user = users.findByEmail(email).orElse(null);
        if (user == null) return;
        String token = Tokens.random();
        resets.deleteByUserId(user.id);
        PasswordReset reset = new PasswordReset(); reset.userId = user.id; reset.tokenHash = Tokens.hash(token);
        reset.expiresAt = Instant.now().plus(Duration.ofMinutes(30)); resets.save(reset);
        String url = properties.url() + "/reset-password?token=" + token;
        if (properties.devEmailLog()) {
            log.info("LOCAL DEVELOPMENT ONLY - password reset for {}: {}", email, url); return;
        }
        try {
            http.post().uri("https://api.resend.com/emails").headers(h -> h.setBearerAuth(properties.resendApiKey()))
                .contentType(MediaType.APPLICATION_JSON).body(Map.of("from", properties.emailFrom(), "to", new String[]{email},
                    "subject", "Reset your JobTrack password", "text", "Reset your password using this link (valid for 30 minutes):\n\n" + url + "\n\nIf you did not request this, ignore this email."))
                .retrieve().toBodilessEntity();
        } catch (Exception ex) {
            // Same response for known and unknown addresses; never expose provider responses or token.
            log.error("Password recovery email could not be delivered: {}", ex.getClass().getSimpleName());
        }
    }
    @Transactional
    void consume(String token, String password) {
        PasswordReset reset = resets.findLocked(Tokens.hash(token)).filter(t -> t.expiresAt.isAfter(Instant.now()))
            .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "This reset link is invalid or expired. Request a new one."));
        UserAccount user = users.findById(reset.userId).orElseThrow(ApiException::unauthorized);
        user.passwordHash = passwords.encode(password); users.save(user);
        sessions.deleteByUserId(user.id); resets.deleteByUserId(user.id);
    }
}
