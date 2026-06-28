package com.geoquiz.repository;

import com.geoquiz.entity.QuizEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface QuizEventRepository extends JpaRepository<QuizEvent, Long> {

    @Query("SELECT COUNT(DISTINCT q.sessionId) FROM QuizEvent q WHERE q.createdAt >= :since")
    long countDistinctSessionsSince(@Param("since") Instant since);

    @Query("SELECT q.mode, COUNT(q) FROM QuizEvent q GROUP BY q.mode")
    List<Object[]> countByMode();

    @Query("SELECT q.mode, SUM(CASE WHEN q.wasCorrect = true THEN 1 ELSE 0 END), COUNT(q) FROM QuizEvent q WHERE q.wasCorrect IS NOT NULL GROUP BY q.mode")
    List<Object[]> accuracyByMode();

    @Query("SELECT q.countryIso, COUNT(q), SUM(CASE WHEN q.wasCorrect = true THEN 1 ELSE 0 END) FROM QuizEvent q WHERE q.wasCorrect IS NOT NULL GROUP BY q.countryIso ORDER BY (COUNT(q) - SUM(CASE WHEN q.wasCorrect = true THEN 1 ELSE 0 END)) DESC")
    List<Object[]> hardestCountries();

    List<QuizEvent> findTop50ByOrderByCreatedAtDesc();

    @Query("SELECT q.eventType, COUNT(q) FROM QuizEvent q WHERE q.eventType IN ('session_start', 'quiz_complete') GROUP BY q.eventType")
    List<Object[]> countSessionLifecycleEvents();

    @Query("SELECT q.mode, SUM(CASE WHEN q.eventType = 'skip' THEN 1 ELSE 0 END), SUM(CASE WHEN q.eventType IN ('answer', 'skip') THEN 1 ELSE 0 END) FROM QuizEvent q WHERE q.eventType IN ('answer', 'skip') AND q.mode IS NOT NULL GROUP BY q.mode")
    List<Object[]> skipRateByMode();

    @Query("SELECT COUNT(DISTINCT q.userId) FROM QuizEvent q WHERE q.userId IS NOT NULL")
    long countDistinctUsers();

    @Query(value = "SELECT COUNT(*) FROM (SELECT user_id FROM quiz_events WHERE event_type = 'session_start' AND user_id IS NOT NULL GROUP BY user_id HAVING COUNT(*) > 1) AS t", nativeQuery = true)
    long countReturningUsers();

    @Query(value = "SELECT COALESCE(AVG(cnt), 0) FROM (SELECT COUNT(*) AS cnt FROM quiz_events WHERE event_type = 'session_start' AND user_id IS NOT NULL GROUP BY user_id) AS t", nativeQuery = true)
    Double avgSessionsPerUser();

    @Query(value = "SELECT * FROM quiz_events WHERE event_type = 'quiz_complete' AND mode = :mode AND answer_given ~ '^[0-9]+/[0-9]+$' ORDER BY CAST(SPLIT_PART(answer_given, '/', 1) AS INTEGER) DESC, created_at ASC LIMIT :limit", nativeQuery = true)
    List<QuizEvent> findLeaderboardByMode(@Param("mode") String mode, @Param("limit") int limit);
}
