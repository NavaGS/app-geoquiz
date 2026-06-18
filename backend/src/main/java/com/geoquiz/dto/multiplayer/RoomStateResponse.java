package com.geoquiz.dto.multiplayer;

import java.util.List;

public class RoomStateResponse {
    private final String roomCode;
    private final String status;
    private final String quizMode;
    private final String region;
    private final int difficultyRating;
    private final String difficultyMode;
    private final int maxQuestions;
    private final int questionDurationSeconds;
    private final String responseAttempts;
    private final List<PlayerInfo> players;

    public RoomStateResponse(String roomCode, String status, String quizMode, String region,
                             int difficultyRating, String difficultyMode, int maxQuestions,
                             int questionDurationSeconds, String responseAttempts, List<PlayerInfo> players) {
        this.roomCode = roomCode;
        this.status = status;
        this.quizMode = quizMode;
        this.region = region;
        this.difficultyRating = difficultyRating;
        this.difficultyMode = difficultyMode;
        this.maxQuestions = maxQuestions;
        this.questionDurationSeconds = questionDurationSeconds;
        this.responseAttempts = responseAttempts;
        this.players = players;
    }

    public String getRoomCode() { return roomCode; }
    public String getStatus() { return status; }
    public String getQuizMode() { return quizMode; }
    public String getRegion() { return region; }
    public int getDifficultyRating() { return difficultyRating; }
    public String getDifficultyMode() { return difficultyMode; }
    public int getMaxQuestions() { return maxQuestions; }
    public int getQuestionDurationSeconds() { return questionDurationSeconds; }
    public String getResponseAttempts() { return responseAttempts; }
    public List<PlayerInfo> getPlayers() { return players; }

    public record PlayerInfo(String id, String displayName, int score) {}
}
