package com.geoquiz.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.geoquiz.dto.AnswerRequest;
import com.geoquiz.dto.AnswerResponse;
import com.geoquiz.dto.QuizEventRequest;
import com.geoquiz.entity.Country;
import com.geoquiz.entity.CountryAlias;
import com.geoquiz.entity.QuizEvent;
import com.geoquiz.repository.CountryRepository;
import com.geoquiz.repository.QuizEventRepository;
import com.geoquiz.service.QuizAnswerService;
import jakarta.validation.Valid;
import org.apache.commons.text.similarity.JaroWinklerSimilarity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")
public class QuizController {

    private static final Logger log = LoggerFactory.getLogger(QuizController.class);
    private static final double CORRECT_THRESHOLD = 0.92;
    private static final double CLOSE_THRESHOLD = 0.85;

    private final QuizAnswerService answerService;
    private final QuizEventRepository quizEventRepository;
    private final CountryRepository countryRepository;
    private final ObjectMapper objectMapper;
    private final JaroWinklerSimilarity jaroWinkler = new JaroWinklerSimilarity();

    public QuizController(QuizAnswerService answerService,
                          QuizEventRepository quizEventRepository,
                          CountryRepository countryRepository,
                          ObjectMapper objectMapper) {
        this.answerService = answerService;
        this.quizEventRepository = quizEventRepository;
        this.countryRepository = countryRepository;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/quiz/answer")
    public ResponseEntity<AnswerResponse> submitAnswer(@Valid @RequestBody AnswerRequest request) {
        try {
            AnswerResponse response = answerService.evaluate(request);

            // Auto-log to quiz events
            QuizEvent event = new QuizEvent();
            event.setSessionId(request.getSessionId());
            event.setMode(request.getMode());
            event.setCountryIso(request.getCountryIso());
            event.setAnswerGiven(request.getAnswer());
            event.setEventType("answer");
            event.setWasCorrect(response.getResult() == AnswerResponse.Result.CORRECT);
            event.setSimilarityScore(response.getSimilarityScore());
            quizEventRepository.save(event);

            log.info("{\"event_type\":\"answer\",\"session_id\":\"{}\",\"mode\":\"{}\",\"country_iso\":\"{}\",\"answer_given\":\"{}\",\"was_correct\":{},\"similarity_score\":{}}",
                    request.getSessionId(), request.getMode(), request.getCountryIso(),
                    request.getAnswer(), event.getWasCorrect(), response.getSimilarityScore());

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/quiz/language-answer")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> submitLanguageAnswer(@RequestBody Map<String, String> body) {
        String countryIso = body.get("countryIso");
        String answer = body.get("answer");
        if (countryIso == null || answer == null) return ResponseEntity.badRequest().build();

        Country country = countryRepository.findByIsoA2IgnoreCase(countryIso)
                .or(() -> countryRepository.findByIsoA3IgnoreCase(countryIso))
                .orElse(null);
        if (country == null) return ResponseEntity.notFound().build();

        List<String> allLanguages = new ArrayList<>();
        try {
            if (country.getLanguages() != null) {
                allLanguages = objectMapper.readValue(country.getLanguages(), List.class);
            }
        } catch (Exception e) {
            log.warn("Failed to parse languages for {}", countryIso);
        }

        String normalizedAnswer = normalize(answer);
        String bestMatch = null;
        double bestScore = 0.0;

        for (String lang : allLanguages) {
            String normLang = normalize(lang);
            if (normLang.equals(normalizedAnswer)) {
                Map<String, Object> result = new LinkedHashMap<>();
                result.put("result", "CORRECT");
                result.put("canonicalAnswer", lang);
                result.put("allLanguages", allLanguages);
                return ResponseEntity.ok(result);
            }
            double score = jaroWinkler.apply(normLang, normalizedAnswer);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = lang;
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("allLanguages", allLanguages);
        if (bestScore >= CORRECT_THRESHOLD) {
            result.put("result", "CORRECT");
            result.put("canonicalAnswer", bestMatch);
        } else if (bestScore >= CLOSE_THRESHOLD) {
            result.put("result", "CLOSE");
            result.put("canonicalAnswer", bestMatch);
        } else {
            result.put("result", "WRONG");
            result.put("canonicalAnswer", null);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/quiz/border-answer")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> submitBorderAnswer(@RequestBody Map<String, String> body) {
        String countryIso = body.get("countryIso");
        String answer = body.get("answer");
        if (countryIso == null || answer == null) return ResponseEntity.badRequest().build();

        Country country = countryRepository.findByIsoA2IgnoreCase(countryIso)
                .or(() -> countryRepository.findByIsoA3IgnoreCase(countryIso))
                .orElse(null);
        if (country == null) return ResponseEntity.notFound().build();

        List<String> borderIsoCodes = new ArrayList<>();
        try {
            if (country.getBorders() != null) {
                borderIsoCodes = objectMapper.readValue(country.getBorders(), List.class);
            }
        } catch (Exception e) {
            log.warn("Failed to parse borders for {}", countryIso);
        }

        // Build list of border country names
        List<String> borderNames = new ArrayList<>();
        // candidates: list of (nameCommon, aliases) per border country
        List<List<String>> candidatesPerBorder = new ArrayList<>();

        for (String isoA3 : borderIsoCodes) {
            countryRepository.findByIsoA3IgnoreCase(isoA3).ifPresent(bc -> {
                borderNames.add(bc.getNameCommon());
                List<String> names = new ArrayList<>();
                names.add(bc.getNameCommon());
                if (bc.getNameOfficial() != null) names.add(bc.getNameOfficial());
                for (CountryAlias alias : bc.getAliases()) {
                    names.add(alias.getAlias());
                }
                candidatesPerBorder.add(names);
            });
        }

        String normalizedAnswer = normalize(answer);
        String matchedName = null;

        outer:
        for (int i = 0; i < candidatesPerBorder.size(); i++) {
            List<String> names = candidatesPerBorder.get(i);
            for (String name : names) {
                if (name == null) continue;
                if (normalize(name).equals(normalizedAnswer)) {
                    matchedName = borderNames.get(i);
                    break outer;
                }
                double score = jaroWinkler.apply(normalize(name), normalizedAnswer);
                if (score >= CORRECT_THRESHOLD) {
                    matchedName = borderNames.get(i);
                    break outer;
                }
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("borderNames", borderNames);
        if (matchedName != null) {
            result.put("result", "CORRECT");
            result.put("canonicalAnswer", matchedName);
        } else {
            result.put("result", "WRONG");
            result.put("canonicalAnswer", null);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/events/quiz")
    public ResponseEntity<Void> logEvent(@RequestBody QuizEventRequest request) {
        QuizEvent event = new QuizEvent();
        event.setSessionId(request.getSessionId());
        event.setMode(request.getMode());
        event.setRegionFilter(request.getRegionFilter());
        event.setEventType(request.getEventType());
        event.setCountryIso(request.getCountryIso());
        event.setAnswerGiven(request.getAnswerGiven());
        event.setWasCorrect(request.getWasCorrect());
        event.setSimilarityScore(request.getSimilarityScore());
        quizEventRepository.save(event);
        return ResponseEntity.ok().build();
    }

    private String normalize(String s) {
        if (s == null) return "";
        String d = java.text.Normalizer.normalize(s.trim().toLowerCase(), java.text.Normalizer.Form.NFD);
        return d.replaceAll("\\p{M}", "");
    }
}
