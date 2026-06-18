package com.geoquiz.service;

import com.geoquiz.dto.AnswerRequest;
import com.geoquiz.dto.AnswerResponse;
import com.geoquiz.entity.Country;
import com.geoquiz.entity.MultiplayerAnswer;
import com.geoquiz.entity.RoomPlayer;
import com.geoquiz.entity.RoomStatus;
import com.geoquiz.repository.CountryRepository;
import com.geoquiz.repository.MultiplayerAnswerRepository;
import com.geoquiz.repository.RoomPlayerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;

@Service
public class GameService {

    private static final Logger log = LoggerFactory.getLogger(GameService.class);
    private static final int QUESTION_DURATION_SECONDS = 20;
    private static final int INTER_QUESTION_DELAY_SECONDS = 5;
    private static final int MAX_QUESTIONS = 15;

    private final SimpMessagingTemplate messaging;
    private final RoomService roomService;
    private final QuizAnswerService answerService;
    private final CountryRepository countryRepo;
    private final MultiplayerAnswerRepository answerRepo;
    private final RoomPlayerRepository playerRepo;
    private final ScheduledExecutorService executor = Executors.newScheduledThreadPool(4);

    private final ConcurrentHashMap<String, GameState> activeGames = new ConcurrentHashMap<>();

    public GameService(SimpMessagingTemplate messaging, RoomService roomService,
                       QuizAnswerService answerService, CountryRepository countryRepo,
                       MultiplayerAnswerRepository answerRepo, RoomPlayerRepository playerRepo) {
        this.messaging = messaging;
        this.roomService = roomService;
        this.answerService = answerService;
        this.countryRepo = countryRepo;
        this.answerRepo = answerRepo;
        this.playerRepo = playerRepo;
    }

    public void startGame(String roomCode, String hostToken) {
        roomService.validateHost(roomCode, hostToken);
        var room = roomService.getActiveRoom(roomCode);
        if (room.getStatus() != RoomStatus.LOBBY) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Game already started");
        }

        List<Country> pool = new ArrayList<>(loadQuestions(
                room.getQuizMode(), room.getRegion(),
                room.getDifficultyRating(), room.getDifficultyMode()));
        if (pool.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No questions available");
        }

        Collections.shuffle(pool);
        List<Country> questions = pool.subList(0, Math.min(room.getMaxQuestions(), pool.size()));

        GameState state = new GameState(roomCode, room.getQuizMode(), new ArrayList<>(questions), room.getQuestionDurationSeconds());
        activeGames.put(roomCode, state);

        roomService.updateRoomStatus(roomCode, RoomStatus.IN_PROGRESS);

        Map<String, Object> startMsg = new HashMap<>();
        startMsg.put("type", "GAME_STARTED");
        startMsg.put("totalQuestions", questions.size());
        startMsg.put("quizMode", room.getQuizMode());
        messaging.convertAndSend("/topic/room/" + roomCode, startMsg);

