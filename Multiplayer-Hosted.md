MULTIPLAYER QUIZ GAME ROOM SPEC (SPRING BOOT + REACT + POSTGRESQL)

---

OVERVIEW

Extend the existing GeoQuiz app to support real-time multiplayer game rooms (Kahoot-style).

Key capabilities:
- Private rooms using 6-character join codes
- Host-controlled game flow (start game)
- Real-time player updates (join/leave/score/leaderboard)
- Server-authoritative timing and scoring
- Free-text typed answers (same UX as solo modes — NOT multiple choice)
- Quiz modes: Flags, Capitals, Map only
- Answer fuzzy matching via existing QuizAnswerService
- Configurable per-room: difficulty, question count, time per question

---

TECH STACK

Backend:
- Java 21, Spring Boot 3.2.5
- spring-boot-starter-websocket (STOMP over SockJS)
- Spring Data JPA, PostgreSQL
- Game state: in-memory ConcurrentHashMap + ScheduledExecutorService (no Redis needed for MVP)

Frontend:
- React 18, Vite 5, Tailwind CSS
- @stomp/stompjs ^7.3.0
- sockjs-client ^1.6.1

CRITICAL — vite.config.js MUST include:
  define: { global: 'globalThis' }
Without this, sockjs-client throws "ReferenceError: global is not defined" at module load,
leaving the React root div empty with no visible error in the UI.

---

DATABASE MODEL

ROOM TABLE (rooms):
- id UUID PK
- room_code VARCHAR(6) UNIQUE NOT NULL
- host_player_id UUID
- status VARCHAR (LOBBY | IN_PROGRESS | ENDED)
- current_question_index INT DEFAULT 0
- quiz_mode VARCHAR NOT NULL
- region VARCHAR DEFAULT 'All'
- difficulty_rating INT DEFAULT 5        ← host-configurable (1–5)
- difficulty_mode VARCHAR(20) DEFAULT 'inclusive'  ← 'inclusive' or 'exact'
- max_questions INT DEFAULT 15           ← host-configurable
- question_duration_seconds INT DEFAULT 20  ← host-configurable
- created_at TIMESTAMP

ROOM_PLAYERS TABLE (room_players):
- id UUID PK
- room_id UUID FK → rooms
- display_name VARCHAR
- score INT DEFAULT 0
- joined_at TIMESTAMP
- is_active BOOLEAN DEFAULT true
- host_token UUID  ← only set for the host; used to authenticate host-only actions

MULTIPLAYER_ANSWERS TABLE (multiplayer_answers):
- id UUID PK
- player_id UUID
- question_index INT
- answer_given VARCHAR
- is_correct BOOLEAN
- response_time_ms BIGINT
- submitted_at TIMESTAMP

JPA uses ddl-auto: update — columns are added automatically on restart.

---

ROOM CODE GENERATION

- 6 characters from: ABCDEFGHJKLMNPQRSTUVWXYZ23456789
- Excludes O, 0, I, 1 (ambiguous characters)
- Uniqueness checked via database before returning

---

WEBSOCKET CONFIGURATION

WebSocketConfig.java:
- Endpoint: /ws with SockJS fallback
- Application destination prefix: /app
- Broker prefix: /topic
- setAllowedOriginPatterns("*") on the endpoint

application.yml:
- frontend.origin: ${FRONTEND_ORIGIN:}

WebConfig.java reads @Value("${frontend.origin:}") and adds it to CORS allowed origins
alongside http://localhost:5173, so both local dev and Vercel deployment work.

---

REST ENDPOINTS

POST /api/rooms
  Body: { quizMode, region, hostDisplayName, difficultyRating, difficultyMode, maxQuestions, questionDurationSeconds }
  Response: { roomCode, playerId, hostToken }
  Creates room + host player row. Returns hostToken (UUID) — stored in sessionStorage by frontend.

POST /api/rooms/{code}/join
  Body: { displayName }
  Response: { playerId }
  Validates room is in LOBBY status. Returns playerId.

GET /api/rooms/{code}
  Response: { roomCode, status, quizMode, region, difficultyRating, difficultyMode,
              maxQuestions, questionDurationSeconds, players: [{id, displayName, score}] }

---

WEBSOCKET MESSAGE MAPPING (server receives on /app/...)

