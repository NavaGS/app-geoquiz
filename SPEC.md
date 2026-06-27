# GeoQuiz — Implementation Spec
**Version:** 1.5.0 (built from spec v1.0.0)
**Date:** June 2026
**Status:** Active — reflects actual implemented decisions + post-refactor architecture

> This document supersedes the original `GeoQuiz_App_Spec_v1.0.0.md`.
> It preserves all original intent but replaces deferred decisions with what was actually built,
> documents API deprecations discovered during implementation, and flags known issues.

---

## 1. Overview

GeoQuiz is a minimalistic, rapid-fire geography trivia web app teaching country recognition via 8 quiz modes. No login required. Localhost to start.

---

## 2. Goals & Non-Goals

Unchanged from v1.0.0.

---

## 3. Quiz Modes

All 8 modes implemented. See Section 13 (UX) for keyboard shortcuts.

| Mode | Route | Component | Question | Answer |
|---|---|---|---|---|
| 1 — Flags | `/quiz/flags` | FlipQuiz | Show flag image | Type country name |
| 2 — Map | `/quiz/map` | MapQuiz (standalone) | Highlight country on world map | Type country name |
| 3 — Capitals | `/quiz/capitals` | FlipQuiz | Show country name + flag | Type capital city |
| 4 — Cities | `/quiz/cities` | CitiesQuiz (standalone) | Show a city name | Type the country it belongs to |
| 5 — Shapes | `/quiz/shapes` | ShapesQuiz (standalone) | Show country silhouette | Type country name |
| 6 — Currency | `/quiz/currency` | CurrencyQuiz (FlipQuiz) | Show currency symbol/name/code | Type country name |
| 7 — Language | `/quiz/language` | LanguageQuiz (standalone) | Show country name + flag | Type an official language |
| 8 — Borders | `/quiz/borders` | BordersQuiz (standalone) | Show country name + flag | Type any bordering country |

**Notes:**
- Mode 4 (Cities) is reversed from the original spec — shows a city, asks for the country. Queue is a flat list of individual cities (up to 3 per country), shuffled independently.
- Mode 6 (Currency) uses the existing `FlipQuiz` wrapper; answer is checked via the standard `/api/quiz/answer` (country name fuzzy match).
- Mode 7 (Language) is standalone because it uses a custom `/api/quiz/language-answer` endpoint. Accepts any official language for the country as correct.
- Mode 8 (Borders) is standalone using `/api/quiz/border-answer`. Accepts any valid bordering country as correct. No CLOSE state — result is CORRECT or WRONG only.

**Flip-card modes (1, 3, 6):** Shared via `FlipQuiz` component at `frontend/src/components/FlipQuiz.jsx`. Modes 2, 4, 5, 7, 8 are standalone pages.

**Key implementation notes:**
- Region filter passed as React Router `location.state.region` from Home → quiz page
- If no state is passed (e.g. direct URL navigation), region defaults to `"All"`
- Empty country list (DB not yet seeded) shows a "Retry" screen rather than a blank page
- All quiz modes apply the difficulty filter and gameplay mode settings on load (see Sections 19, 20)

---

## 4. Home Screen & Navigation

Routes:
```
/                  → Home
/quiz/flags        → Mode 1 — Flags
/quiz/map          → Mode 2 — Map
/quiz/capitals     → Mode 3 — Capitals
/quiz/cities       → Mode 4 — Cities
/quiz/shapes       → Mode 5 — Shapes
/quiz/currency     → Mode 6 — Currency
/quiz/language     → Mode 7 — Language
/quiz/borders      → Mode 8 — Borders
/monitoring        → Live monitoring dashboard (no link from Home — navigate directly or via Admin Centre)
/admin             → Admin Centre (Countries Data, Monitoring, Settings tabs)
/session-end       → End-of-session results screen
```

Personal best stored in localStorage as `pb_{mode}_{region}`.

> **Note:** The "Monitoring Dashboard" link was removed from the Home page. The `/monitoring` route still exists and is accessible via the Admin Centre Monitoring tab or direct URL.

#### localStorage Keys

| Key | Type | Default | Description |
|---|---|---|---|
| `pb_{mode}_{region}` | integer | 0 | Personal best score per mode + region |
| `gq_difficulty_rating` | integer 1–5 | 5 | Difficulty filter level (see Section 19) |
| `gq_difficulty_mode` | `"inclusive"` \| `"exact"` | `"inclusive"` | Difficulty filter mode (see Section 19) |
| `gq_gp_mode` | `"none"` \| `"countdown"` \| `"maxquestions"` | `"none"` | Game Play Mode (see Section 20) |
| `gq_gp_countdown_secs` | integer | 60 | Total session seconds for Countdown mode |
| `gq_gp_max_questions` | integer | 20 | Max questions per session for Max Questions mode |
| `gq_gp_per_q_timer` | `"true"` \| `"false"` | `"false"` | Enable per-question timer in Max Questions mode |
| `gq_gp_per_q_secs` | integer | 15 | Seconds per question when per-question timer is on |

---

## 5. Scoring & Persistence

Unchanged from v1.0.0. localStorage key format: `pb_{mode}_{region}`.

---

