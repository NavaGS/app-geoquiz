package com.geoquiz.controller;

import com.geoquiz.dto.multiplayer.JoinRoomMsg;
import com.geoquiz.dto.multiplayer.StartGameMsg;
import com.geoquiz.dto.multiplayer.SubmitAnswerMsg;
import com.geoquiz.entity.RoomPlayer;
import com.geoquiz.service.GameService;
import com.geoquiz.service.RoomService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.HashMap;
import java.util.Map;

@Controller
public class MultiplayerWsController {

    private static final Logger log = LoggerFactory.getLogger(MultiplayerWsController.class);

    private final RoomService roomService;
    private final GameService gameService;
    private final SimpMessagingTemplate messaging;

    public MultiplayerWsController(RoomService roomService, GameService gameService,
                                   SimpMessagingTemplate messaging) {
        this.roomService = roomService;
        this.gameService = gameService;
        this.messaging = messaging;
    }

    @MessageMapping("/room/join")
    public void joinRoom(JoinRoomMsg msg) {
        try {
            // Player already registered via REST /api/rooms/{code}/join.
            // This message just announces presence to all room subscribers.
            var players = roomService.getActivePlayers(msg.getRoomCode());

            Map<String, Object> broadcast = new HashMap<>();
            broadcast.put("type", "PLAYER_JOINED");
            broadcast.put("playerId", msg.getPlayerId());
            broadcast.put("displayName", msg.getDisplayName());
            broadcast.put("playerCount", players.size());
            broadcast.put("players", players.stream()
                    .map(p -> Map.of("id", p.getId().toString(), "displayName", p.getDisplayName(), "score", p.getScore()))
                    .toList());

            messaging.convertAndSend("/topic/room/" + msg.getRoomCode(), broadcast);
        } catch (Exception e) {
            log.warn("joinRoom failed: {}", e.getMessage());
        }
    }

    @MessageMapping("/room/leave")
    public void leaveRoom(Map<String, String> msg) {
        try {
            String roomCode = msg.get("roomCode");
            String playerIdStr = msg.get("playerId");
            roomService.leaveRoom(roomCode, java.util.UUID.fromString(playerIdStr));

            var players = roomService.getActivePlayers(roomCode);

            Map<String, Object> broadcast = new HashMap<>();
            broadcast.put("type", "PLAYER_LEFT");
            broadcast.put("playerId", playerIdStr);
            broadcast.put("playerCount", players.size());
            broadcast.put("players", players.stream()
                    .map(p -> Map.of("id", p.getId().toString(), "displayName", p.getDisplayName(), "score", p.getScore()))
                    .toList());

            messaging.convertAndSend("/topic/room/" + roomCode, broadcast);
        } catch (Exception e) {
            log.warn("leaveRoom failed: {}", e.getMessage());
        }
    }

    @MessageMapping("/game/start")
    public void startGame(StartGameMsg msg) {
        try {
            log.info("startGame received: roomCode={} hostToken={}", msg.getRoomCode(), msg.getHostToken());
            gameService.startGame(msg.getRoomCode(), msg.getHostToken());
        } catch (Exception e) {
            log.warn("startGame failed: {} {}", e.getClass().getSimpleName(), e.getMessage(), e);
        }
    }

    @MessageMapping("/game/answer")
    public void submitAnswer(SubmitAnswerMsg msg) {
        try {
            gameService.handleAnswer(msg.getRoomCode(), msg.getPlayerId(),
                    msg.getQuestionIndex(), msg.getAnswer());
        } catch (Exception e) {
            log.warn("submitAnswer failed: {}", e.getMessage());
        }
    }
}
