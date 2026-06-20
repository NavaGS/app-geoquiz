package com.geoquiz.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.geoquiz.entity.Country;
import com.geoquiz.repository.CityRepository;
import com.geoquiz.repository.CountryBoundaryRepository;
import com.geoquiz.repository.CountryRepository;
import com.geoquiz.service.DataRefreshService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final DataRefreshService dataRefreshService;
    private final CountryRepository countryRepository;
    private final CityRepository cityRepository;
    private final CountryBoundaryRepository boundaryRepository;
    private final ObjectMapper objectMapper;

    public AdminController(DataRefreshService dataRefreshService,
                           CountryRepository countryRepository,
                           CityRepository cityRepository,
                           CountryBoundaryRepository boundaryRepository,
                           ObjectMapper objectMapper) {
        this.dataRefreshService = dataRefreshService;
        this.countryRepository = countryRepository;
        this.cityRepository = cityRepository;
        this.boundaryRepository = boundaryRepository;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/countries-data")
    public List<Map<String, Object>> getCountriesData() {
        List<Country> countries = countryRepository.findAll();

        Set<Long> boundaryCountryIds = new HashSet<>(boundaryRepository.findAllCountryIds());

        Map<Long, List<String>> cityNamesByCountry = new HashMap<>();
        for (Object[] row : cityRepository.findAllNonCapitalCountryIdsAndNames()) {
            Long countryId = (Long) row[0];
            String name = (String) row[1];
            List<String> names = cityNamesByCountry.computeIfAbsent(countryId, k -> new ArrayList<>());
            if (names.size() < 3) names.add(name);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Country c : countries) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("nameCommon", c.getNameCommon());
            m.put("isoA2", c.getIsoA2());
            m.put("flagPngUrl", c.getFlagPngUrl());
            m.put("hasBoundary", boundaryCountryIds.contains(c.getId()));
            m.put("capital", c.getCapital());
            m.put("difficulty", c.getDifficulty());
            List<String> cityNames = cityNamesByCountry.getOrDefault(c.getId(), List.of());
            m.put("cityCount", (long) cityNames.size());
            m.put("cityNames", cityNames);
            m.put("region", c.getRegion());
            m.put("subregion", c.getSubregion());
            m.put("flagEmoji", c.getFlagEmoji());
            m.put("currencyCode", c.getCurrencyCode());
            m.put("currencyName", c.getCurrencyName());
            m.put("currencySymbol", c.getCurrencySymbol());
            try {
                m.put("languages", c.getLanguages() != null
                    ? objectMapper.readValue(c.getLanguages(), List.class)
                    : List.of());
            } catch (Exception e) { m.put("languages", List.of()); }
            try {
                m.put("borders", c.getBorders() != null
                    ? objectMapper.readValue(c.getBorders(), List.class)
                    : List.of());
            } catch (Exception e) { m.put("borders", List.of()); }
            result.add(m);
        }
        return result;
    }

    @PostMapping("/refresh-data")
    public ResponseEntity<Map<String, String>> refreshData(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();
        if (!remoteAddr.equals("127.0.0.1") && !remoteAddr.equals("::1") && !remoteAddr.equals("0:0:0:0:0:0:0:1")) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden — localhost only"));
        }
        try {
            dataRefreshService.refreshAll();
            return ResponseEntity.ok(Map.of("status", "refresh triggered"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
