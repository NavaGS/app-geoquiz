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

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;

@Service
public class QuizAnswerService {

    private static final Logger log = LoggerFactory.getLogger(QuizAnswerService.class);
    private static final double CORRECT_THRESHOLD = 0.92;
    private static final double CLOSE_THRESHOLD = 0.80;

    private final CountryRepository countryRepository;
    private final JaroWinklerSimilarity jaroWinkler = new JaroWinklerSimilarity();

    public QuizAnswerService(CountryRepository countryRepository) {
        this.countryRepository = countryRepository;
    }

    public AnswerResponse evaluate(AnswerRequest request) {
        Country country = countryRepository.findByIsoA2IgnoreCase(request.getCountryIso())
                .or(() -> countryRepository.findByIsoA3IgnoreCase(request.getCountryIso()))
                .orElseThrow(() -> new IllegalArgumentException("Country not found: " + request.getCountryIso()));

        String normalizedAnswer = normalize(request.getAnswer());

        // Collect all names to match against
        List<String> candidates = new ArrayList<>();
        candidates.add(country.getNameCommon());
        candidates.add(country.getNameOfficial());
        for (CountryAlias alias : country.getAliases()) {
            candidates.add(alias.getAlias());
        }

        // Exact match check
        for (String candidate : candidates) {
            if (candidate != null && normalize(candidate).equals(normalizedAnswer)) {
                log.info("Quiz answer CORRECT exact match: country={} answer={}", country.getNameCommon(), request.getAnswer());
                return AnswerResponse.correct(country.getNameCommon());
            }
        }

        // Fuzzy match
        double bestScore = 0.0;
        for (String candidate : candidates) {
            if (candidate == null) continue;
            double score = jaroWinkler.apply(normalize(candidate), normalizedAnswer);
            if (score > bestScore) {
                bestScore = score;
            }
        }

        log.info("Quiz answer fuzzy score: country={} answer={} score={}", country.getNameCommon(), request.getAnswer(), bestScore);

        if (bestScore >= CORRECT_THRESHOLD) {
            return AnswerResponse.correct(country.getNameCommon());
        } else if (bestScore >= CLOSE_THRESHOLD) {
            return AnswerResponse.close(country.getNameCommon(), bestScore);
        } else {
            return AnswerResponse.wrong(bestScore);
        }
    }

    private String normalize(String input) {
        if (input == null) return "";
        String stripped = Normalizer.normalize(input.trim().toLowerCase(), Normalizer.Form.NFD);
        return stripped.replaceAll("\\p{M}", "");
    }
}
