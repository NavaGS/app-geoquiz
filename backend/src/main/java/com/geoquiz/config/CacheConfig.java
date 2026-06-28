package com.geoquiz.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        SimpleCacheManager manager = new SimpleCacheManager();
        manager.setCaches(List.of(
            // GeoJSON is static — no TTL, evicted explicitly on data refresh
            buildCache("geojson",      0,   20),
            // Country list changes only on data refresh — 5 min safety TTL
            buildCache("countries",    300, 20),
            // Public stats and leaderboard are refreshed frequently — short TTL
            buildCache("public-stats", 30,  10),
            buildCache("leaderboard",  30,  50)
        ));
        return manager;
    }

    private CaffeineCache buildCache(String name, long ttlSeconds, int maxSize) {
        Caffeine<Object, Object> builder = Caffeine.newBuilder().maximumSize(maxSize);
        if (ttlSeconds > 0) {
            builder.expireAfterWrite(ttlSeconds, TimeUnit.SECONDS);
        }
        return new CaffeineCache(name, builder.build());
    }
}
