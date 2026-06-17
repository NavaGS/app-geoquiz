package com.geoquiz.repository;

import com.geoquiz.entity.CountryAlias;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CountryAliasRepository extends JpaRepository<CountryAlias, Long> {
    List<CountryAlias> findByCountryId(Long countryId);
    void deleteByCountryId(Long countryId);
}
