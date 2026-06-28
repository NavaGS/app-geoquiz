package com.geoquiz.dto;

import jakarta.validation.constraints.NotBlank;

public class AnswerRequest {

    @NotBlank
    private String countryIso;

    @NotBlank
    private String answer;

    private String mode;
    private String sessionId;
    private String regionFilter;

    public String getCountryIso() { return countryIso; }
    public void setCountryIso(String countryIso) { this.countryIso = countryIso; }
    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }
    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public String getRegionFilter() { return regionFilter; }
    public void setRegionFilter(String regionFilter) { this.regionFilter = regionFilter; }
}
