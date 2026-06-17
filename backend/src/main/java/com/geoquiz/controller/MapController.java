package com.geoquiz.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.geoquiz.entity.Country;
import com.geoquiz.entity.CountryBoundary;
import com.geoquiz.repository.CountryBoundaryRepository;
import com.geoquiz.repository.CountryRepository;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/map")
public class MapController {

    private final CountryRepository countryRepository;
    private final CountryBoundaryRepository boundaryRepository;
    private final ObjectMapper objectMapper;

    public MapController(CountryRepository countryRepository,
                          CountryBoundaryRepository boundaryRepository,
                          ObjectMapper objectMapper) {
        this.countryRepository = countryRepository;
        this.boundaryRepository = boundaryRepository;
        this.objectMapper = objectMapper;
    }

    @GetMapping(value = "/geojson", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getWorldGeoJson(@RequestParam(defaultValue = "All") String region) {
        List<Country> countries;
        if ("All".equalsIgnoreCase(region)) {
            countries = countryRepository.findAll();
        } else {
            countries = countryRepository.findByRegionIgnoreCase(region);
        }

        List<Map<String, Object>> features = new ArrayList<>();
        for (Country c : countries) {
            Optional<CountryBoundary> boundary = boundaryRepository.findByCountryId(c.getId());
            if (boundary.isEmpty()) continue;

            String geojsonStr = boundary.get().getGeojson();
            if (geojsonStr == null) continue;

            try {
                Object geometry = objectMapper.readValue(geojsonStr, Object.class);
                Map<String, Object> feature = new LinkedHashMap<>();
                feature.put("type", "Feature");
                Map<String, Object> props = new LinkedHashMap<>();
                props.put("isoA2", c.getIsoA2());
                props.put("isoA3", c.getIsoA3());
                props.put("nameCommon", c.getNameCommon());
                props.put("region", c.getRegion());
                feature.put("properties", props);
                feature.put("geometry", geometry);
                features.add(feature);
            } catch (Exception e) {
                // skip invalid geojson
            }
        }

        Map<String, Object> featureCollection = new LinkedHashMap<>();
        featureCollection.put("type", "FeatureCollection");
        featureCollection.put("features", features);

        try {
            return ResponseEntity.ok(objectMapper.writeValueAsString(featureCollection));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
