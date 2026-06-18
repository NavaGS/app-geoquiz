package com.geoquiz.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "room_players")
public class RoomPlayer {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Column(name = "score")
    private int score = 0;

    @Column(name = "joined_at")
    private Instant joinedAt = Instant.now();

    @Column(name = "is_active")
    private boolean isActive = true;

    @Column(name = "host_token")
    private UUID hostToken;

    public UUID getId() { return id; }
    public UUID getRoomId() { return roomId; }
    public void setRoomId(UUID roomId) { this.roomId = roomId; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
    public Instant getJoinedAt() { return joinedAt; }
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
    public UUID getHostToken() { return hostToken; }
    public void setHostToken(UUID hostToken) { this.hostToken = hostToken; }
}
