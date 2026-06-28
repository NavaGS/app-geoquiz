package com.geoquiz.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    // 120 req/min, initial burst of 20 — covers ~30 answers + events per countdown session with headroom
    private static final Bandwidth WRITE_LIMIT = Bandwidth.builder()
            .capacity(120)
            .refillGreedy(120, Duration.ofMinutes(1))
            .initialTokens(20)
            .build();

    // 10 req/min, burst of 3 — GeoJSON loads once per Map quiz session
    private static final Bandwidth GEOJSON_LIMIT = Bandwidth.builder()
            .capacity(10)
            .refillGreedy(10, Duration.ofMinutes(1))
            .initialTokens(3)
            .build();

    // 30 req/min, burst of 10 — country list loads once per quiz page mount
    private static final Bandwidth READ_LIMIT = Bandwidth.builder()
            .capacity(30)
            .refillGreedy(30, Duration.ofMinutes(1))
            .initialTokens(10)
            .build();

    // Per-IP bucket stores, evicted after 10 min inactivity, capped at 10k IPs
    private final Cache<String, Bucket> writeBuckets  = buildCache();
    private final Cache<String, Bucket> geojsonBuckets = buildCache();
    private final Cache<String, Bucket> readBuckets   = buildCache();

    private static Cache<String, Bucket> buildCache() {
        return Caffeine.newBuilder()
                .expireAfterAccess(10, TimeUnit.MINUTES)
                .maximumSize(10_000)
                .build();
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest req,
                                    @NonNull HttpServletResponse res,
                                    @NonNull FilterChain chain)
            throws ServletException, IOException {

        String ip   = resolveClientIp(req);
        String path = req.getServletPath();
        String method = req.getMethod();

        Cache<String, Bucket> store;
        Bandwidth limit;

        if ("POST".equals(method)) {
            store = writeBuckets;
            limit = WRITE_LIMIT;
        } else if (path.equals("/api/map/geojson")) {
            store = geojsonBuckets;
            limit = GEOJSON_LIMIT;
        } else {
            store = readBuckets;
            limit = READ_LIMIT;
        }

        Bucket bucket = store.get(ip, k -> Bucket.builder().addLimit(limit).build());

        if (bucket.tryConsume(1)) {
            chain.doFilter(req, res);
        } else {
            res.setStatus(429);
            res.setHeader("Retry-After", "60");
            res.setContentType("application/json");
            res.getWriter().write("{\"error\":\"Too many requests — please slow down\"}");
        }
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest req) {
        String method = req.getMethod();
        String path   = req.getServletPath();

        if ("OPTIONS".equalsIgnoreCase(method)) return true;

        // Rate-limit POST answer and event endpoints
        if ("POST".equals(method) &&
                (path.startsWith("/api/quiz/") || path.startsWith("/api/events/"))) return false;

        // Rate-limit the heavy GeoJSON endpoint and country list
        if ("GET".equals(method) &&
                (path.equals("/api/map/geojson") || path.equals("/api/countries"))) return false;

        return true;
    }

    private String resolveClientIp(HttpServletRequest req) {
        // Honour X-Forwarded-For set by reverse proxies / CDNs; take only the first address
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return req.getRemoteAddr();
    }
}
