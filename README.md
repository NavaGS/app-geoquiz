# GeoQuiz

A rapid-fire geography trivia web app with 8 quiz modes. Built with React + Spring Boot + PostgreSQL, fully containerised with Docker Compose.

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

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)

That's it. No Java, Node, or database installation required.

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

## Development

The frontend runs as a **Vite dev server with hot reload** — any change to `frontend/src/` is reflected in the browser instantly without rebuilding.

The backend requires a rebuild and container restart after code changes:

```bash
docker compose build backend && docker compose up -d --no-deps --force-recreate backend
```

## Re-seeding the Database

If you need a clean slate (e.g. after a schema change):

```bash
docker compose exec postgres psql -U geoquiz -d geoquiz -c "TRUNCATE countries CASCADE;"
docker compose restart backend
```

The backend detects empty tables on startup and re-seeds everything.

## Project Structure

```
geoquiz/
├── frontend/               React 18 + Vite + Tailwind + D3
│   ├── Dockerfile          Production build (serves static dist)
│   ├── Dockerfile.dev      Dev build (Vite dev server, used by docker-compose)
│   └── src/
│       ├── pages/          One file per quiz mode + Admin Centre
│       ├── components/     FlipQuiz, FlipCard, SessionTimer, QuestionTimer, ...
│       ├── hooks/          useQuizSession, useCountdownTimer
│       └── utils/          difficultySettings.js, gameplaySettings.js
├── backend/                Java 21 + Spring Boot 3.2
│   └── src/main/java/com/geoquiz/
│       ├── controller/     REST endpoints
│       ├── service/        DataRefreshService, QuizAnswerService
│       ├── entity/         JPA entities
│       └── repository/     Spring Data repos
├── docker-compose.yml
├── .env.example
└── SPEC.md                 Full technical + functional specification
```

## Admin Centre

Navigate to [http://localhost:5173/admin](http://localhost:5173/admin) to:

- **Countries Data** — searchable, sortable table of all 250 countries with data coverage status (flags, boundaries, cities, currencies, languages, borders)
- **Monitoring** — live quiz event stream and aggregate stats
- **Settings** — configure difficulty filter (1–5, inclusive or exact) and game play mode (none / countdown timer / max questions with optional per-question timer)

## Data Sources

All public, no API keys required:

| Data | Source |
|---|---|
| Country metadata, currencies, languages, borders | [mledoze/countries](https://github.com/mledoze/countries) |
| Flag images | [flagcdn.com](https://flagcdn.com) |
| Country boundaries (GeoJSON) | [datasets/geo-countries](https://github.com/datasets/geo-countries) |
| City populations | [GeoNames cities5000](https://download.geonames.org/export/dump/) public dump |

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, D3.js v7, Recharts |
| Backend | Java 21, Spring Boot 3.2, Spring Data JPA |
| Database | PostgreSQL 16 |
| Containers | Docker Compose |
| Fuzzy matching | Apache Commons Text (JaroWinkler) |