/app/room/join   → JoinRoomMsg { roomCode, playerId, displayName }
/app/room/leave  → Map { roomCode, playerId }
/app/game/start  → StartGameMsg { roomCode, hostToken }
/app/game/answer → SubmitAnswerMsg { roomCode, playerId, questionIndex, answer }

---

PLAYER JOIN FLOW (two-step — critical)

Step 1: POST /api/rooms/{code}/join → get playerId (REST, before WebSocket)
Step 2: After WebSocket connects, publish /app/room/join with playerId

This solves the chicken-and-egg problem: playerId is needed to subscribe to the private
player topic before any messages arrive. Never try to get playerId from the WebSocket itself.

---

HOST AUTHENTICATION

- hostToken (UUID) is returned by POST /api/rooms and stored in sessionStorage under key: room_{roomCode}
- sessionStorage key format: JSON { playerId, hostToken, displayName, isHost }
- Host reads hostToken directly from sessionStorage when calling startGame — do NOT rely on
  async React context state being populated yet (it may not be by the time the button is clicked)
- Backend validateHost() looks up RoomPlayer by roomId + hostToken UUID

---

WEBSOCKET TOPICS (server broadcasts to)

Public room topic (all players):
  /topic/room/{roomCode}
  Events: PLAYER_JOINED, PLAYER_LEFT, GAME_STARTED, QUESTION_STARTED, QUESTION_ENDED, GAME_ENDED

Private player topic (answer feedback only):
  /topic/room/{roomCode}/player/{playerId}
  Events: ANSWER_RESULT

---

EVENT PAYLOADS

PLAYER_JOINED / PLAYER_LEFT → /topic/room/{roomCode}
{
  type: "PLAYER_JOINED",
  playerId: "...",
  displayName: "...",
  playerCount: 3,
  players: [{ id, displayName, score }]
}

GAME_STARTED → /topic/room/{roomCode}
{
  type: "GAME_STARTED",
  totalQuestions: 10,
  quizMode: "flags"
}

QUESTION_STARTED → /topic/room/{roomCode}
{
  type: "QUESTION_STARTED",
  questionIndex: 0,
  totalQuestions: 10,
  isoA2: "FR",
  flagUrl: "https://flagcdn.com/fr.png",
  countryName: "France",
  durationSeconds: 15,         ← from room.questionDurationSeconds, NOT hardcoded
  serverStartTimeMs: 1700000000000
}

Notes on QUESTION_STARTED:
- isoA2 is used by the frontend to render the map highlight (flags mode shows flagUrl,
  capitals mode shows countryName, map mode renders D3 highlight by isoA2)
- durationSeconds comes from the room record, not a constant
- serverStartTimeMs is System.currentTimeMillis() at the moment the server sends the question
- Do NOT reveal the correct answer in this payload

ANSWER_RESULT → /topic/room/{roomCode}/player/{playerId}
{
  type: "ANSWER_RESULT",
  correct: true,
  points: 1342,
  canonicalAnswer: "France"
}

QUESTION_ENDED → /topic/room/{roomCode}
{
  type: "QUESTION_ENDED",
  correctAnswer: "France",
  leaderboard: [{ rank, playerId, displayName, score }]
}

GAME_ENDED → /topic/room/{roomCode}
{
  type: "GAME_ENDED",
  finalLeaderboard: [{ rank, playerId, displayName, score }]
}

---

GAME SERVICE (AUTHORITATIVE ENGINE)

State: ConcurrentHashMap<String, GameState> activeGames
Timer: ScheduledExecutorService (newScheduledThreadPool(4))

GameState fields:
- roomCode, quizMode
- List<Country> questions
- int questionDurationSeconds  ← from room record, stored per game
- int currentIndex
- long questionStartTimeMs
- Set<UUID> answeredPlayers
- ScheduledFuture<?> advanceFuture

startGame():
1. validateHost(roomCode, hostToken)
2. Check room.status == LOBBY (reject if already started)
3. loadQuestions(mode, region, difficultyRating, difficultyMode)
4. CRITICAL: wrap result in new ArrayList<>() before calling Collections.shuffle()
   The JPA/Stream .toList() returns an IMMUTABLE list. shuffle() throws
   UnsupportedOperationException on it. Always do:
     List<Country> pool = new ArrayList<>(loadQuestions(...));
     Collections.shuffle(pool);
5. Trim to room.maxQuestions
6. Build GameState with room.questionDurationSeconds
7. Broadcast GAME_STARTED
8. Call sendQuestionStarted()

