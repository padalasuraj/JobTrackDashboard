package com.jobtrack;

import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/** A bounded, single-instance limiter suitable for the documented free hosting setup. */
@Component
class RateLimiter {
    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();
    void check(String key, int limit, long seconds) {
        long now = System.currentTimeMillis();
        if (windows.size() > 5000) windows.entrySet().removeIf(e -> e.getValue().until < now);
        if (windows.size() > 10000 && !windows.containsKey(key)) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Too many requests. Please try again shortly.");
        }
        Window window = windows.compute(key, (k, old) -> old == null || old.until < now ? new Window(now + seconds * 1000) : old);
        synchronized (window) {
            if (++window.count > limit) throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Too many attempts. Please try again in a few minutes.");
        }
    }
    private static class Window {
        final long until; int count;
        Window(long until) { this.until = until; }
    }
}
