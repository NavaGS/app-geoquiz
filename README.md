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

Edit `.env` if needed — the defaults work out of the box for local development:

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_USER` | `geoquiz` | Database user |
| `POSTGRES_PASSWORD` | `geoquiz` | Database password |
| `GEONAMES_USERNAME` | `demo` | GeoNames account (demo is rate-limited; register free at geonames.org for a personal one) |
| `DATA_REFRESH_ENABLED` | `true` | Nightly country data refresh |
| `FRONTEND_ORIGIN` | _(blank)_ | Allowed CORS origin in production |
| `ADMIN_TOKEN` | `dev` | Token for the admin monitoring dashboard — **change this before going public** |

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
docker compose build backend && docker compose up -d backend
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
ADMIN_TOKEN=dev \
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

**Backend (Railway / Render / Fly.io)** — set these environment variables:

| Variable | Value |
|---|---|
| `POSTGRES_URL` | Provider PostgreSQL URL |
| `POSTGRES_USER` | DB user |
| `POSTGRES_PASSWORD` | DB password |
| `FRONTEND_ORIGIN` | `https://your-app.vercel.app` (no trailing slash) |
| `ADMIN_TOKEN` | A strong random secret (e.g. `openssl rand -hex 32`) |
| `GEONAMES_USERNAME` | Your free GeoNames username |

**Frontend (Vercel)** — set these environment variables:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://your-backend.railway.app` |
| `VITE_WS_URL` | `https://your-backend.railway.app` |
| `VITE_ADMIN_TOKEN` | Same value as `ADMIN_TOKEN` on the backend |

The `vercel.json` at the repo root handles SPA client-side routing automatically.

> **Social sharing:** `public/og-image.svg` is the link preview card shown on Reddit, Discord, and iMessage. Twitter/X requires a raster image — open the SVG in a browser, screenshot it at 1200×630, save as `public/og-image.png`, and update the three `og:image` / `twitter:image` tags in `index.html` to point to `/og-image.png`.

---

## Project Structure

```
geoquiz/
├── frontend/               React 18 + Vite + Tailwind + D3
│   ├── public/             Static assets (favicon, OG social card)
│   ├── vercel.json         SPA rewrite rules for Vercel
│   ├── Dockerfile          Production build (serves static dist)
│   ├── Dockerfile.dev      Dev build (Vite dev server, used by docker-compose)
│   └── src/
│       ├── pages/          Quiz modes, SessionEnd, GameAnalytics, Monitoring, ...
│       ├── components/     FlipQuiz, FlipCard, SessionTimer, QuestionTimer, ...
│       ├── contexts/       ThemeContext, RoomContext (multiplayer state)
│       ├── hooks/          useQuizCore, useQuizSession, useCountdownTimer, useStompClient
│       └── utils/          anonymousUser.js, difficultySettings.js, gameplaySettings.js
├── backend/                Java 21 + Spring Boot 3.2
│   └── src/main/java/com/geoquiz/
│       ├── config/         WebConfig (CORS), WebSocketConfig, AdminTokenFilter
│       ├── controller/     REST endpoints + WebSocket STOMP handlers
│       ├── service/        DataRefreshService, QuizAnswerService, RoomService, MonitoringService
│       ├── entity/         JPA entities (Country, Room, RoomPlayer, QuizEvent, ...)
│       └── repository/     Spring Data repos
├── docker-compose.yml
├── .env                    Local secrets (not committed)
├── .env.example            Template — copy to .env to get started
└── SPEC.md                 Full technical + functional specification
```

---

## Pages

| Path | Access | Description |
|---|---|---|
| `/` | Public | Home — pick a quiz mode |
| `/quiz/*` | Public | Solo quiz pages (flags, map, capitals, cities, shapes, currency, language, borders) |
| `/session-end` | Public | Score summary after a completed session |
| `/game-analytics` | Public | Global leaderboard (Countdown mode) and community stats |
| `/multiplayer` | Public | Create or join a multiplayer room |
| `/admin` | Public | Countries data browser |
| `/monitoring` | Token-gated | Live event stream, session funnel, skip rates, user tracking |

### Monitoring dashboard

Navigate to [http://localhost:5173/monitoring](http://localhost:5173/monitoring). You will be prompted for the admin token. Enter whatever `ADMIN_TOKEN` / `VITE_ADMIN_TOKEN` is set to (default: `dev` locally).

The token is stored in `localStorage` under `gq_admin_token` — you only need to enter it once per browser. The check is enforced at the HTTP level on the backend, so the stats API is not accessible without the token regardless of the frontend.

### Game Analytics (public leaderboard)

[http://localhost:5173/game-analytics](http://localhost:5173/game-analytics) — no token required. Shows top Countdown scores per quiz mode (Flags, Map, Shapes, Capitals) and community accuracy stats. Scores appear here after completing a Countdown session.

---

## Anonymous User Tracking

Players are tracked without sign-up via a persistent UUID stored in `localStorage` under `gq_uid`. This survives page refreshes and new sessions on the same browser but is scoped to one device. All quiz events (session start, answers, skips, completions) are tagged with this ID and visible in the Monitoring dashboard.

---

## Data Sources

All public, no API keys required for basic operation:

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
