package com.geoquiz.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "cities")
public class City {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "country_id")
    private Country country;

    private String name;
    private Long population;

    @Column(name = "is_capital")
    private boolean isCapital;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Country getCountry() { return country; }
    public void setCountry(Country country) { this.country = country; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Long getPopulation() { return population; }
    public void setPopulation(Long population) { this.population = population; }
    public boolean isCapital() { return isCapital; }
    public void setCapital(boolean capital) { isCapital = capital; }
}
