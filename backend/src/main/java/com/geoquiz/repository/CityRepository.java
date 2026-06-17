package com.geoquiz.repository;

import com.geoquiz.entity.City;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CityRepository extends JpaRepository<City, Long> {
    List<City> findByCountryIdAndIsCapitalFalseOrderByPopulationDesc(Long countryId);
    List<City> findByCountryId(Long countryId);
    Optional<City> findByCountryIdAndIsCapitalTrue(Long countryId);
    void deleteByCountryId(Long countryId);

    @Modifying
    @Query("DELETE FROM City c WHERE c.country.id = :countryId AND c.isCapital = false")
    void deleteNonCapitalsByCountryId(@Param("countryId") Long countryId);

    @Query("SELECT COUNT(c) FROM City c WHERE c.isCapital = false")
    long countNonCapitals();

    @Query("SELECT COUNT(c) FROM City c WHERE c.country.id = :countryId AND c.isCapital = false")
    long countNonCapitalsByCountryId(@Param("countryId") Long countryId);
}
