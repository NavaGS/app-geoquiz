package com.geoquiz.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "rooms")
public class Room {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "room_code", unique = true, nullable = false, length = 6)
    private String roomCode;

    @Column(name = "host_player_id")
    private UUID hostPlayerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoomStatus status = RoomStatus.LOBBY;

    @Column(name = "current_question_index")
    private int currentQuestionIndex = 0;

    @Column(name = "quiz_mode", nullable = false)
    private String quizMode;

    @Column(name = "region")
    private String region = "All";

    @Column(name = "difficulty_rating")
    private int difficultyRating = 5;

    @Column(name = "difficulty_mode", length = 20)
    private String difficultyMode = "inclusive";

    @Column(name = "max_questions")
    private int maxQuestions = 15;

    @Column(name = "question_duration_seconds")
    private int questionDurationSeconds = 20;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public UUID getId() { return id; }
    public String getRoomCode() { return roomCode; }
    public void setRoomCode(String roomCode) { this.roomCode = roomCode; }
    public UUID getHostPlayerId() { return hostPlayerId; }
    public void setHostPlayerId(UUID hostPlayerId) { this.hostPlayerId = hostPlayerId; }
    public RoomStatus getStatus() { return status; }
    public void setStatus(RoomStatus status) { this.status = status; }
    public int getCurrentQuestionIndex() { return currentQuestionIndex; }
    public void setCurrentQuestionIndex(int idx) { this.currentQuestionIndex = idx; }
    public String getQuizMode() { return quizMode; }
    public void setQuizMode(String quizMode) { this.quizMode = quizMode; }
    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }
    public int getDifficultyRating() { return difficultyRating; }
    public void setDifficultyRating(int difficultyRating) { this.difficultyRating = difficultyRating; }
    public String getDifficultyMode() { return difficultyMode; }
    public void setDifficultyMode(String difficultyMode) { this.difficultyMode = difficultyMode; }
    public int getMaxQuestions() { return maxQuestions; }
    public void setMaxQuestions(int maxQuestions) { this.maxQuestions = maxQuestions; }
    public int getQuestionDurationSeconds() { return questionDurationSeconds; }
    public void setQuestionDurationSeconds(int s) { this.questionDurationSeconds = s; }
    public Instant getCreatedAt() { return createdAt; }
}