## 6. Answer Matching — Fuzzy Logic

Library: Apache Commons Text `JaroWinklerSimilarity` — implemented in `QuizAnswerService`.

Thresholds unchanged:
- ≥ 0.92 → Correct
- 0.80–0.91 → Close (hint)
- < 0.80 → Wrong

Alias sources (seeded from mledoze/countries):
- `translation-{lang}` — translated country names in 30+ languages
- `altSpelling` — from `altSpellings` field (e.g. "Ivory Coast", "Burma")

---

## 7. Technical Architecture

### 7.1 Frontend

| Concern | Choice |
|---|---|
| Framework | React 18 |
| Language | JavaScript (ES2022+) |
| Routing | React Router v6 |
| Map rendering | D3.js v7 + GeoJSON |
| Styling | Tailwind CSS |
| Quiz state management | `useQuizCore` custom hook (shared across all quiz pages) |
| App-wide state | React Context + useReducer (`RoomContext`, `ThemeContext`) |
| Build tool | Vite |
| Charts (monitoring) | Recharts |

**Key frontend architectural principle:** quiz pages own only their mode-specific concerns (API call, filter predicate, render layout). All timer management, question advancing, score tracking, and submission guards live in `useQuizCore`. See Section 22 for detailed patterns.

### 7.2 Backend

| Concern | Choice |
|---|---|
| Framework | Java 21 + Spring Boot 3.2 |
| API style | REST (JSON) |
| Fuzzy matching | Apache Commons Text (JaroWinklerSimilarity) |
| Scheduled jobs | Spring `@Scheduled` — nightly refresh at 02:00 |
| Logging | Logback + Logstash encoder (structured JSON) |
| Metrics | Micrometer + Spring Actuator |

### 7.3 Database

PostgreSQL 16. `countries` table has the following columns beyond the v1.0.0 spec:

| Column | Type | Description |
|---|---|---|
| `difficulty` | integer | 1–5 difficulty rating (see Section 19) |
| `flag_emoji` | varchar(10) | Unicode flag emoji e.g. 🇫🇷 |
| `currency_code` | varchar(10) | ISO 4217 code e.g. `EUR` |
| `currency_name` | varchar | e.g. `Euro` |
| `currency_symbol` | varchar(10) | e.g. `€` |
| `languages` | text | JSON array of language names e.g. `["French"]` |
| `borders` | text | JSON array of ISO A3 codes e.g. `["AND","BEL","DEU"]` |

---

## 8. External Data Sources — CRITICAL CHANGES FROM v1.0.0

**The REST Countries API (restcountries.com v3.1) is deprecated as of mid-2026.**
It returns HTTP 301 → 200 with a deprecation JSON body, not country data.
Do NOT use `https://restcountries.com/v3.1/all`.

### 8.1 Country Metadata — mledoze/countries (replaces REST Countries)

- **URL:** `https://raw.githubusercontent.com/mledoze/countries/master/countries.json`
- **Format:** JSON array, same field structure as REST Countries v3.1 (`cca2`, `cca3`, `name.common`, `name.official`, `capital`, `region`, `subregion`, `translations`, `altSpellings`)
- **Licence:** ODbL
- **Flags:** NOT included in mledoze/countries. Use flagcdn.com instead (see 8.2).
- **Refresh:** Nightly cron

### 8.2 Flag Images — flagcdn.com (new, not in v1.0.0 spec)

- **PNG:** `https://flagcdn.com/w320/{iso2_lowercase}.png` (e.g. `https://flagcdn.com/w320/us.png`)
- **SVG:** `https://flagcdn.com/{iso2_lowercase}.svg`
- **Licence:** Public domain
- **No API key required**
- Flag URLs are constructed at seed time from the country's ISO A2 code — no HTTP fetch needed

### 8.3 Country Boundaries — datasets/geo-countries (replaces Natural Earth direct)

- **URL:** `https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson`
- **Features:** 258 country polygons
- **ISO property key:** `ISO3166-1-Alpha-2` (NOT `iso_a2` — different from Natural Earth direct files)
- **Geometry types:** Polygon and MultiPolygon
- **Licence:** Public domain
- **Used for:** Both `/api/map/geojson` (D3 world map) and `/api/countries/{iso}/shape` (shape silhouette)
- `simplified_geojson` and `geojson` columns store the same data currently; simplification not yet applied
- **Refresh:** Nightly cron

### 8.4 Non-Capital Cities — GeoNames Public Dump (replaces GeoNames API)

- **URL:** `https://download.geonames.org/export/dump/cities5000.zip`
- **No API key or account required** (public download, unlike the `searchJSON` API which requires registration and hits rate limits even on the demo account)
- **Format:** ZIP containing a single tab-separated `cities5000.txt`
  - Column 1 (0-indexed): city name
  - Column 6: feature class (`P` = populated place — keep only these)
  - Column 7: feature code (`PPLC` = capital — skip these)
  - Column 8: ISO A2 country code
  - Column 14: population
