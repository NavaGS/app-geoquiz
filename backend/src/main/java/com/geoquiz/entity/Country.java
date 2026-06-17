package com.geoquiz.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "countries")
public class Country {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "iso_a2", unique = true, length = 2)
    private String isoA2;

    @Column(name = "iso_a3", unique = true, length = 3)
    private String isoA3;

    @Column(name = "name_common")
    private String nameCommon;

    @Column(name = "name_official")
    private String nameOfficial;

    private String region;
    private String subregion;
    private String capital;

    @Column(name = "flag_svg_url")
    private String flagSvgUrl;

    @Column(name = "flag_png_url")
    private String flagPngUrl;

    @Column(name = "flag_emoji", length = 10)
    private String flagEmoji;

    @Column(name = "currency_code", length = 10)
    private String currencyCode;

    @Column(name = "currency_name")
    private String currencyName;

    @Column(name = "currency_symbol", length = 10)
    private String currencySymbol;

    @Column(name = "languages", columnDefinition = "TEXT")
    private String languages;

    @Column(name = "borders", columnDefinition = "TEXT")
    private String borders;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "difficulty", nullable = false)
    private int difficulty = 3;

    @OneToMany(mappedBy = "country", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<CountryAlias> aliases = new ArrayList<>();

    @OneToMany(mappedBy = "country", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<City> cities = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getIsoA2() { return isoA2; }
    public void setIsoA2(String isoA2) { this.isoA2 = isoA2; }
    public String getIsoA3() { return isoA3; }
    public void setIsoA3(String isoA3) { this.isoA3 = isoA3; }
    public String getNameCommon() { return nameCommon; }
    public void setNameCommon(String nameCommon) { this.nameCommon = nameCommon; }
    public String getNameOfficial() { return nameOfficial; }
    public void setNameOfficial(String nameOfficial) { this.nameOfficial = nameOfficial; }
    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }
    public String getSubregion() { return subregion; }
    public void setSubregion(String subregion) { this.subregion = subregion; }
    public String getCapital() { return capital; }
    public void setCapital(String capital) { this.capital = capital; }
    public String getFlagSvgUrl() { return flagSvgUrl; }
    public void setFlagSvgUrl(String flagSvgUrl) { this.flagSvgUrl = flagSvgUrl; }
    public String getFlagPngUrl() { return flagPngUrl; }
    public void setFlagPngUrl(String flagPngUrl) { this.flagPngUrl = flagPngUrl; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public int getDifficulty() { return difficulty; }
    public void setDifficulty(int difficulty) { this.difficulty = difficulty; }
    public List<CountryAlias> getAliases() { return aliases; }
    public void setAliases(List<CountryAlias> aliases) { this.aliases = aliases; }
    public List<City> getCities() { return cities; }
    public void setCities(List<City> cities) { this.cities = cities; }
    public String getFlagEmoji() { return flagEmoji; }
    public void setFlagEmoji(String flagEmoji) { this.flagEmoji = flagEmoji; }
    public String getCurrencyCode() { return currencyCode; }
    public void setCurrencyCode(String currencyCode) { this.currencyCode = currencyCode; }
    public String getCurrencyName() { return currencyName; }
    public void setCurrencyName(String currencyName) { this.currencyName = currencyName; }
    public String getCurrencySymbol() { return currencySymbol; }
    public void setCurrencySymbol(String currencySymbol) { this.currencySymbol = currencySymbol; }
    public String getLanguages() { return languages; }
    public void setLanguages(String languages) { this.languages = languages; }
    public String getBorders() { return borders; }
    public void setBorders(String borders) { this.borders = borders; }
}
