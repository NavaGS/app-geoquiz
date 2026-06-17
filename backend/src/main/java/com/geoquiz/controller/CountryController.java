package com.geoquiz.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.geoquiz.entity.City;
import com.geoquiz.entity.Country;
import com.geoquiz.entity.CountryBoundary;
import com.geoquiz.repository.CityRepository;
import com.geoquiz.repository.CountryBoundaryRepository;
import com.geoquiz.repository.CountryRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

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

    @GetMapping
    public List<Map<String, Object>> listCountries(@RequestParam(defaultValue = "All") String region) {
        List<Country> countries;
        if ("All".equalsIgnoreCase(region)) {
            countries = countryRepository.findAll();
        } else {
            countries = countryRepository.findByRegionIgnoreCase(region);
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
            // hasBoundary
            boolean hasBoundary = boundaryRepository.findByCountryId(c.getId()).isPresent();
            m.put("hasBoundary", hasBoundary);
            m.put("difficulty", c.getDifficulty());
            // cityCount + cityNames (non-capital cities only, top 3 by population)
            List<City> cities = cityRepository.findByCountryIdAndIsCapitalFalseOrderByPopulationDesc(c.getId());
            int limit = Math.min(3, cities.size());
            m.put("cityCount", (long) limit);
            List<String> cityNames = new ArrayList<>();
            for (int i = 0; i < limit; i++) cityNames.add(cities.get(i).getName());
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
        return result;
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