- **Contains:** ~50k cities with population > 5000
- **Seeding logic:** Download ZIP, stream-parse in-memory, group by country code, sort by population desc, save top 3 non-capital cities per country
- **Countries with < 3 non-capital cities in dataset** (e.g. Vatican, Monaco, Nauru): fewer than 3 cities stored; Mode 4 shows what's available
- **Refresh:** Nightly cron
- **⚠ Do NOT use the GeoNames `searchJSON` API endpoint** — the `demo` username hits the daily limit (20,000 credits/day shared globally) immediately

### 8.5 Startup Seeding Logic

On `ApplicationReadyEvent`, checks each data type independently:
- `countryRepository.count() == 0` → seed countries
- `boundaryRepository.count() == 0` → seed boundaries
- `cityRepository.countNonCapitals() == 0` → seed cities

This means partial seeds (e.g. from a previous failed run) are completed without full re-seed.

### 8.6 Java HttpClient — Redirect Handling

Java's `HttpClient` does **not** follow HTTP redirects by default. The mledoze/countries URL returns a 200 directly, but always configure:
```java
HttpClient.newBuilder()
    .followRedirects(HttpClient.Redirect.NORMAL)
    .build();
```
Without this, the old REST Countries URL returned 301 silently (which caused the original empty DB).

### 8.7 Admin Refresh Endpoint

`POST /admin/refresh-data` triggers `refreshAll()` (countries + boundaries + cities).

**Localhost-only guard** checks `request.getRemoteAddr()` against `127.0.0.1`, `::1`, `0:0:0:0:0:0:0:1`. When running in Docker, calls from the host machine arrive as the Docker bridge IP (e.g. `172.17.0.x`) — **not** localhost — and are rejected with 403. To trigger manually, exec into the backend container:
```bash
docker exec geoquiz-backend-1 wget -qO- --post-data="" http://localhost:8080/admin/refresh-data
```
Or use `docker compose exec backend wget -qO- --post-data="" http://localhost:8080/admin/refresh-data`.

---

## 9. Backend API Endpoints

```
GET  /api/countries?region={region}           → list countries for session (includes all metadata)
GET  /api/countries/{iso}/flag                → flag metadata + URL
GET  /api/countries/{iso}/shape               → GeoJSON geometry for shape silhouette
GET  /api/countries/{iso}/cities              → top 3 non-capital cities
GET  /api/map/geojson?region={region}         → FeatureCollection for D3 world map
POST /api/quiz/answer                         → fuzzy match country name, returns {result, hint, canonicalName, similarityScore}
POST /api/quiz/language-answer                → fuzzy match language, returns {result, canonicalAnswer, allLanguages}
POST /api/quiz/border-answer                  → check if answer is a valid bordering country, returns {result, canonicalAnswer, borderNames}
POST /api/events/quiz                         → log quiz event (fire-and-forget)
GET  /api/monitoring/stats                    → aggregate stats
GET  /api/monitoring/live                     → SSE stream of live quiz events
GET  /admin/countries-data                    → per-country data summary (all fields including new metadata)
POST /admin/refresh-data                      → trigger full data refresh (localhost/container only)
```

**`POST /api/quiz/language-answer` request/response:**
```json
// request
{ "countryIso": "CH", "answer": "German" }
// response
{ "result": "CORRECT", "canonicalAnswer": "German", "allLanguages": ["French","German","Italian","Romansh"] }
```
Uses JaroWinkler fuzzy match (same thresholds as `/api/quiz/answer`). Accepts any official language.

**`POST /api/quiz/border-answer` request/response:**
```json
// request
{ "countryIso": "FR", "answer": "Germany" }
// response — CORRECT
{ "result": "CORRECT", "canonicalAnswer": "Germany", "borderNames": ["Andorra","Belgium","Germany","Italy","Luxembourg","Monaco","Spain","Switzerland"] }
// response — WRONG
{ "result": "WRONG", "canonicalAnswer": null, "borderNames": ["Andorra","Belgium",...] }
```
Resolves ISO A3 border codes → country names + aliases, runs JaroWinkler. No CLOSE state — binary CORRECT/WRONG. `borderNames` always returned so frontend can show the full list on reveal.

**`GET /api/countries` response shape (per country):**
```json
{
  "isoA2": "FR", "isoA3": "FRA",
  "nameCommon": "France", "nameOfficial": "French Republic",
  "region": "Europe", "subregion": "Western Europe",
  "capital": "Paris",
  "flagSvgUrl": "https://flagcdn.com/fr.svg",
  "flagPngUrl": "https://flagcdn.com/w320/fr.png",
  "flagEmoji": "🇫🇷",
  "hasBoundary": true,
  "difficulty": 1,
  "cityCount": 3,
  "cityNames": ["Marseille", "Lyon", "Toulouse"],
  "currencyCode": "EUR",
  "currencyName": "Euro",
  "currencySymbol": "€",
  "languages": ["French"],
  "borders": ["AND","BEL","DEU","ITA","LUX","MCO","ESP","CHE"]
}
```

> `cityNames` is included here (not just `/admin/countries-data`) to support the Cities quiz, which builds a flat city queue from the countries list without N individual city-fetch requests.
> `languages` and `borders` are stored as JSON strings in the DB and deserialised to arrays by the controller before returning.

**CORS policy** (`WebConfig.java`):
- `/api/**` — GET, POST, PUT, DELETE, OPTIONS from `localhost:5173`
- `/admin/**` — **GET and POST** from `localhost:5173`

