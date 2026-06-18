package com.geoquiz.dto.multiplayer;

public class CreateRoomRequest {
    private String quizMode;
    private String region;
    private String hostDisplayName;
    private int difficultyRating = 5;
    private String difficultyMode = "inclusive";
    private int maxQuestions = 15;
    private int questionDurationSeconds = 20;

    public String getQuizMode() { return quizMode; }
    public void setQuizMode(String quizMode) { this.quizMode = quizMode; }
    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }
    public String getHostDisplayName() { return hostDisplayName; }
    public void setHostDisplayName(String hostDisplayName) { this.hostDisplayName = hostDisplayName; }
    public int getDifficultyRating() { return difficultyRating; }
    public void setDifficultyRating(int difficultyRating) { this.difficultyRating = difficultyRating; }
    public String getDifficultyMode() { return difficultyMode; }
    public void setDifficultyMode(String difficultyMode) { this.difficultyMode = difficultyMode; }
    public int getMaxQuestions() { return maxQuestions; }
    public void setMaxQuestions(int maxQuestions) { this.maxQuestions = maxQuestions; }
    public int getQuestionDurationSeconds() { return questionDurationSeconds; }
    public void setQuestionDurationSeconds(int s) { this.questionDurationSeconds = s; }
}
