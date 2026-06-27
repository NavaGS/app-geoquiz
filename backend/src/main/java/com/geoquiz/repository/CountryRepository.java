package com.geoquiz.repository;

import com.geoquiz.entity.Country;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CountryRepository extends JpaRepository<Country, Long> {

    Optional<Country> findByIsoA2IgnoreCase(String isoA2);

    Optional<Country> findByIsoA3IgnoreCase(String isoA3);

    List<Country> findByRegionIgnoreCase(String region);

    @Query("SELECT c FROM Country c WHERE LOWER(c.region) = LOWER(:region) OR :region = 'All'")
    List<Country> findByRegionOrAll(@Param("region") String region);

    List<Country> findByCurrencyCodeIgnoreCase(String currencyCode);

    long count();
}
