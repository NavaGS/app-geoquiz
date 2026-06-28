package com.geoquiz.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.geoquiz.entity.City;
import com.geoquiz.entity.Country;
import com.geoquiz.entity.CountryBoundary;
import com.geoquiz.repository.CityRepository;
import com.geoquiz.repository.CountryBoundaryRepository;
import com.geoquiz.repository.CountryRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/countries")
public class CountryController {

    private final CountryRepository countryRepository;
    private final CityRepository cityRepository;
    private final CountryBoundaryRepository boundaryRepository;
    private final ObjectMapper objectMapper;

    public CountryController(CountryRepository countryRepository,
                              CityRepository cityRepository,
                              CountryBoundaryRepository boundaryRepository,
                              ObjectMapper objectMapper) {
        this.countryRepository = countryRepository;
        this.cityRepository = cityRepository;
        this.boundaryRepository = boundaryRepository;
        this.objectMapper = objectMapper;
    }

    @Cacheable(value = "countries", key = "#region")
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listCountries(@RequestParam(defaultValue = "All") String region) {
        List<Country> countries;
        if ("All".equalsIgnoreCase(region)) {
            countries = countryRepository.findAll();
        } else {
            countries = countryRepository.findByRegionIgnoreCase(region);
        }

        // Bulk fetch in 2 queries instead of N+1 (one per country)
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
            m.put("isoA2", c.getIsoA2());
            m.put("isoA3", c.getIsoA3());
            m.put("nameCommon", c.getNameCommon());
            m.put("nameOfficial", c.getNameOfficial());
            m.put("region", c.getRegion());
            m.put("subregion", c.getSubregion());
            m.put("capital", c.getCapital());
            m.put("flagSvgUrl", c.getFlagSvgUrl());
            m.put("flagPngUrl", c.getFlagPngUrl());
            m.put("hasBoundary", boundaryCountryIds.contains(c.getId()));
            m.put("difficulty", c.getDifficulty());
            List<String> cityNames = cityNamesByCountry.getOrDefault(c.getId(), List.of());
            m.put("cityCount", (long) cityNames.size());
            m.put("cityNames", cityNames);
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

        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(5, TimeUnit.MINUTES).cachePublic())
                .body(result);
    }

    @GetMapping("/{iso}/flag")
    public ResponseEntity<Map<String, Object>> getFlag(@PathVariable String iso) {
        return findCountry(iso).map(c -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("isoA2", c.getIsoA2());
            m.put("nameCommon", c.getNameCommon());
            m.put("flagSvgUrl", c.getFlagSvgUrl());
            m.put("flagPngUrl", c.getFlagPngUrl());
            return ResponseEntity.ok(m);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{iso}/shape")
    public ResponseEntity<Map<String, Object>> getShape(@PathVariable String iso) {
        return findCountry(iso).flatMap(c ->
            boundaryRepository.findByCountryId(c.getId()).map(b -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("isoA2", c.getIsoA2());
                m.put("nameCommon", c.getNameCommon());
                String geojson = b.getSimplifiedGeojson() != null ? b.getSimplifiedGeojson() : b.getGeojson();
                m.put("geojson", geojson);
                return ResponseEntity.ok(m);
            })
        ).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{iso}/cities")
    public ResponseEntity<List<Map<String, Object>>> getCities(@PathVariable String iso) {
        return findCountry(iso).map(c -> {
            List<City> cities = cityRepository
                    .findByCountryIdAndIsCapitalFalseOrderByPopulationDesc(c.getId());
            List<Map<String, Object>> result = new ArrayList<>();
            int limit = Math.min(3, cities.size());
            for (int i = 0; i < limit; i++) {
                City city = cities.get(i);
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("name", city.getName());
                m.put("population", city.getPopulation());
                result.add(m);
            }
            return ResponseEntity.ok(result);
        }).orElse(ResponseEntity.notFound().build());
    }

    private java.util.Optional<Country> findCountry(String iso) {
        if (iso.length() == 2) {
            return countryRepository.findByIsoA2IgnoreCase(iso);
        } else {
            return countryRepository.findByIsoA3IgnoreCase(iso);
        }
    }
}
