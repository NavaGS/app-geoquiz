package com.geoquiz.controller;

import com.geoquiz.dto.multiplayer.CreateRoomRequest;
import com.geoquiz.dto.multiplayer.CreateRoomResponse;
import com.geoquiz.dto.multiplayer.RoomStateResponse;
import com.geoquiz.entity.Room;
import com.geoquiz.entity.RoomPlayer;
import com.geoquiz.service.RoomService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
public class MultiplayerRestController {

    private final RoomService roomService;

    public MultiplayerRestController(RoomService roomService) {
        this.roomService = roomService;
    }

    @PostMapping
    public ResponseEntity<CreateRoomResponse> createRoom(@RequestBody CreateRoomRequest req) {
        RoomPlayer host = roomService.createRoom(
                req.getQuizMode(), req.getRegion(), req.getHostDisplayName(),
                req.getDifficultyRating(), req.getDifficultyMode(),
                req.getMaxQuestions(), req.getQuestionDurationSeconds());
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
                playerInfos
        ));
    }
}
