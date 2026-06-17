package com.geoquiz.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "quiz_events")
public class QuizEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id")
    private String sessionId;

    private String mode;

    @Column(name = "region_filter")
    private String regionFilter;

    @Column(name = "event_type")
    private String eventType;

    @Column(name = "country_iso")
    private String countryIso;

    @Column(name = "answer_given")
    private String answerGiven;

    @Column(name = "was_correct")
    private Boolean wasCorrect;

    @Column(name = "similarity_score")
    private Double similarityScore;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }
    public String getRegionFilter() { return regionFilter; }
    public void setRegionFilter(String regionFilter) { this.regionFilter = regionFilter; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getCountryIso() { return countryIso; }
    public void setCountryIso(String countryIso) { this.countryIso = countryIso; }
    public String getAnswerGiven() { return answerGiven; }
    public void setAnswerGiven(String answerGiven) { this.answerGiven = answerGiven; }
    public Boolean getWasCorrect() { return wasCorrect; }
    public void setWasCorrect(Boolean wasCorrect) { this.wasCorrect = wasCorrect; }
    public Double getSimilarityScore() { return similarityScore; }
    public void setSimilarityScore(Double similarityScore) { this.similarityScore = similarityScore; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
