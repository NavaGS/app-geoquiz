# GeoQuiz

A rapid-fire geography trivia web app with 8 solo quiz modes and real-time multiplayer rooms. Built with React + Spring Boot + PostgreSQL, fully containerised with Docker Compose.

## Quiz Modes

| # | Mode | Question | Answer |
|---|---|---|---|
| 1 | Flags | Show a country's flag | Type the country name |
| 2 | Map | Highlight a country on the world map | Type the country name |
| 3 | Capitals | Show a country name + flag | Type the capital city |
| 4 | Cities | Show a major city name | Type the country it belongs to |
| 5 | Shapes | Show a country silhouette | Type the country name |
| 6 | Currency | Show a currency name + symbol | Type the country that uses it |
| 7 | Language | Show a country name + flag | Type an official language |
| 8 | Borders | Show a country name + flag | Type any bordering country |

## Multiplayer

Private game rooms à la Kahoot. Up to any number of players join via a 6-character code. The host picks a quiz mode (Flags, Capitals, or Map) and a region, then starts the game. All players receive the same timed questions simultaneously — the server is authoritative on timing and scoring.

Scoring: **1000 + up to 500 time bonus** per correct answer (faster = more points).

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)

That's it. No Java, Node, or database installation required.

---

## Getting Started

### 1. Clone the repo

```bash
git clone <repo-url>
cd geoquiz
```

### 2. Create your `.env` file

```bash
cp .env.example .env
```

The defaults work out of the box — no API keys or external accounts needed.

### 3. Start the app

```bash
docker compose up --build
```

Open [http://localhost:5173](http://localhost:5173).

On first startup the backend seeds all country data automatically (flags, boundaries, cities, currencies, languages, borders). This takes **30–90 seconds** depending on your connection. The frontend will show a "Retry" prompt until seeding completes — just refresh.

---

## Testing Multiplayer Locally

Open **two browser windows** (or one normal + one incognito) both pointed at [http://localhost:5173](http://localhost:5173).

**Window 1 — Host:**
1. Click **Play with Friends** → **Create a Room**
2. Pick a quiz mode and region, enter your display name → **Create Room**
3. Copy the 6-character code shown in the lobby

**Window 2 — Player:**
1. Click **Play with Friends** → **Join a Room**
2. Paste the code, enter a display name → **Join Room**
3. You appear in Window 1's lobby instantly

**Back in Window 1:** Click **Start Game** — both windows enter the game simultaneously with a shared question and countdown timer.

---

## Development

### Option A — Full Docker stack (simplest)

```bash
docker compose up --build
```

Frontend hot-reload is active — changes to `frontend/src/` appear in the browser instantly. Backend changes require a container rebuild:

```bash
docker compose build backend && docker compose up -d --no-deps --force-recreate backend
```

### Option B — Split terminals (faster backend iteration)

**Terminal 1 — Postgres only:**
```bash
docker compose up postgres
```

**Terminal 2 — Backend** (requires Java 21 + Maven):
```bash
cd backend
POSTGRES_URL=jdbc:postgresql://localhost:5432/geoquiz \
POSTGRES_USER=geoquiz \
POSTGRES_PASSWORD=geoquiz \
mvn spring-boot:run
```

**Terminal 3 — Frontend:**
```bash
cd frontend
npm run dev
```

---

## Re-seeding the Database

If you need a clean slate (e.g. after a schema change):

```bash
docker compose exec postgres psql -U geoquiz -d geoquiz -c "TRUNCATE countries CASCADE;"
docker compose restart backend
```

The backend detects empty tables on startup and re-seeds everything.

---

## Deployment (Vercel + Railway)

The frontend is a static Vite build suited for Vercel. The backend (Spring Boot + WebSocket) needs a long-running host such as Railway, Render, or Fly.io.

**Backend (Railway)** — set these environment variables:

| Variable | Value |
|---|---|
| `POSTGRES_URL` | Railway PostgreSQL URL |
| `POSTGRES_USER` | db user |
| `POSTGRES_PASSWORD` | db password |
| `FRONTEND_ORIGIN` | `https://your-app.vercel.app` |

**Frontend (Vercel)** — set these environment variables:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://your-backend.railway.app` |
| `VITE_WS_URL` | `https://your-backend.railway.app` |

The `vercel.json` at the repo root handles SPA client-side routing automatically.

---

## Project Structure

```
geoquiz/
├── frontend/               React 18 + Vite + Tailwind + D3
│   ├── vercel.json         SPA rewrite rules for Vercel
│   ├── Dockerfile          Production build (serves static dist)
│   ├── Dockerfile.dev      Dev build (Vite dev server, used by docker-compose)
│   └── src/
│       ├── pages/          Quiz modes + multiplayer pages (Lobby, MultiplayerGame, ...)
│       ├── components/     FlipQuiz, FlipCard, SessionTimer, QuestionTimer, ...
│       ├── contexts/       ThemeContext, RoomContext (multiplayer state)
│       ├── hooks/          useQuizSession, useCountdownTimer, useStompClient
│       └── utils/          difficultySettings.js, gameplaySettings.js
├── backend/                Java 21 + Spring Boot 3.2
│   └── src/main/java/com/geoquiz/
│       ├── controller/     REST endpoints + WebSocket STOMP handlers
│       ├── service/        DataRefreshService, QuizAnswerService, RoomService, GameService
│       ├── entity/         JPA entities (Country, Room, RoomPlayer, ...)
│       └── repository/     Spring Data repos
├── docker-compose.yml
├── .env.example
└── SPEC.md                 Full technical + functional specification
```

---

## Admin Centre

Navigate to [http://localhost:5173/admin](http://localhost:5173/admin) to:

- **Countries Data** — searchable, sortable table of all 250 countries with data coverage status
- **Monitoring** — live quiz event stream and aggregate stats
- **Settings** — configure difficulty filter (1–5, inclusive or exact) and game mode (none / countdown timer / max questions with optional per-question timer)

---

## Data Sources

All public, no API keys required:

| Data | Source |
|---|---|
| Country metadata, currencies, languages, borders | [mledoze/countries](https://github.com/mledoze/countries) |
| Flag images | [flagcdn.com](https://flagcdn.com) |
| Country boundaries (GeoJSON) | [datasets/geo-countries](https://github.com/datasets/geo-countries) |
| City populations | [GeoNames cities5000](https://download.geonames.org/export/dump/) public dump |

---

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, D3.js v7, Recharts |
| Backend | Java 21, Spring Boot 3.2, Spring Data JPA, Spring WebSocket (STOMP) |
| Database | PostgreSQL 16 |
| Containers | Docker Compose |
| Fuzzy matching | Apache Commons Text (JaroWinkler) |
| Real-time | STOMP over SockJS, `@stomp/stompjs` |
