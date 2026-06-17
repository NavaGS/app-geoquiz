package com.geoquiz.controller;

import com.geoquiz.service.MonitoringService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/monitoring")
public class MonitoringController {

    private final MonitoringService monitoringService;
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(4);

    public MonitoringController(MonitoringService monitoringService) {
        this.monitoringService = monitoringService;
    }

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        return monitoringService.getStats();
    }

    @GetMapping(value = "/live", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter liveEvents() {
        SseEmitter emitter = new SseEmitter(300_000L); // 5 min timeout

        scheduler.scheduleAtFixedRate(() -> {
            try {
                emitter.send(SseEmitter.event()
                        .name("stats")
                        .data(monitoringService.getStats()));
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
        }, 0, 5, TimeUnit.SECONDS);

        return emitter;
    }
}
