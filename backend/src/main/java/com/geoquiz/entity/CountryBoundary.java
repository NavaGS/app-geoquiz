package com.geoquiz.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "country_boundaries")
public class CountryBoundary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "country_id")
    private Country country;

    @Column(columnDefinition = "TEXT")
    private String geojson;

    @Column(name = "simplified_geojson", columnDefinition = "TEXT")
    private String simplifiedGeojson;

    @Column(name = "updated_at")
    private Instant updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Country getCountry() { return country; }
    public void setCountry(Country country) { this.country = country; }
    public String getGeojson() { return geojson; }
    public void setGeojson(String geojson) { this.geojson = geojson; }
    public String getSimplifiedGeojson() { return simplifiedGeojson; }
    public void setSimplifiedGeojson(String simplifiedGeojson) { this.simplifiedGeojson = simplifiedGeojson; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
