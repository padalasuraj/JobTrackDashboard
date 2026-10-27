package com.jobtrack;

import java.net.URI;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(String url, boolean cookieSecure, String googleClientId,
                            String googleClientSecret, String resendApiKey, String emailFrom,
                            boolean devEmailLog) {
    public AppProperties {
        if (url == null || !url.matches("https?://[^/]+/?")) {
            throw new IllegalArgumentException("APP_URL must be a single http(s) origin, without a path");
        }
        url = url.replaceAll("/$", "");
        URI origin = URI.create(url);
        if (origin.getHost() == null || origin.getUserInfo() != null) {
            throw new IllegalArgumentException("APP_URL must have a valid host");
        }
        if (cookieSecure && !url.startsWith("https://")) {
            throw new IllegalArgumentException("APP_URL must use HTTPS when secure cookies are enabled");
        }
    }
    public boolean googleEnabled() { return present(googleClientId) && present(googleClientSecret); }
    public boolean passwordResetEnabled() { return devEmailLog || (present(resendApiKey) && present(emailFrom)); }
    private static boolean present(String value) { return value != null && !value.isBlank(); }
}
