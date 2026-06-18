package com.geoquiz.service;

import com.geoquiz.entity.Room;
import com.geoquiz.entity.RoomPlayer;
import com.geoquiz.entity.RoomStatus;
import com.geoquiz.repository.RoomPlayerRepository;
import com.geoquiz.repository.RoomRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.util.List;
import java.util.UUID;

@Service
public class RoomService {

    private static final Logger log = LoggerFactory.getLogger(RoomService.class);
    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 6;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final RoomRepository roomRepo;
    private final RoomPlayerRepository playerRepo;

    public RoomService(RoomRepository roomRepo, RoomPlayerRepository playerRepo) {
        this.roomRepo = roomRepo;
        this.playerRepo = playerRepo;
    }

    @Transactional
    public RoomPlayer createRoom(String quizMode, String region, String hostDisplayName,
                                 int difficultyRating, String difficultyMode, int maxQuestions,
                                 int questionDurationSeconds) {
        String code = generateUniqueCode();

        Room room = new Room();
        room.setRoomCode(code);
        room.setQuizMode(quizMode);
        room.setRegion(region != null ? region : "All");
        room.setDifficultyRating(Math.max(1, Math.min(5, difficultyRating)));
        room.setDifficultyMode("exact".equals(difficultyMode) ? "exact" : "inclusive");
        room.setMaxQuestions(Math.max(1, Math.min(30, maxQuestions)));
        room.setQuestionDurationSeconds(Math.max(5, Math.min(60, questionDurationSeconds)));
        room.setStatus(RoomStatus.LOBBY);
        room = roomRepo.save(room);

        UUID hostToken = UUID.randomUUID();
        RoomPlayer host = new RoomPlayer();
        host.setRoomId(room.getId());
        host.setDisplayName(hostDisplayName);
        host.setHostToken(hostToken);
        host = playerRepo.save(host);

        room.setHostPlayerId(host.getId());
        roomRepo.save(room);

        log.info("Room created: code={} mode={} host={}", code, quizMode, hostDisplayName);
        return host;
    }

    @Transactional
    public RoomPlayer joinRoom(String roomCode, String displayName) {
        Room room = getActiveRoom(roomCode);
        if (room.getStatus() != RoomStatus.LOBBY) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Game already in progress");
        }

        RoomPlayer player = new RoomPlayer();
        player.setRoomId(room.getId());
        player.setDisplayName(displayName);
        player = playerRepo.save(player);

        log.info("Player joined: code={} name={}", roomCode, displayName);
        return player;
    }

    @Transactional
    public void leaveRoom(String roomCode, UUID playerId) {
        Room room = getActiveRoom(roomCode);
        playerRepo.findById(playerId).ifPresent(p -> {
            p.setActive(false);
            playerRepo.save(p);
        });

        if (room.getHostPlayerId().equals(playerId) && room.getStatus() == RoomStatus.LOBBY) {
            room.setStatus(RoomStatus.ENDED);
            roomRepo.save(room);
        }
    }

    public Room getActiveRoom(String roomCode) {
        return roomRepo.findByRoomCode(roomCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found: " + roomCode));
    }

    public Room getActiveRoomById(UUID id) {
        return roomRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));
    }

    public List<RoomPlayer> getActivePlayers(String roomCode) {
        Room room = getActiveRoom(roomCode);
        return playerRepo.findByRoomIdAndIsActiveTrue(room.getId());
    }

    public List<RoomPlayer> getLeaderboard(String roomCode) {
        Room room = getActiveRoom(roomCode);
        return playerRepo.findByRoomIdOrderByScoreDesc(room.getId());
    }

    public void validateHost(String roomCode, String hostToken) {
        Room room = getActiveRoom(roomCode);
        UUID token = UUID.fromString(hostToken);
        playerRepo.findByRoomIdAndHostToken(room.getId(), token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Not the host"));
    }

    @Transactional
    public void updateRoomStatus(String roomCode, RoomStatus status) {
        Room room = getActiveRoom(roomCode);
        room.setStatus(status);
        roomRepo.save(room);
    }

    @Transactional
    public void addScore(UUID playerId, int points) {
        playerRepo.findById(playerId).ifPresent(p -> {
            p.setScore(p.getScore() + points);
            playerRepo.save(p);
        });
    }

    private String generateUniqueCode() {
        for (int attempt = 0; attempt < 20; attempt++) {
            StringBuilder sb = new StringBuilder(CODE_LENGTH);
            for (int i = 0; i < CODE_LENGTH; i++) {
                sb.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
            }
            String code = sb.toString();
            if (!roomRepo.existsByRoomCode(code)) {
                return code;
            }
        }
        throw new IllegalStateException("Could not generate unique room code");
    }
}
