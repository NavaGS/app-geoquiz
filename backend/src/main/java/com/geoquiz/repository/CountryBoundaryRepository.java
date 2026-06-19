package com.geoquiz.repository;

import com.geoquiz.entity.CountryBoundary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CountryBoundaryRepository extends JpaRepository<CountryBoundary, Long> {
    Optional<CountryBoundary> findByCountryId(Long countryId);

    @Query("SELECT b.country.id FROM CountryBoundary b")
    List<Long> findAllCountryIds();
}
