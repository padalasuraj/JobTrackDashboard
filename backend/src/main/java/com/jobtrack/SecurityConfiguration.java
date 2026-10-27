package com.jobtrack;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.DispatcherType;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;

@Configuration
class SecurityConfiguration {
    @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(12); }
    @Bean UserDetailsService noDefaultUser() { return username -> { throw new UsernameNotFoundException("Use the API to sign in"); }; }

    @Bean
    SecurityFilterChain security(HttpSecurity http, SessionService sessions, AppProperties properties, ObjectMapper json) throws Exception {
        // CSRF is enforced by strict Origin validation below; the frontend proxies /api on the same origin.
        http.csrf(csrf -> csrf.disable()).cors(cors -> cors.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .formLogin(f -> f.disable()).httpBasic(b -> b.disable()).logout(l -> l.disable())
            .authorizeHttpRequests(a -> a
                // Initial requests are authenticated below; completion/error dispatches do not start a new operation.
                .dispatcherTypeMatchers(DispatcherType.ASYNC, DispatcherType.ERROR).permitAll()
                .requestMatchers("/api/health", "/api/auth/**").permitAll().anyRequest().authenticated())
            .exceptionHandling(e -> e.authenticationEntryPoint((request, response, ex) ->
                write(response, json, 401, "Please sign in to continue.")))
            .addFilterBefore(new OncePerRequestFilter() {
                @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
                    response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
                    if (!List.of("GET", "HEAD", "OPTIONS").contains(request.getMethod()) && !properties.url().equals(request.getHeader("Origin"))) {
                        write(response, json, 403, "Request origin is not allowed."); return;
                    }
                    if (request.getContentLengthLong() > 32768) { write(response, json, 413, "Request is too large."); return; }
                    sessions.authenticate(request).ifPresent(user -> SecurityContextHolder.getContext().setAuthentication(
                        new UsernamePasswordAuthenticationToken(user.id, null, List.of(new SimpleGrantedAuthority("ROLE_USER")))));
                    chain.doFilter(request, response);
                }
            }, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
    private static void write(HttpServletResponse response, ObjectMapper mapper, int status, String error) throws IOException {
        response.setStatus(status); response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        mapper.writeValue(response.getWriter(), Map.of("error", error));
    }
}
