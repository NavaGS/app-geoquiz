package com.geoquiz.dto.multiplayer;

public class StartGameMsg {
    private String roomCode;
    private String hostToken;

    public String getRoomCode() { return roomCode; }
    public void setRoomCode(String roomCode) { this.roomCode = roomCode; }
    public String getHostToken() { return hostToken; }
    public void setHostToken(String hostToken) { this.hostToken = hostToken; }
}
