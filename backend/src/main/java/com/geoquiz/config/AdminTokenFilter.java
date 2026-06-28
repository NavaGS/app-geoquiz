package com.geoquiz.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class AdminTokenFilter extends OncePerRequestFilter {

    @Value("${admin.token:dev}")
    private String adminToken;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain)
            throws ServletException, IOException {

        // Let CORS preflight through without a token check
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            chain.doFilter(request, response);
            return;
        }

        String provided = extractToken(request);
        if (adminToken.equals(provided)) {
            chain.doFilter(request, response);
        } else {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Unauthorized\"}");
        }
    }

    private String extractToken(HttpServletRequest request) {
        // Standard Bearer token
        String auth = request.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            return auth.substring(7);
        }
        // Custom header (used by REST calls)
        String header = request.getHeader("X-Admin-Token");
        if (header != null && !header.isBlank()) {
            return header;
        }
        // Query param (used by SSE — EventSource cannot set headers)
        return request.getParameter("adminToken");
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String path = request.getServletPath();
        // Only intercept monitoring and sensitive actuator paths
        return !path.startsWith("/api/monitoring") &&
               !path.startsWith("/actuator/prometheus") &&
               !path.startsWith("/actuator/metrics");
    }
}