⚠️ The original CORS config only allowed `POST` on `/admin/**`, which blocked `GET /admin/countries-data` with a "Failed to fetch" error in the browser. Always include `GET` when adding read endpoints under `/admin`.

```
```

**Answer response shape:**
```json
{
  "result": "CORRECT" | "CLOSE" | "WRONG",
  "hint": "Did you mean Germany?",
  "canonicalName": "Germany",
  "similarityScore": 0.87
}
```

---

## 10. Monitoring Page (`/monitoring`)

Panels as specified in v1.0.0. Implementation:
- `/api/monitoring/stats` polled every 30s
- `/api/monitoring/live` consumed via SSE (`EventSource`)
- Charts rendered with Recharts (BarChart)

---

## 11. Logging Strategy

Unchanged from v1.0.0.

---

## 12. Fuzzy Match Flow

Unchanged from v1.0.0.

---

## 13. UX & Design

Accent colours per mode: flags=blue, map=green, capitals=orange, cities=purple, shapes=teal.

Keyboard shortcuts: Enter=submit, Tab=skip, Space=flip card.

### Map Mode (Mode 2) — rendering details

- The world map is a **static `geoNaturalEarth1` projection** fitted to the full container once on load.
- The projection is **never re-fitted or re-centred** when the highlighted country changes — only fill/stroke colours are updated. This avoids the disorienting jump of a re-projecting map.
- The SVG fills 100% of the remaining viewport height (`flex-1`, `h-full`) and responds to window resize via `ResizeObserver` — on resize the projection is rebuilt and the base map redrawn.
- Ocean background: `#dbeafe` (blue-100). Countries: `#e2e8f0` (slate-200). Highlighted: `#bbf7d0` fill + `#16a34a` stroke + glow ring.
- **Small country popout** — if the highlighted country's projected bounding box diagonal is < 40px (covers micro-nations and small islands: Vatican, Monaco, Maldives, Tuvalu, Kiribati, etc.):
  - A pulsing dot is placed at the country's projected centroid on the main map.
  - A dashed leader line connects the dot to a 180×140px inset panel.
  - The inset shows a zoomed `geoAzimuthalEqualArea` silhouette of the country, centred on its centroid (avoids antimeridian distortion).
  - The inset is positioned to avoid the country's location (flips quadrant if country is in bottom-right).
- Countries whose geometry spans the antimeridian (NZ, RU, FJ, US, KI, TV, WS, TO) are handled correctly because the main world projection is fitted to the whole FeatureCollection — the antimeridian-spanning issue only affects per-country `fitSize`, which is not used here.

### Shape Mode (Mode 5) — rendering details

- Projection: `d3.geoAzimuthalEqualArea().rotate([-centroid[0], -centroid[1]]).fitExtent(...)` — centred on the country's geographic centroid before fitting.
- **Do NOT use `geoMercator().fitSize()` for shape silhouettes.** Countries near the antimeridian (e.g. NZ includes Chatham Islands at ~-176°W) produce a bounding box spanning 356° of longitude in Mercator, causing the whole world to be scaled into the viewport with the country invisible. AzimuthalEqualArea with `.rotate()` sidesteps this entirely.
- Random ±15° CSS rotation applied per card via `useRef` (stable per country, regenerated on each new question).
- Drop shadow filter on path for visual depth.

---

## 14. Local Development Setup

### Prerequisites
- Docker Desktop
- GeoNames account not required (using public dump, not API)

### First Run
```bash
git clone <repo>
cd geoquiz
cp .env.example .env
# No API keys needed — all data sources are public
docker compose up --build
```

Open `http://localhost:5173`. First startup seeds all data automatically (~30–60s for countries + boundaries + cities download).

### Environment Variables

```env
POSTGRES_URL=jdbc:postgresql://postgres:5432/geoquiz
POSTGRES_USER=geoquiz
POSTGRES_PASSWORD=geoquiz
DATA_REFRESH_ENABLED=true
# GEONAMES_USERNAME is no longer used — cities come from the public dump, not the API
```

### Repository Structure
```
geoquiz/
  frontend/
    Dockerfile          Production build (serve static dist)
    Dockerfile.dev      Dev build — runs Vite dev server with hot reload
    src/
      api/client.js     Shared fetch wrapper (request()) — ALL API methods must use this
      components/       FlipCard, FlipQuiz, AnswerInput, FeedbackBanner, ScoreBar,
                        SessionTimer, QuestionTimer, RoomSettingsModal
      hooks/            useQuizCore (shared quiz state — timers, advance, guards, score),
                        useCountdownTimer (drift-free absolute-time countdown),
                        useStompClient (STOMP WS with publish queue + identity-based cleanup)
      contexts/         RoomContext (multiplayer phase machine), ThemeContext
      utils/            difficultySettings.js, gameplaySettings.js, regionSettings.js
      pages/            Home, FlagsQuiz, MapQuiz, CapitalsQuiz, CitiesQuiz, ShapesQuiz,
                        CurrencyQuiz, LanguageQuiz, BordersQuiz,
                        Lobby, CreateRoom, JoinRoom, MultiplayerGame,
                        Monitoring, AdminCentre, SessionEnd
  backend/
    src/main/java/com/geoquiz/
      entity/           Country, CountryAlias, City, CountryBoundary, QuizEvent, PerformanceEvent
      repository/       JPA repos
      service/          DataRefreshService, QuizAnswerService, MonitoringService
      controller/       CountryController, MapController, QuizController, MonitoringController, AdminController
      config/           WebConfig (CORS)
  docker-compose.yml    Uses Dockerfile.dev for frontend (volume mount, hot reload)
  .env.example
  SPEC.md               This file
```

