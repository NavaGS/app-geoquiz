package com.geoquiz.service;

import com.geoquiz.dto.AnswerRequest;
import com.geoquiz.dto.AnswerResponse;
import com.geoquiz.entity.Country;
import com.geoquiz.entity.CountryAlias;
import com.geoquiz.repository.CountryRepository;
import org.apache.commons.text.similarity.JaroWinklerSimilarity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;

@Service
public class QuizAnswerService {

    private static final Logger log = LoggerFactory.getLogger(QuizAnswerService.class);
    private static final double CORRECT_THRESHOLD = 0.92;
    private static final double CLOSE_THRESHOLD = 0.85;

    private final CountryRepository countryRepository;
    private final JaroWinklerSimilarity jaroWinkler = new JaroWinklerSimilarity();

    public QuizAnswerService(CountryRepository countryRepository) {
        this.countryRepository = countryRepository;
    }

    @Transactional(readOnly = true)
    public AnswerResponse evaluate(AnswerRequest request) {
        Country country = countryRepository.findByIsoA2IgnoreCase(request.getCountryIso())
                .or(() -> countryRepository.findByIsoA3IgnoreCase(request.getCountryIso()))
                .orElseThrow(() -> new IllegalArgumentException("Country not found: " + request.getCountryIso()));

        String mode = request.getMode() != null ? request.getMode().toLowerCase() : "";
        String normalizedAnswer = normalize(request.getAnswer());

        if ("capitals".equals(mode)) {
            return evaluateCapital(country, normalizedAnswer, request.getAnswer());
        }
        if ("currency".equals(mode)) {
            return evaluateCurrency(country, normalizedAnswer, request.getAnswer());
        }

        // Default: match against country name
        List<String> candidates = new ArrayList<>();
        candidates.add(country.getNameCommon());
        candidates.add(country.getNameOfficial());
        for (CountryAlias alias : country.getAliases()) {
            candidates.add(alias.getAlias());
        }

        return matchCandidates(candidates, country.getNameCommon(), normalizedAnswer, request.getAnswer());
    }

    private AnswerResponse evaluateCapital(Country country, String normalizedAnswer, String rawAnswer) {
        String capital = country.getCapital();
        if (capital == null || capital.isBlank()) return AnswerResponse.wrong(0.0);

        List<String> candidates = new ArrayList<>();
        candidates.add(capital);

        return matchCandidates(candidates, capital, normalizedAnswer, rawAnswer);
    }

    private AnswerResponse evaluateCurrency(Country country, String normalizedAnswer, String rawAnswer) {
        List<String> candidates = new ArrayList<>();
        if (country.getCurrencyName() != null) candidates.add(country.getCurrencyName());
        if (country.getCurrencyCode() != null) candidates.add(country.getCurrencyCode());

        if (candidates.isEmpty()) return AnswerResponse.wrong(0.0);
        String canonical = country.getCurrencyName() != null ? country.getCurrencyName() : country.getCurrencyCode();

        return matchCandidates(candidates, canonical, normalizedAnswer, rawAnswer);
    }

    private AnswerResponse matchCandidates(List<String> candidates, String canonical, String normalizedAnswer, String rawAnswer) {
        for (String candidate : candidates) {
            if (candidate != null && normalize(candidate).equals(normalizedAnswer)) {
                log.info("Quiz answer CORRECT exact match: canonical={} answer={}", canonical, rawAnswer);
                return AnswerResponse.correct(canonical);
            }
        }

        double bestScore = 0.0;
        for (String candidate : candidates) {
            if (candidate == null) continue;
            double score = jaroWinkler.apply(normalize(candidate), normalizedAnswer);
            if (score > bestScore) bestScore = score;
        }

        log.info("Quiz answer fuzzy score: canonical={} answer={} score={}", canonical, rawAnswer, bestScore);

        if (bestScore >= CORRECT_THRESHOLD) return AnswerResponse.correct(canonical);
        if (bestScore >= CLOSE_THRESHOLD)   return AnswerResponse.close(canonical, bestScore);
        return AnswerResponse.wrong(bestScore);
    }

    private String normalize(String input) {
        if (input == null) return "";
        String stripped = Normalizer.normalize(input.trim().toLowerCase(), Normalizer.Form.NFD);
        return stripped.replaceAll("\\p{M}", "");
    }
}