        sendQuestionStarted(roomCode, state);
        log.info("Game started: roomCode={} questions={}", roomCode, questions.size());
    }

    public void handleAnswer(String roomCode, String playerIdStr, int questionIndex, String answer) {
        GameState state = activeGames.get(roomCode);
        if (state == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active game");

        UUID playerId = UUID.fromString(playerIdStr);

        synchronized (state) {
            if (state.currentIndex != questionIndex) return;

            long now = System.currentTimeMillis();
            long deadline = state.questionStartTimeMs + (long) state.questionDurationSeconds * 1000;
            if (now > deadline) return;

            if (state.answeredPlayers.contains(playerId)) return;

            if (answerRepo.findByPlayerIdAndQuestionIndex(playerId, questionIndex).isPresent()) return;

            state.answeredPlayers.add(playerId);

            Country country = state.currentQuestion();
            AnswerRequest req = new AnswerRequest();
            req.setCountryIso(country.getIsoA2());
            req.setAnswer(answer);
            req.setMode(state.quizMode.equals("capitals") ? "capitals" : null);

            AnswerResponse eval = answerService.evaluate(req);
            boolean correct = eval.getResult() != AnswerResponse.Result.WRONG;

            int points = 0;
            if (correct) {
                long elapsed = now - state.questionStartTimeMs;
                long total = (long) state.questionDurationSeconds * 1000;
                long remaining = Math.max(0, total - elapsed);
                points = (int) (1000 + (remaining * 500.0 / total));
                roomService.addScore(playerId, points);
            }

            MultiplayerAnswer stored = new MultiplayerAnswer();
            stored.setPlayerId(playerId);
            stored.setQuestionIndex(questionIndex);
            stored.setAnswerGiven(answer);
            stored.setCorrect(correct);
            stored.setResponseTimeMs(now - state.questionStartTimeMs);
            answerRepo.save(stored);

            Map<String, Object> feedback = new HashMap<>();
            feedback.put("type", "ANSWER_RESULT");
            feedback.put("correct", correct);
            feedback.put("points", points);
            feedback.put("canonicalAnswer", eval.getCanonicalName());
            messaging.convertAndSend("/topic/room/" + roomCode + "/player/" + playerIdStr, feedback);
        }
    }

    private void advanceQuestion(String roomCode) {
        GameState state = activeGames.get(roomCode);
        if (state == null) return;

        synchronized (state) {
            if (state.advanceFuture != null) {
                state.advanceFuture.cancel(false);
                state.advanceFuture = null;
            }

            String correctAnswer = correctAnswerFor(state);
            List<Map<String, Object>> leaderboard = buildLeaderboard(roomCode);

            Map<String, Object> endMsg = new HashMap<>();
            endMsg.put("type", "QUESTION_ENDED");
            endMsg.put("correctAnswer", correctAnswer);
            endMsg.put("leaderboard", leaderboard);
            messaging.convertAndSend("/topic/room/" + roomCode, endMsg);

            state.answeredPlayers.clear();
            state.currentIndex++;

            if (state.currentIndex >= state.questions.size()) {
                state.advanceFuture = executor.schedule(() -> sendGameEnded(roomCode, state),
                        INTER_QUESTION_DELAY_SECONDS, TimeUnit.SECONDS);
            } else {
                state.advanceFuture = executor.schedule(() -> sendQuestionStarted(roomCode, state),
                        INTER_QUESTION_DELAY_SECONDS, TimeUnit.SECONDS);
            }
        }
    }

    private void sendQuestionStarted(String roomCode, GameState state) {
        synchronized (state) {
            state.questionStartTimeMs = System.currentTimeMillis();
            Country country = state.currentQuestion();

            Map<String, Object> msg = new HashMap<>();
            msg.put("type", "QUESTION_STARTED");
            msg.put("questionIndex", state.currentIndex);
            msg.put("totalQuestions", state.questions.size());
            msg.put("isoA2", country.getIsoA2());
            msg.put("flagUrl", country.getFlagPngUrl());
            msg.put("countryName", country.getNameCommon());
            msg.put("durationSeconds", state.questionDurationSeconds);
            msg.put("serverStartTimeMs", state.questionStartTimeMs);
            messaging.convertAndSend("/topic/room/" + roomCode, msg);

            state.advanceFuture = executor.schedule(() -> advanceQuestion(roomCode),
                    state.questionDurationSeconds, TimeUnit.SECONDS);
        }
    }

    private void sendGameEnded(String roomCode, GameState state) {
        List<Map<String, Object>> leaderboard = buildLeaderboard(roomCode);

        Map<String, Object> msg = new HashMap<>();
        msg.put("type", "GAME_ENDED");
        msg.put("finalLeaderboard", leaderboard);
        messaging.convertAndSend("/topic/room/" + roomCode, msg);

        roomService.updateRoomStatus(roomCode, RoomStatus.ENDED);
        activeGames.remove(roomCode);
        log.info("Game ended: roomCode={}", roomCode);
    }

    private List<Country> loadQuestions(String mode, String region, int difficultyRating, String difficultyMode) {
        List<Country> all = "All".equalsIgnoreCase(region)
                ? countryRepo.findAll()
                : countryRepo.findByRegionIgnoreCase(region);

        return all.stream()
                .filter(c -> c.getIsoA2() != null)
                .filter(c -> !"capitals".equals(mode) || (c.getCapital() != null && !c.getCapital().isBlank()))
                .filter(c -> !"flags".equals(mode) || c.getFlagPngUrl() != null)
                .filter(c -> "exact".equals(difficultyMode)
                        ? c.getDifficulty() == difficultyRating
                        : c.getDifficulty() <= difficultyRating)
                .toList();
    }

    private String correctAnswerFor(GameState state) {
        Country c = state.currentQuestion();
        return "capitals".equals(state.quizMode) ? c.getCapital() : c.getNameCommon();
    }

    private List<Map<String, Object>> buildLeaderboard(String roomCode) {
        List<RoomPlayer> players = roomService.getLeaderboard(roomCode);
        List<Map<String, Object>> board = new ArrayList<>();
        int rank = 1;
        for (RoomPlayer p : players) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("rank", rank++);
            entry.put("playerId", p.getId().toString());
            entry.put("displayName", p.getDisplayName());
            entry.put("score", p.getScore());
            board.add(entry);
        }
        return board;
    }

    private static class GameState {
        final String roomCode;
        final String quizMode;
        final List<Country> questions;
        final int questionDurationSeconds;
        int currentIndex = 0;
        long questionStartTimeMs;
        final Set<UUID> answeredPlayers = new HashSet<>();
        ScheduledFuture<?> advanceFuture;

        GameState(String roomCode, String quizMode, List<Country> questions, int questionDurationSeconds) {
            this.roomCode = roomCode;
            this.quizMode = quizMode;
            this.questions = questions;
            this.questionDurationSeconds = questionDurationSeconds;
        }

        Country currentQuestion() {
            return questions.get(currentIndex);
        }
    }
}