### Dev vs Production Frontend

The `docker-compose.yml` uses `Dockerfile.dev` for the frontend service, which mounts `./frontend` as a volume and runs `npm run dev -- --host`. This means **any file change in `frontend/src/` hot-reloads in the browser immediately** — no container rebuild needed.

To build the production image (static `serve`), use `Dockerfile` directly:
```bash
docker build -f frontend/Dockerfile -t geoquiz-frontend frontend/
```

### Re-seeding After Schema Change
```bash
docker compose down -v          # drops postgres volume
docker compose up --build       # re-creates and re-seeds
```

### Manual Data Refresh (from inside Docker network)
```bash
docker compose exec backend wget -qO- --post-data="" http://localhost:8080/admin/refresh-data
```

---

## 15. Open Questions — Resolved

| # | Question | Resolution |
|---|---|---|
| 1 | Shape silhouette rotation | Random ±15° CSS rotation — implemented via `useRef` in `ShapesQuiz.jsx` |
| 2 | Map mode region filter | Only selected region's countries highlighted; rest greyed out |
| 3 | Country with no city data (Vatican, Monaco) | < 3 cities stored; Mode 4 shows what's available |
| 4 | Monitoring page access | Localhost-only in v1.0.0 |
| 5 | "Close" hint confirmation | Requires explicit confirm click |

---

## 16. Known Issues & Deferred Work

| Issue | Status | Notes |
|---|---|---|
| Shape silhouette rotation (±15°) | **Implemented** | CSS `transform: rotate()` on SVG via `useRef`, stable per card |
| Boundary simplification | Not implemented | `simplified_geojson` stores full resolution; large for dense countries |
| Countries without data appear in quiz | **Resolved** | Each quiz mode filters out countries missing required data (no flag, no capital, 0 cities, no boundary) before shuffling |
| Cities quiz for micro-nations | Shows 0–2 cities | Vatican, Monaco, Nauru etc. have few cities in GeoNames cities5000; these countries are now excluded from the Cities quiz queue |
| Admin refresh blocked from host | By design | Docker bridge IP != 127.0.0.1; use `docker exec` workaround above |
| GeoNames `altSpellings` coverage | Good but incomplete | "Ivory Coast", "Burma" covered; some obscure aliases may be missing |

---

## 17. Admin Centre (`/admin`)

A three-tab admin page accessible from the Home page.

### Tabs

**Countries Data** (default tab):
- Search input filters by country name
- Sortable columns (click header to toggle A–Z / Z–A, or low→high / high→low for Difficulty): Country, Continent, Sub-region, Currency, Code (currency code), Language, Capital, Difficulty
- Columns (left to right): Country, Flag, Map ✓/✗, Shape ✓/✗, Continent, Sub-region, Currency, Code, Language, Capital, Difficulty, Cities #, Cities
- Flag sizing: all flags rendered at exactly 30×20px (3:2 ratio) with `objectFit: cover` for uniform appearance regardless of source image dimensions
- Rows with missing data (no capital, 0 cities, or no boundary) get an amber left border
- Data fetched from `GET /admin/countries-data` on mount
- Sticky header; alternating row backgrounds

**Monitoring**:
- Renders the existing `Monitoring` component inside the tab

**Settings**:
- **Quiz Difficulty Filter** section: difficulty level (1–5 radio) + filter mode (Inclusive/Exact)
- **Game Play Mode** section: see Section 20
- One "Save Settings" button saves both sections together; shows "✓ Settings saved" for 2s

### Backend endpoint — `GET /admin/countries-data`

Returns a JSON array, one entry per country:
```json
{
  "nameCommon": "France",
  "isoA2": "FR",
  "flagPngUrl": "https://flagcdn.com/w320/fr.png",
  "hasBoundary": true,
  "capital": "Paris",
  "difficulty": 1,
  "cityCount": 3,
  "cityNames": ["Marseille", "Lyon", "Toulouse"]
}
```

No localhost restriction — this is a read-only data endpoint.

---

## 18. Out of Scope — v1.0.0

Unchanged from original spec.

---

## 19. Difficulty Rating System

### 19.1 Overview

Every country has a `difficulty` field (integer 1–5) stored in the database. It controls which countries appear in each quiz based on user settings.

| Value | Label | Description | Examples |
|---|---|---|---|
| 1 | Very Easy | Major world powers, instantly recognisable flags/shapes | US, GB, FR, DE, CN, JP |
| 2 | Easy | Well-known countries in geography/news | PT, TR, EG, ZA, TH, NZ |
| 3 | Medium | Require some geography knowledge | BY, HR, KZ, TN, EC, JM |
| 4 | Hard | Smaller or less-covered nations | ME, TL, FJ, DJ, BZ, CV |
| 5 | Very Hard | Territories, dependencies, remote islands | Bouvet, Cocos, Pitcairn, Antarctica |

