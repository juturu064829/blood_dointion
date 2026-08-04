package com.blooddonation.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RateLimiterFilter extends OncePerRequestFilter {

    @Value("${app.rate-limit.enabled:true}")
    private boolean rateLimitEnabled;

    @Value("${app.rate-limit.requests-per-minute:15}")
    private int maxRequestsPerMinute;

    private final Map<String, RequestCounter> requestCounts = new ConcurrentHashMap<>();

    private static class RequestCounter {
        final long startTime = System.currentTimeMillis();
        final AtomicInteger count = new AtomicInteger(0);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if (rateLimitEnabled && isSensitiveEndpoint(request)) {
            String clientIp = getClientIP(request);
            long currentTime = System.currentTimeMillis();

            requestCounts.compute(clientIp, (key, counter) -> {
                if (counter == null || (currentTime - counter.startTime) > 60000) {
                    RequestCounter newCounter = new RequestCounter();
                    newCounter.count.incrementAndGet();
                    return newCounter;
                }
                counter.count.incrementAndGet();
                return counter;
            });

            RequestCounter counter = requestCounts.get(clientIp);
            if (counter != null && counter.count.get() > maxRequestsPerMinute) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType("application/json");
                response.getWriter().write("{\"success\": false, \"message\": \"Too many requests. Please try again later.\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isSensitiveEndpoint(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.contains("/api/auth/login") || path.contains("/api/auth/register");
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }
}
