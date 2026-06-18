package com.geoquiz.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.ArrayList;
import java.util.List;

@Configuration
public class WebConfig {

    @Value("${frontend.origin:}")
    private String frontendOrigin;

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                String[] origins = buildOrigins();
                registry.addMapping("/api/**")
                        .allowedOrigins(origins)
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(false);
                registry.addMapping("/admin/**")
                        .allowedOrigins("http://localhost:5173")
                        .allowedMethods("GET", "POST");
            }

            private String[] buildOrigins() {
                List<String> list = new ArrayList<>();
                list.add("http://localhost:5173");
                list.add("http://frontend:5173");
                if (frontendOrigin != null && !frontendOrigin.isBlank()) {
                    list.add(frontendOrigin);
                }
                return list.toArray(new String[0]);
            }
        };
    }
}
