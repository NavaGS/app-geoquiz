package com.geoquiz.dto;

public class QuizEventRequest {
    private String sessionId;
    private String mode;
    private String regionFilter;
    private String eventType;
    private String countryIso;
    private String answerGiven;
    private Boolean wasCorrect;
    private Double similarityScore;

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
}
