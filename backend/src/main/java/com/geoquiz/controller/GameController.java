package com.geoquiz.controller;

import com.geoquiz.entity.QuizEvent;
import com.geoquiz.repository.QuizEventRepository;
import com.geoquiz.service.MonitoringService;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
public class GameController {

    private final MonitoringService monitoringService;
    private final QuizEventRepository quizEventRepository;

    public GameController(MonitoringService monitoringService, QuizEventRepository quizEventRepository) {
        this.monitoringService = monitoringService;
        this.quizEventRepository = quizEventRepository;
    }

    @Cacheable("public-stats")
    @GetMapping("/api/public/stats")
    public Map<String, Object> getPublicStats() {
        return monitoringService.getPublicStats();
    }

    @Cacheable(value = "leaderboard", key = "#mode + '-' + #limit")
    @GetMapping("/api/leaderboard")
    public List<Map<String, Object>> getLeaderboard(
            @RequestParam String mode,
            @RequestParam(defaultValue = "10") int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 50);
        List<QuizEvent> events = quizEventRepository.findLeaderboardByMode(mode, safeLimit);
        List<Map<String, Object>> result = new ArrayList<>();
        int rank = 1;
        for (QuizEvent e : events) {
            try {
                String[] parts = e.getAnswerGiven().split("/");
                int correct = Integer.parseInt(parts[0].trim());
                int total = Integer.parseInt(parts[1].trim());
                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("rank", rank++);
                entry.put("correct", correct);
                entry.put("total", total);
                entry.put("accuracy", total > 0 ? Math.round((double) correct / total * 100) : 0);
                entry.put("region", e.getRegionFilter() != null ? e.getRegionFilter() : "All");
                entry.put("playedAt", e.getCreatedAt());
                result.add(entry);
            } catch (Exception ignored) {}
        }
        return result;
    }
}