### 19.2 Assignment at Seed Time

Difficulty is set **only when a country is first inserted** into the database. Re-seeding an existing country (nightly refresh) does **not** overwrite the stored difficulty value, preserving any manual adjustments made via the database.

The `DataRefreshService.DIFFICULTY_MAP` (static initializer) maps ISO A2 codes to difficulty levels 1–4. Any code not in the map defaults to 5 via `getOrDefault(..., 5)`.

### 19.3 Filter Modes

Two filter modes control how the difficulty setting is applied to quiz queues:

**Inclusive** (`gq_difficulty_mode = "inclusive"`, default):
- Shows countries with `difficulty <= selected level`
- Rating 5 = all countries; rating 1 = Very Easy only

**Exact** (`gq_difficulty_mode = "exact"`):
- Shows only countries matching `difficulty === selected level` exactly
- Useful for practising a specific tier

### 19.4 localStorage Keys

- `gq_difficulty_rating` — integer 1–5, default `5` (show all)
- `gq_difficulty_mode` — `"inclusive"` | `"exact"`, default `"inclusive"`

Settings are read at quiz-start time (inside the countries-load `useEffect`). Changes take effect on the next quiz start.

### 19.5 Frontend Utility

`frontend/src/utils/difficultySettings.js` exports:
- `DIFFICULTY_LABELS` — `['Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard']`
- `getDifficultySettings()` — reads from localStorage
- `setDifficultySettings(rating, mode)` — writes to localStorage
- `difficultyFilter(rating, mode)` — returns a filter predicate `c => boolean`

The filter is applied in every quiz component (FlipQuiz, CitiesQuiz, ShapesQuiz, MapQuiz) after the per-mode filter (hasBoundary, cityCount > 0, etc.) but before shuffling.

### 19.6 Admin Centre — Settings Tab

The Admin Centre (`/admin`) Settings tab has two sections. The first is Quiz Difficulty Filter:
- Select a Difficulty Level via radio buttons (1–5, labelled)
- Select a Filter Mode (Inclusive / Exact)
- Save via the shared "Save Settings" button (also saves Game Play Mode — see Section 20)

---

## 20. Game Play Mode

### 20.1 Overview

Game Play Mode is a centrally-controlled setting (Admin Centre → Settings) that applies identically across all 5 quiz modes. It adds time-based or question-count constraints to quiz sessions.

| Mode | Behaviour |
|---|---|
| **None** (default) | Unlimited questions, no timers — quiz ends when queue is exhausted |
| **Countdown** | Session has a fixed total time budget; when it hits 0, quiz ends and navigates to session-end |
| **Max Questions** | Queue is capped at N questions; optional per-question timer auto-skips if unanswered in time |

### 20.2 Countdown Mode

- A `SessionTimer` component appears in the quiz header replacing the `X/Y` question counter
- Timer format: `MM:SS`, with a thin draining progress bar below (green → amber → red)
- When `remaining ≤ 10s`: text turns red and pulses (`animate-pulse`)
- On expiry: calls `savePersonalBest()` then navigates to `/session-end`
- Configured by: `gq_gp_countdown_secs` (default 60)

### 20.3 Max Questions Mode

- After difficulty filtering and shuffling, the queue is sliced to `min(queueSize, gq_gp_max_questions)`
- The X/Y counter uses the capped queue size as the denominator
- **Per-question timer** (optional, `gq_gp_per_q_timer = true`):
  - A `QuestionTimer` component renders as a thin 4px horizontal bar above the flip card
  - Bar drains left-to-right: teal → amber → red based on % remaining
  - Timer resets on each new question (when `current` changes and card is not yet flipped)
  - On expiry: treated as a skip — `recordResult(..., 'SKIP', null)` + advance
  - Timer stops immediately on correct answer, confirm, or manual skip
  - Configured by: `gq_gp_per_q_secs` (default 15)

### 20.4 localStorage Keys

| Key | Default | Description |
|---|---|---|
| `gq_gp_mode` | `"none"` | `"none"` \| `"countdown"` \| `"maxquestions"` |
| `gq_gp_countdown_secs` | `60` | Total session seconds |
| `gq_gp_max_questions` | `20` | Max questions per session |
| `gq_gp_per_q_timer` | `"false"` | Enable per-question timer (`"true"` / `"false"`) |
| `gq_gp_per_q_secs` | `15` | Seconds per question |

### 20.5 Frontend Implementation

**`utils/gameplaySettings.js`** — `getGameplaySettings()`, `setGameplaySettings(s)`

**`hooks/useCountdownTimer.js`** — drift-free countdown. Sets an absolute `endTimeRef = Date.now() + secs * 1000` on start; each 200ms poll computes `Math.ceil((endTimeRef - Date.now()) / 1000)` rather than decrementing a counter. React state is only updated when the integer second changes (~1 Hz renders). Returns `{ remaining, isRunning, start, stop, reset, startFrom }`. `startFrom(n)` atomically resets and starts in one call. Handles background-tab throttle automatically on resume.

