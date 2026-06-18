package com.geoquiz.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "multiplayer_answers")
public class MultiplayerAnswer {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "player_id", nullable = false)
    private UUID playerId;

    @Column(name = "question_index")
    private int questionIndex;

    @Column(name = "answer_given")
    private String answerGiven;

    @Column(name = "is_correct")
    private boolean isCorrect;

    @Column(name = "response_time_ms")
    private long responseTimeMs;

    @Column(name = "submitted_at")
    private Instant submittedAt = Instant.now();

    public UUID getId() { return id; }
    public UUID getPlayerId() { return playerId; }
    public void setPlayerId(UUID playerId) { this.playerId = playerId; }
    public int getQuestionIndex() { return questionIndex; }
    public void setQuestionIndex(int questionIndex) { this.questionIndex = questionIndex; }
    public String getAnswerGiven() { return answerGiven; }
    public void setAnswerGiven(String answerGiven) { this.answerGiven = answerGiven; }
    public boolean isCorrect() { return isCorrect; }
    public void setCorrect(boolean correct) { isCorrect = correct; }
    public long getResponseTimeMs() { return responseTimeMs; }
    public void setResponseTimeMs(long responseTimeMs) { this.responseTimeMs = responseTimeMs; }
    public Instant getSubmittedAt() { return submittedAt; }
}
