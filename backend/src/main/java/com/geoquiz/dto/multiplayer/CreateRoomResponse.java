package com.geoquiz.dto.multiplayer;

public class CreateRoomResponse {
    private final String roomCode;
    private final String playerId;
    private final String hostToken;

    public CreateRoomResponse(String roomCode, String playerId, String hostToken) {
        this.roomCode = roomCode;
        this.playerId = playerId;
        this.hostToken = hostToken;
    }

    public String getRoomCode() { return roomCode; }
    public String getPlayerId() { return playerId; }
    public String getHostToken() { return hostToken; }
}