**`components/SessionTimer.jsx`** — MM:SS display + draining progress bar. Pulses red at ≤10s.

**`components/QuestionTimer.jsx`** — 4px draining bar only (no text). Used for per-question timer.

Settings are read at quiz-start time (inside the countries-load `useEffect`). Changes take effect on the next quiz start.

### 20.6 Applied In All Quizzes

Both `FlipQuiz` (shared component, used by Flags, Capitals, Currency) and all standalone quiz pages (MapQuiz, CitiesQuiz, ShapesQuiz, LanguageQuiz, BordersQuiz) implement identical gameplay logic via `useQuizCore`. When `mode === 'none'`, behaviour is unchanged from the baseline. See Section 22.1 for how to add a new mode without duplicating this logic.

---

## 21. New Quiz Modes — Currency, Language, Borders

### 21.1 Currency Quiz (Mode 6)

- **Route:** `/quiz/currency`
- **Component:** `CurrencyQuiz.jsx` wrapping `FlipQuiz`
- **Filter:** `c => !!c.currencyName`
- **Front card:** Currency symbol (large), currency name, currency code (small subtitle). Prompt: "Which country uses this currency?"
- **Back card:** Country name, flag image (240×160 3:2 box), region
- **Answer checking:** Standard `/api/quiz/answer` — user types country name, fuzzy matched

### 21.2 Language Quiz (Mode 7)

- **Route:** `/quiz/language`
- **Component:** `LanguageQuiz.jsx` (standalone)
- **Filter:** `c => c.languages && c.languages.length > 0`
- **Front card:** Country name + flag image. Prompt: "What language(s) do they speak in [X]?"
- **Back card:** All official languages joined with ", "
- **Answer checking:** `POST /api/quiz/language-answer` — accepts any official language as correct. Returns `{ result, canonicalAnswer, allLanguages }`. CORRECT/CLOSE/WRONG supported.
- **Multi-language countries:** Switzerland (French, German, Italian, Romansh), Belgium, Canada, etc. — any one correct language accepted

### 21.3 Borders Quiz (Mode 8)

- **Route:** `/quiz/borders`
- **Component:** `BordersQuiz.jsx` (standalone)
- **Filter:** `c => c.borders && c.borders.length > 0` (excludes island nations, Antarctica)
- **Front card:** Country name + flag image. Prompt: "Name a country that borders [X]"
- **Back card / reveal:** Matched border country name + full border list: "All borders: Andorra, Belgium, ..."
- **Answer checking:** `POST /api/quiz/border-answer` — resolves ISO A3 border codes to country names, fuzzy matches answer against all border countries' names and aliases. Binary CORRECT/WRONG (no CLOSE). `borderNames` always returned.
- **One answer per country:** A single correct border answer advances to the next country (same pattern as Capitals)

### 21.4 New Country Data Fields

All seeded from mledoze/countries on every refresh (not seed-once like `difficulty`):

| Field | Source | Notes |
|---|---|---|
| `flagEmoji` | `flag` field | Unicode emoji e.g. 🇫🇷. Available in API for future UX use. |
| `currencyCode` | First key of `currencies` object | ISO 4217 e.g. `EUR` |
| `currencyName` | `currencies[code].name` | e.g. `Euro` |
| `currencySymbol` | `currencies[code].symbol` | e.g. `€` |
| `languages` | Values of `languages` object | Stored as JSON array e.g. `["French"]` |
| `borders` | `borders` array | Stored as JSON array of ISO A3 codes e.g. `["AND","BEL"]` |

Multi-currency countries: only the first currency entry is stored. This covers the vast majority of quiz-relevant cases.

---

## 22. Frontend Architecture Patterns

This section documents deliberate design decisions established during refactoring. Follow these patterns when adding new quiz modes, multiplayer features, or timer-driven UI.

---

### 22.1 Shared Quiz State — `useQuizCore`

All quiz pages (both `FlipQuiz`-backed and standalone) delegate their shared state to `useQuizCore`. A new quiz mode must **not** re-implement timer management, advance logic, score tracking, or submission guards. Only mode-specific concerns belong in the page component.

**What `useQuizCore` owns:**
- Country queue building (fetch, filter, difficulty filter, shuffle, slice for maxquestions)
- `sessionTimer` and `questionTimer` instances
- `score`, `historyRef`, `recordResult` (settled wrapper — see 22.2)
- `advanceRef`, `advanceQueue` (advances queue + resets all per-question guards)
- `beginSubmit` / `endSubmit` in-flight API guards (see 22.2)
- `questionSettledRef`, `questionGenRef` (see 22.2)
- Loading / error state

**What the page component owns:**
- Mode-specific `filterFn`, `buildQueue`, `getIso`, `getCanonical` passed to `useQuizCore`
- The actual API call (`api.submitXxxAnswer(...)`)
- Local display state (`answer`, `feedback`, `flashState`, etc.)
- Render JSX