sendQuestionStarted():
- Record questionStartTimeMs = System.currentTimeMillis()
- Broadcast QUESTION_STARTED (include durationSeconds from state, not constant)
- Schedule advanceQuestion() after state.questionDurationSeconds seconds

handleAnswer():
- Deadline: state.questionStartTimeMs + state.questionDurationSeconds * 1000
- Reject if past deadline, duplicate playerId, or duplicate in DB
- Evaluate using QuizAnswerService.evaluate() — CLOSE result treated as CORRECT
- Score: 1000 + (remainingMs / totalMs * 500) as int
- Persist MultiplayerAnswer, update RoomPlayer.score
- Broadcast ANSWER_RESULT to private player topic only

advanceQuestion():
- Cancel existing advanceFuture if present
- Broadcast QUESTION_ENDED with correct answer + current leaderboard
- Increment currentIndex
- If more questions: schedule sendQuestionStarted() after INTER_QUESTION_DELAY (5s)
- If done: schedule sendGameEnded() after INTER_QUESTION_DELAY

loadQuestions() filter chain:
- isoA2 != null
- capitals mode: capital != null && !blank
- flags mode: flagPngUrl != null
- difficulty: exact → c.difficulty == rating; inclusive → c.difficulty <= rating
- Returns .toList() (immutable) — caller MUST wrap in new ArrayList<>()

---

ANSWER EVALUATION

Reuse existing QuizAnswerService.evaluate(AnswerRequest).
CRITICAL: Add @Transactional(readOnly = true) to QuizAnswerService.evaluate().
Without it, lazy-loaded Country.aliases collection throws LazyInitializationException
on WebSocket threads (which have no open-in-view session).

AnswerRequest:
- countryIso = country.getIsoA2()
- answer = player's typed text
- mode = "capitals" for capitals mode, null for flags/map (checks country name)

---

DIFFICULTY FILTERING

Country entity has int difficulty (1=Very Easy … 5=Very Hard).
Room stores: difficultyRating (int, 1–5), difficultyMode ("inclusive" | "exact").
GameService.loadQuestions() applies the filter — not the client.
Clamp on write: difficultyRating = max(1, min(5, value)), questionDurationSeconds = max(5, min(60, value)).

---

FRONTEND ROUTING

Use a layout route wrapper (MultiplayerLayout) that renders a single RoomProvider
with <Outlet /> inside. This is critical — without it, navigating from /room/:code
to /game/:code unmounts and remounts RoomProvider, disconnecting the WebSocket.

App.jsx route structure:
  <Route element={<MultiplayerLayout />}>
    <Route path="/room/:code" element={<Lobby />} />
    <Route path="/game/:code" element={<MultiplayerGame />} />
  </Route>

MultiplayerLayout.jsx:
  export default function MultiplayerLayout() {
    return <RoomProvider><Outlet /></RoomProvider>
  }

Do NOT put RoomProvider directly on each route — the provider will remount on navigation
and the WebSocket subscription will be lost.

---

FRONTEND CREDENTIAL STORAGE

sessionStorage key: room_{roomCode}
Value (JSON): { playerId, hostToken, displayName, isHost }

Use sessionStorage (not localStorage) so each browser tab is independent.
hostToken is only present for the host; guests have hostToken: null or absent.

When the host clicks Start Game, read hostToken from sessionStorage directly:
  const stored = JSON.parse(sessionStorage.getItem(`room_${code}`))
  const ht = stored?.hostToken
Do NOT read it from React context state — context may not have been populated yet
due to async initRoom() timing.

---

ROOM CONTEXT (RoomContext.jsx)

Phase machine: LOBBY → QUESTION → SUBMITTED → RESULTS → ENDED

State includes:
- roomCode, quizMode, region
- difficultyRating, difficultyMode, maxQuestions, questionDurationSeconds
- players [], playerId, displayName, isHost, hostToken
- phase, question, answerResult, leaderboard, finalLeaderboard, correctAnswer

initRoom() sets all fields from roomData (GET /api/rooms/{code}) + sessionStorage credentials,
then calls setupSubscriptions(roomCode, playerId) which subscribes to:
- /topic/room/{roomCode}          (all events)
- /topic/room/{roomCode}/player/{playerId}  (ANSWER_RESULT)

Announce join only after connected=true AND playerId is set (use useEffect on both).

