package com.geoquiz.controller;

import com.geoquiz.dto.multiplayer.CreateRoomRequest;
import com.geoquiz.dto.multiplayer.CreateRoomResponse;
import com.geoquiz.dto.multiplayer.RoomStateResponse;
import com.geoquiz.dto.multiplayer.UpdateRoomSettingsRequest;
import com.geoquiz.entity.Room;
import com.geoquiz.entity.RoomPlayer;
import com.geoquiz.service.RoomService;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rooms")
public class MultiplayerRestController {

    private final RoomService roomService;
    private final SimpMessagingTemplate messaging;

    public MultiplayerRestController(RoomService roomService, SimpMessagingTemplate messaging) {
        this.roomService = roomService;
        this.messaging = messaging;
    }

    @PostMapping
    public ResponseEntity<CreateRoomResponse> createRoom(@RequestBody CreateRoomRequest req) {
        RoomPlayer host = roomService.createRoom(
                req.getQuizMode(), req.getRegion(), req.getHostDisplayName(),
                req.getDifficultyRating(), req.getDifficultyMode(),
                req.getMaxQuestions(), req.getQuestionDurationSeconds(), req.getResponseAttempts());
        Room room = roomService.getActiveRoomById(host.getRoomId());
        return ResponseEntity.ok(new CreateRoomResponse(
                room.getRoomCode(),
                host.getId().toString(),
                host.getHostToken().toString()
        ));
    }

    @PostMapping("/{code}/join")
    public ResponseEntity<Map<String, String>> joinRoom(@PathVariable String code,
                                                        @RequestBody Map<String, String> body) {
        RoomPlayer player = roomService.joinRoom(code, body.get("displayName"));
        return ResponseEntity.ok(Map.of("playerId", player.getId().toString()));
    }

    @GetMapping("/{code}")
    public ResponseEntity<RoomStateResponse> getRoom(@PathVariable String code) {
        Room room = roomService.getActiveRoom(code);
        List<RoomPlayer> players = roomService.getActivePlayers(code);

        List<RoomStateResponse.PlayerInfo> playerInfos = players.stream()
                .map(p -> new RoomStateResponse.PlayerInfo(p.getId().toString(), p.getDisplayName(), p.getScore()))
                .toList();

        return ResponseEntity.ok(new RoomStateResponse(
                room.getRoomCode(),
                room.getStatus().name(),
                room.getQuizMode(),
                room.getRegion(),
                room.getDifficultyRating(),
                room.getDifficultyMode(),
                room.getMaxQuestions(),
                room.getQuestionDurationSeconds(),
                room.getResponseAttempts(),
                playerInfos
        ));
    }

    @PatchMapping("/{code}/settings")
    public ResponseEntity<Void> updateSettings(@PathVariable String code,
                                               @RequestBody UpdateRoomSettingsRequest req) {
        Room room = roomService.updateSettings(code, req.getHostToken(),
                req.getDifficultyRating(), req.getDifficultyMode(),
                req.getMaxQuestions(), req.getQuestionDurationSeconds(), req.getResponseAttempts());

        Map<String, Object> broadcast = new HashMap<>();
        broadcast.put("type", "SETTINGS_UPDATED");
        broadcast.put("difficultyRating", room.getDifficultyRating());
        broadcast.put("difficultyMode", room.getDifficultyMode());
        broadcast.put("maxQuestions", room.getMaxQuestions());
        broadcast.put("questionDurationSeconds", room.getQuestionDurationSeconds());
        broadcast.put("responseAttempts", room.getResponseAttempts());
        messaging.convertAndSend("/topic/room/" + code, broadcast);

        return ResponseEntity.noContent().build();
    }
}
