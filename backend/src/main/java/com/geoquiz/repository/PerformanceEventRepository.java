package com.geoquiz.repository;

import com.geoquiz.entity.PerformanceEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface PerformanceEventRepository extends JpaRepository<PerformanceEvent, Long> {

    @Query("SELECT p.responseTimeMs FROM PerformanceEvent p WHERE p.createdAt >= :since ORDER BY p.responseTimeMs")
    List<Long> findResponseTimesSince(@Param("since") Instant since);

    @Query("SELECT COUNT(p) FROM PerformanceEvent p WHERE p.statusCode >= 400 AND p.statusCode < 500 AND p.createdAt >= :since")
    long count4xxSince(@Param("since") Instant since);

    @Query("SELECT COUNT(p) FROM PerformanceEvent p WHERE p.statusCode >= 500 AND p.createdAt >= :since")
    long count5xxSince(@Param("since") Instant since);

    @Query("SELECT COUNT(p) FROM PerformanceEvent p WHERE p.createdAt >= :since")
    long countSince(@Param("since") Instant since);
}
