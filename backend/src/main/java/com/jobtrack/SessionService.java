package com.jobtrack;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class SessionService {
    static final String COOKIE = "jobtrack_session";
    private static final Duration LIFETIME = Duration.ofDays(14);
    private final SessionRepository sessions;
    private final UserRepository users;
    private final PasswordResetRepository resets;
    private final AppProperties properties;
    SessionService(SessionRepository sessions, UserRepository users, PasswordResetRepository resets, AppProperties properties) {
        this.sessions = sessions; this.users = users; this.resets = resets; this.properties = properties;
    }
    @Transactional
    void signIn(UserAccount user, HttpServletRequest request, HttpServletResponse response) {
        revoke(request);
        String token = Tokens.random();
        UserSession session = new UserSession();
        session.tokenHash = Tokens.hash(token); session.userId = user.id; session.expiresAt = Instant.now().plus(LIFETIME);
        sessions.save(session);
        cookie(response, COOKIE, token, LIFETIME);
    }
    Optional<UserAccount> authenticate(HttpServletRequest request) {
        String token = cookieValue(request, COOKIE);
        if (token == null || token.length() != 43) return Optional.empty();
        return sessions.findById(Tokens.hash(token)).filter(s -> s.expiresAt.isAfter(Instant.now())).flatMap(s -> users.findById(s.userId));
    }
    @Transactional
    void signOut(HttpServletRequest request, HttpServletResponse response) {
        revoke(request); cookie(response, COOKIE, "", Duration.ZERO);
    }
    private void revoke(HttpServletRequest request) {
        String token = cookieValue(request, COOKIE);
        if (token != null && token.length() == 43) sessions.deleteById(Tokens.hash(token));
    }
    void cookie(HttpServletResponse response, String name, String value, Duration duration) {
        response.addHeader(HttpHeaders.SET_COOKIE, ResponseCookie.from(name, value).path("/").httpOnly(true)
            .secure(properties.cookieSecure()).sameSite("Lax").maxAge(duration).build().toString());
    }
    static String cookieValue(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return null;
        for (Cookie cookie : request.getCookies()) if (cookie.getName().equals(name)) return cookie.getValue();
        return null;
    }
    @Scheduled(fixedDelay = 3600000) @Transactional
    public void cleanExpired() {
        sessions.deleteByExpiresAtBefore(Instant.now()); resets.deleteByExpiresAtBefore(Instant.now());
    }
}
