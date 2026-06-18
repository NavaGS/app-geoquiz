package com.geoquiz.dto.multiplayer;

public class UpdateRoomSettingsRequest {
    private String hostToken;
    private int difficultyRating;
    private String difficultyMode;
    private int maxQuestions;
    private int questionDurationSeconds;
    private String responseAttempts;

    public String getHostToken() { return hostToken; }
    public void setHostToken(String hostToken) { this.hostToken = hostToken; }
    public int getDifficultyRating() { return difficultyRating; }
    public void setDifficultyRating(int difficultyRating) { this.difficultyRating = difficultyRating; }
    public String getDifficultyMode() { return difficultyMode; }
    public void setDifficultyMode(String difficultyMode) { this.difficultyMode = difficultyMode; }
    public int getMaxQuestions() { return maxQuestions; }
    public void setMaxQuestions(int maxQuestions) { this.maxQuestions = maxQuestions; }
    public int getQuestionDurationSeconds() { return questionDurationSeconds; }
    public void setQuestionDurationSeconds(int s) { this.questionDurationSeconds = s; }
    public String getResponseAttempts() { return responseAttempts; }
    public void setResponseAttempts(String responseAttempts) { this.responseAttempts = responseAttempts; }
}
