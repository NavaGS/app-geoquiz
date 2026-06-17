package com.geoquiz.repository;

import com.geoquiz.entity.CountryBoundary;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CountryBoundaryRepository extends JpaRepository<CountryBoundary, Long> {
    Optional<CountryBoundary> findByCountryId(Long countryId);
}
