DEPLOYING GEOQUIZ (VERCEL + RAILWAY)

---

OVERVIEW

Frontend → Vercel (static Vite build, GitHub-connected)
Backend  → Railway (Docker container, Spring Boot + PostgreSQL)

Once deployed you share one URL, e.g. https://geoquiz.vercel.app
Friends open it and enter a room code — no local setup needed.

---

PART 1 — BACKEND ON RAILWAY

Step 1: Create a Railway project

  railway.app → New Project → Deploy from GitHub repo
  Select the geoquiz repo.
  Set the Root Directory to: backend
  Railway auto-detects the Dockerfile — no railway.json or Procfile needed.

Step 2: Add a PostgreSQL database

  In your Railway project → New → Database → PostgreSQL
  Railway provisions it and injects connection variables automatically.

Step 3: Set environment variables on the backend service

  Go to your backend service → Variables tab → add:

  POSTGRES_URL       jdbc:${{Postgres.DATABASE_URL}}
  POSTGRES_USER      ${{Postgres.PGUSER}}
  POSTGRES_PASSWORD  ${{Postgres.PGPASSWORD}}
  FRONTEND_ORIGIN    https://your-app.vercel.app   ← set AFTER Vercel deploy

  Note: ${{Postgres.DATABASE_URL}} is Railway's reference syntax — it pulls the
  value from your PostgreSQL plugin automatically. The jdbc: prefix is required;
  Spring Boot's JDBC driver won't accept a bare postgresql:// URL.

  Note: PORT is set automatically by Railway and the app reads it via ${PORT:8080}
  in application.yml — do not set this manually.

Step 4: Deploy

  Railway builds the Docker image (Maven → JRE Alpine, ~3–5 min first time).
  Once green, copy the public URL: https://geoquiz-backend.up.railway.app
  This is your VITE_API_URL and VITE_WS_URL value.

Step 5: First-run data seeding

  On first startup the backend seeds all country data (flags, capitals, borders,
  cities, currencies, languages). This takes 30–90 seconds. Check Railway logs
  for "Seeding complete" before testing.

---

PART 2 — FRONTEND ON VERCEL

Step 1: Import the GitHub repo

  vercel.com → Add New Project → import geoquiz repo

Step 2: Configure the project (IMPORTANT — do not skip)

  Root Directory:    frontend
  Framework Preset:  Vite  (auto-detected)
  Build Command:     npm run build  (auto)
  Output Directory:  dist  (auto)

  The vercel.json inside frontend/ handles SPA client-side routing automatically.

Step 3: Set environment variables

  Go to Settings → Environment Variables → add:

  VITE_API_URL    https://your-backend.up.railway.app
  VITE_WS_URL     https://your-backend.up.railway.app

  IMPORTANT: these must be prefixed VITE_ (not REACT_APP_).
  Vite only exposes env vars with the VITE_ prefix to the browser bundle.
  Any other prefix is silently ignored and the app falls back to localhost:8080.

  VITE_WS_URL is the same URL as VITE_API_URL — SockJS connects to /ws on the
  same host. In production it automatically uses wss:// (secure WebSocket) because
  the host URL starts with https://.

Step 4: Deploy

  Vercel builds and deploys. Copy your public URL:
  https://geoquiz.vercel.app (or your chosen name)

Step 5: Wire Vercel URL back into Railway

  Return to Railway → backend service → Variables:
  Set FRONTEND_ORIGIN = https://geoquiz.vercel.app

  Then redeploy the backend (Railway → Redeploy). This updates the CORS config
  so the backend accepts requests from your Vercel domain.

---

PART 3 — VERIFY IT WORKS

Checklist:

  [ ] Open https://your-app.vercel.app — home page loads
  [ ] Solo quiz works (flags, capitals, etc.)
  [ ] Click Play with Friends → Create a Room
  [ ] Room code appears in lobby
  [ ] Open second tab/window → Join a Room → enter code
  [ ] Both tabs show each other in the lobby (WebSocket working)
  [ ] Host clicks Start Game → both windows enter the game simultaneously
  [ ] Answers submit and score updates after each question

If the lobby shows "Connecting to server…" permanently:
  → Check VITE_WS_URL is set correctly in Vercel
  → Check FRONTEND_ORIGIN matches your Vercel domain exactly (no trailing slash)
  → Check Railway backend logs for connection errors

---

PART 4 — SUBSEQUENT DEPLOYS

Frontend: every git push to main auto-deploys on Vercel.

Backend: Railway also watches the repo and redeploys on push to main.
  If you only changed frontend files, Railway still rebuilds — you can disable
  auto-deploy on Railway for the backend service and trigger manually if needed.

Local dev still works unchanged:
  docker compose up --build
  → frontend on http://localhost:5173
  → backend on http://localhost:8080

---

ENVIRONMENT VARIABLE SUMMARY

  Service   Variable            Value
  ───────────────────────────────────────────────────────────
  Railway   POSTGRES_URL        jdbc:${{Postgres.DATABASE_URL}}
  Railway   POSTGRES_USER       ${{Postgres.PGUSER}}
  Railway   POSTGRES_PASSWORD   ${{Postgres.PGPASSWORD}}
  Railway   FRONTEND_ORIGIN     https://your-app.vercel.app
  Vercel    VITE_API_URL        https://your-backend.up.railway.app
  Vercel    VITE_WS_URL         https://your-backend.up.railway.app

  Do NOT set: PORT (Railway manages this automatically)
  Do NOT use: REACT_APP_ prefix (this is a Create React App convention, not Vite)