```js
// Correct pattern for a new quiz page
const { current, score, recordResult, beginSubmit, endSubmit,
        questionTimer, advanceRef, advanceQueue, ... } = useQuizCore({
  mode: 'mymode',
  region,
  filterFn: c => !!c.someField,
  buildQueue: countries => shuffle(countries),
  getIso: c => c.isoA2,
  getCanonical: c => c.nameCommon,
})
```

---

### 22.2 Per-Question Result Guard System

Three refs prevent race conditions between concurrent submit paths (timer expiry, user confirm, double-click):

| Ref | Purpose | Reset by |
|---|---|---|
| `questionSettledRef` | Only the first `recordResult` call per question is recorded; all subsequent calls are no-ops | `advanceQueue()` |
| `questionGenRef` | Integer generation counter; stale `setTimeout` advance callbacks compare their captured gen and bail if it has changed | `advanceQueue()` |
| `submittingRef` | Prevents a second API call while the first is in-flight | `beginSubmit()` sets it; `endSubmit()` clears it on non-CORRECT paths |

**Rules:**
1. All `handleSubmit` functions must call `beginSubmit()` before the API await and `endSubmit()` on CLOSE/WRONG branches.
2. `questionTimer.stop()` must be called immediately on receiving a CORRECT or CLOSE result — before any async work — to prevent the timer from recording a SKIP during the API await.
3. Timer expiry callbacks that call `advanceRef.current?.()` via `setTimeout` must capture `questionGenRef.current` at schedule time and bail if the gen has changed by fire time.

---

### 22.3 Drift-Free Timer

Never implement a countdown by decrementing a counter in `setInterval`. Use `useCountdownTimer` which anchors to an absolute end time.

**When extending timer behaviour:**
- `startFrom(secs)` — reset + start in one call (use this on new question, not `reset()` + `start()`)
- `stop()` — preserves sub-second residual so `start()` can resume accurately
- Poll interval is 200ms; this is intentional for sub-second expiry accuracy. Do not increase it.
- `onExpire` is held in a ref — safe to pass a new function reference each render.

---

### 22.4 Stable FlipCard Prop References

`FlipCard` has a `useEffect([autoFlip])` that re-syncs the card's flip state when `autoFlip` changes. If props passed to `FlipQuiz` (such as `renderFront`, `renderBack`, `filterFn`, `getQuestion`, `getCanonical`) are inline arrow functions, they create a new reference on every render — this causes spurious re-renders and can desync the flip state.

**Rule:** Any function prop passed to `FlipQuiz` or `FlipCard` that does not close over component state must be defined at **module scope**, not inside the component function.

```js
// Correct — module scope, stable reference
function renderFront(c) {
  return <FlagImage url={c.flagPngUrl} />
}

export default function FlagsQuiz() {
  // renderFront passed by reference — no new object on each render
  return <FlipQuiz renderFront={renderFront} ... />
}
```

---

### 22.5 API Client — Shared Request Wrapper

All methods in `api/client.js` must call the internal `request(method, path, body)` wrapper, which handles:
- `res.ok` checking and `Error` throwing on non-2xx
- JSON vs text response parsing
- Consistent error propagation to callers

**Never use raw `fetch()` directly in `api/client.js`** — callers rely on the wrapper throwing on errors so they can display error state rather than silently receiving malformed payloads.

---

### 22.6 STOMP WebSocket Patterns

Two invariants must be maintained in `useStompClient`:

**Publish queuing:** If `publish()` is called while the STOMP client is disconnected (reconnecting after a network blip), the message must be queued to `pendingPublishes` and flushed on the next `onConnect`. Do not silently drop messages — answers and join announcements submitted during a reconnect window would otherwise be permanently lost.

**Subscription cleanup by identity:** When a `subscribe()` call is cleaned up before the STOMP client connects (pending subscription), remove the exact pending object by reference (`s !== pending`), not by topic string. Multiple callers can subscribe to the same topic; topic-based removal would incorrectly delete all of them when only one unsubscribes.

---

### 22.7 Multiplayer Phase Lifecycle (RoomContext)

The `phase` field in `RoomContext` is a state machine. Valid transitions:

```
LOBBY → STARTING  (GAME_STARTED WS message received)
STARTING → QUESTION  (QUESTION_STARTED WS message received)
STARTING → LOBBY  (8s timeout fires — QUESTION_STARTED never arrived; sets gameStartError)
QUESTION → SUBMITTED  (single-attempt mode: any answer sent)
QUESTION → RESULTS  (QUESTION_ENDED received; unlimited-attempt wrong answers stay in QUESTION)
SUBMITTED → RESULTS  (QUESTION_ENDED received)
RESULTS → QUESTION  (next QUESTION_STARTED received)
RESULTS → ENDED  (GAME_ENDED received)
```

**Rules:**
- `STARTING` is a distinct phase from `LOBBY` — do not conflate them. `STARTING` means the server has confirmed game start but the first question has not yet arrived.
- `MultiplayerGame` must guard against `phase === 'LOBBY' || phase === 'STARTING' || !question` before rendering the game UI.
- `Lobby` must watch `gameStartError` and reset its "Starting…" spinner if the timeout fires.
- The 8-second recovery timeout (`gameStartTimeoutRef`) is started when `GAME_STARTED` arrives and cleared when `QUESTION_STARTED` arrives. It must also be cleared on unmount.
