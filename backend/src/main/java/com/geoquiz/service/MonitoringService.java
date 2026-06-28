package com.geoquiz.service;

import com.geoquiz.entity.QuizEvent;
import com.geoquiz.repository.PerformanceEventRepository;
import com.geoquiz.repository.QuizEventRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class MonitoringService {

    private final QuizEventRepository quizEventRepository;
    private final PerformanceEventRepository performanceEventRepository;

    public MonitoringService(QuizEventRepository quizEventRepository,
                              PerformanceEventRepository performanceEventRepository) {
        this.quizEventRepository = quizEventRepository;
        this.performanceEventRepository = performanceEventRepository;
    }

    public Map<String, Object> getStats() {
        Map<String, Object> stats = new LinkedHashMap<>();

        // Active sessions
        Instant now = Instant.now();
        Map<String, Object> sessions = new LinkedHashMap<>();
        sessions.put("last5min", quizEventRepository.countDistinctSessionsSince(now.minus(5, ChronoUnit.MINUTES)));
        sessions.put("last30min", quizEventRepository.countDistinctSessionsSince(now.minus(30, ChronoUnit.MINUTES)));
        sessions.put("last60min", quizEventRepository.countDistinctSessionsSince(now.minus(60, ChronoUnit.MINUTES)));
        stats.put("activeSessions", sessions);

        // Session funnel
        Map<String, Long> lifecycleCounts = new LinkedHashMap<>();
        for (Object[] row : quizEventRepository.countSessionLifecycleEvents()) {
            lifecycleCounts.put((String) row[0], (Long) row[1]);
        }
        long started = lifecycleCounts.getOrDefault("session_start", 0L);
        long completed = lifecycleCounts.getOrDefault("quiz_complete", 0L);
        Map<String, Object> funnel = new LinkedHashMap<>();
        funnel.put("started", started);
        funnel.put("completed", completed);
        funnel.put("completionRate", started == 0 ? 0.0 : (double) completed / started * 100);
        stats.put("sessionFunnel", funnel);

        // Skip rate by mode
        List<Object[]> skipRows = quizEventRepository.skipRateByMode();
        Map<String, Double> skipRates = new LinkedHashMap<>();
        for (Object[] row : skipRows) {
            String mode = (String) row[0];
            long skips = ((Number) row[1]).longValue();
            long attempts = ((Number) row[2]).longValue();
            skipRates.put(mode, attempts == 0 ? 0.0 : (double) skips / attempts * 100);
        }
        stats.put("skipRateByMode", skipRates);

        // Mode popularity
        List<Object[]> modeRows = quizEventRepository.countByMode();
        Map<String, Long> modeCounts = new LinkedHashMap<>();
        for (Object[] row : modeRows) {
            modeCounts.put((String) row[0], (Long) row[1]);
        }
        stats.put("modePopularity", modeCounts);

        // Accuracy by mode
        List<Object[]> accuracyRows = quizEventRepository.accuracyByMode();
        Map<String, Double> modeAccuracy = new LinkedHashMap<>();
        for (Object[] row : accuracyRows) {
            String mode = (String) row[0];
            long correct = ((Number) row[1]).longValue();
            long total = ((Number) row[2]).longValue();
            modeAccuracy.put(mode, total == 0 ? 0.0 : (double) correct / total * 100);
        }
        stats.put("modeAccuracy", modeAccuracy);

        // Hardest countries (top 10)
        List<Object[]> hardestRows = quizEventRepository.hardestCountries();
        List<Map<String, Object>> hardest = new ArrayList<>();
        int limit = Math.min(10, hardestRows.size());
        for (int i = 0; i < limit; i++) {
            Object[] row = hardestRows.get(i);
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("iso", row[0]);
            entry.put("total", ((Number) row[1]).longValue());
            long correct = ((Number) row[2]).longValue();
            long total = ((Number) row[1]).longValue();
            entry.put("correct", correct);
            entry.put("accuracy", total == 0 ? 0.0 : (double) correct / total * 100);
            hardest.add(entry);
        }
        stats.put("hardestCountries", hardest);

        // Response times
        Instant oneHourAgo = now.minus(1, ChronoUnit.HOURS);
        List<Long> times = performanceEventRepository.findResponseTimesSince(oneHourAgo);
        Map<String, Object> responseTimes = new LinkedHashMap<>();
        if (!times.isEmpty()) {
            Collections.sort(times);
            responseTimes.put("p50", percentile(times, 50));
            responseTimes.put("p95", percentile(times, 95));
            responseTimes.put("p99", percentile(times, 99));
        } else {
            responseTimes.put("p50", 0);
            responseTimes.put("p95", 0);
            responseTimes.put("p99", 0);
        }
        stats.put("responseTimes", responseTimes);

        // Error rates
        long total = performanceEventRepository.countSince(oneHourAgo);
        long errors4xx = performanceEventRepository.count4xxSince(oneHourAgo);
        long errors5xx = performanceEventRepository.count5xxSince(oneHourAgo);
        Map<String, Object> errorRates = new LinkedHashMap<>();
        errorRates.put("total", total);
        errorRates.put("errors4xx", errors4xx);
        errorRates.put("errors5xx", errors5xx);
        errorRates.put("rate4xx", total == 0 ? 0.0 : (double) errors4xx / total * 100);
        errorRates.put("rate5xx", total == 0 ? 0.0 : (double) errors5xx / total * 100);
        stats.put("errorRates", errorRates);

        stats.put("timestamp", now.toString());
        return stats;
    }

    public List<Map<String, Object>> getRecentEvents() {
        List<QuizEvent> events = quizEventRepository.findTop50ByOrderByCreatedAtDesc();
        List<Map<String, Object>> result = new ArrayList<>();
        for (QuizEvent e : events) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", e.getId());
            m.put("sessionId", e.getSessionId());
            m.put("mode", e.getMode());
            m.put("eventType", e.getEventType());
            m.put("countryIso", e.getCountryIso());
            m.put("answerGiven", e.getAnswerGiven());
            m.put("wasCorrect", e.getWasCorrect());
            m.put("createdAt", e.getCreatedAt());
            result.add(m);
        }
        return result;
    }

    private long percentile(List<Long> sorted, int p) {
        int idx = (int) Math.ceil(p / 100.0 * sorted.size()) - 1;
        return sorted.get(Math.max(0, Math.min(idx, sorted.size() - 1)));
    }
}
