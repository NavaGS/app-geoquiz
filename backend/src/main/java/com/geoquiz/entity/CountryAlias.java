package com.geoquiz.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "country_aliases")
public class CountryAlias {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "country_id")
    private Country country;

    private String alias;
    private String source;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Country getCountry() { return country; }
    public void setCountry(Country country) { this.country = country; }
    public String getAlias() { return alias; }
    public void setAlias(String alias) { this.alias = alias; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
}