---

useStompClient HOOK

- Connects to ${VITE_WS_URL}/ws via SockJS
- Maintains a pending subscriptions queue for subscribe() calls made before connection
- Returns { connected, subscribe, publish }
- subscribe() returns an unsubscribe function; call it in useEffect cleanup

---

CREATE ROOM PAGE

Controls the host configures:
1. Quiz mode (flags / capitals / map)
2. Region (All / Africa / Americas / Asia / Europe / Oceania)
3. Difficulty slider (1–5) + mode toggle ("Up to X" inclusive | "Only X" exact)
   — seed initial values from getDifficultySettings() in localStorage
4. Question count (5 / 10 / 15 / 20)
5. Time per question (5s / 10s / 15s / 20s)

All five values are sent in the POST /api/rooms body and stored in the rooms table.

---

LOBBY PAGE

Displays in the header:
- Room code (with copy button)
- Quiz mode badge
- Region
- Difficulty + question count + time: e.g. "Easy & below · 10Q · 15s"

Player list is updated via PLAYER_JOINED / PLAYER_LEFT WebSocket events.
Host sees "Start Game" button; guests see "Waiting for host…"

Start button is disabled until: connected=true AND players.length >= 1

On phase === 'QUESTION': navigate to /game/{code} (replace: true, so back button doesn't return)

---

VERCEL DEPLOYMENT

frontend/vercel.json:
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }

frontend/.env (Vercel dashboard):
  VITE_API_URL = https://your-backend.railway.app
  VITE_WS_URL  = https://your-backend.railway.app

backend env (Railway):
  POSTGRES_URL      = railway postgres URL
  POSTGRES_USER     = db user
  POSTGRES_PASSWORD = db password
  FRONTEND_ORIGIN   = https://your-app.vercel.app

api/client.js:
  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
  export const BASE_WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080'

---

KNOWN PITFALLS (do not repeat these)

1. Collections.shuffle() on immutable list
   .toList() in Java streams returns an unmodifiable list. Calling Collections.shuffle()
   on it throws UnsupportedOperationException. Always wrap before shuffle:
     List<Country> pool = new ArrayList<>(loadQuestions(...));

2. global is not defined (sockjs-client in Vite)
   Add to vite.config.js: define: { global: 'globalThis' }
   Without this the app renders a blank page with no React error boundary message.

3. LazyInitializationException on WebSocket threads
   Spring's open-in-view only applies to HTTP threads. WebSocket handler threads have
   no JPA session, so lazy collections throw. Fix: @Transactional(readOnly = true)
   on QuizAnswerService.evaluate().

4. RoomProvider remounting on navigation
   Placing <RoomProvider> on each route individually causes it to unmount/remount when
   navigating between /room/:code and /game/:code, dropping the WebSocket. Use the
   MultiplayerLayout wrapper route pattern instead.

5. hostToken from async context state
   React context state set in useEffect may not be populated when a button click handler
   runs. Read hostToken directly from sessionStorage in the click handler, not from
   useRoom() state.

6. stompjs not found after npm install (Docker anonymous volume)
   If packages are added to package.json but the node_modules volume is stale (from an
   older image), the new packages won't be found. Fix by running npm install inside the
   running container, or by rebuilding the full image with --no-cache.

7. Backend network loss after --no-deps recreate
   Running `docker compose up -d --no-deps --force-recreate backend` can leave the backend
   container without a network route to postgres if the network was recreated. Fix:
   `docker compose restart backend` or `docker compose up -d` (without --no-deps).

---

ANSWER MODES BY QUIZ TYPE

flags:    Show flagUrl image → player types country name
capitals: Show countryName + flag → player types capital city
          (AnswerRequest.mode = "capitals"; evaluates against country.capital)
map:      Highlight country on D3 map by isoA2 → player types country name

Free text in all cases. No multiple choice. Fuzzy matching (Jaro-Winkler >= 0.80)
treats CLOSE the same as CORRECT for scoring purposes.

---

MVP SCOPE

- Room creation with configurable difficulty, question count, time limit
- Join via 6-char code
- Lobby with live player list
- Host-only start game
- Server-timed questions (server clock, not client)
- Free-text answer submission with duplicate + deadline enforcement
- Per-player answer feedback (private topic)
- Post-question leaderboard
- Game end with final leaderboard
- Vercel (frontend) + Railway (backend) deployment ready
