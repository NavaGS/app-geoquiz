# Frontend Potential Issues & Business Logic Analysis

> Generated: 2026-06-27  
> Last updated: 2026-06-28 — issues 1.1, 1.2, 2.1, 3.1, 4.1, 5.1, 5.2, 5.3, 6.1, 6.2, 7.2, 9.1 resolved; 7.1 confirmed deliberate  
> Scope: Full source review — all quiz modes, multiplayer, hooks, context, and utilities

---

## Table of Contents
1. [Race Conditions & Concurrency](#1-race-conditions--concurrency)
2. [Timer Architecture](#2-timer-architecture)
3. [State & Closure Staleness](#3-state--closure-staleness)
4. [Component Architecture Issues](#4-component-architecture-issues)
5. [Multiplayer-Specific Issues](#5-multiplayer-specific-issues)
6. [API & Data Loading](#6-api--data-loading)
7. [Business Logic Inconsistencies](#7-business-logic-inconsistencies)
8. [UX / Accessibility Concerns](#8-ux--accessibility-concerns)
9. [Code Duplication & Maintainability](#9-code-duplication--maintainability)
10. [Summary Priority Matrix](#10-summary-priority-matrix)

---

## 1. Race Conditions & Concurrency

### 1.1 CLOSE banner + question timer expiry = double result record
**Severity: High | Files: `FlipQuiz.jsx`, `ShapesQuiz.jsx`, `CitiesQuiz.jsx`, `LanguageQuiz.jsx`**
**Status: ✅ RESOLVED**

When a user gets a CLOSE result and the FeedbackBanner is visible, the question timer continues counting down. If the timer expires while the banner is open, `questionTimer.onExpire` fires and records a `SKIP`, then queues `advanceRef.current?.()` via two nested `setTimeout`s. During the 1–3 second window before advance fires, the banner is still visible. If the user clicks "Yes, that's it!" before advance fires:

1. `questionTimer.onExpire` already recorded `SKIP` for the question
2. `handleConfirm` also records `CORRECT` for the same question
3. Both `advance` calls fire, advancing twice (second is a no-op on an empty queue but corrupts in-flight state)

The result: a single question has both SKIP and CORRECT in `historyRef`. The score will be inflated with one extra entry.

There is no mutual exclusion between timer expiry and the confirm button. A simple boolean guard (e.g., `answeredRef`) set in both paths would fix this.

**Fix applied:** Three ref guards added to `useQuizCore` and `FlipQuiz`:
- `questionSettledRef` — only the first `recordResult` call per question goes through; subsequent calls are no-ops.
- `questionGenRef` — incremented on every `advanceQueue()` call; stale `setTimeout` advance callbacks check the generation and bail if it has changed, preventing double-advance.
- Question timer is stopped immediately when a CLOSE result is received (before the user can interact with the banner), eliminating the race for the common case. The settled flag is the safety net if the timer fired during the API await.

---

### 1.2 Double API submission on rapid Enter key / double-click
**Severity: High | File: `FlipQuiz.jsx`**
**Status: ✅ RESOLVED**

`handleSubmit` is `async`. The guard at the top is:
```js
if (!answer.trim() || !current || feedback) return
```
`feedback` is only set AFTER the `await submitAnswer(...)` call resolves. If the user presses Enter twice quickly (or double-clicks Submit), two async submissions fire before either resolves. Both pass the guard (feedback is null for both at start). If the first returns CORRECT, `recordResult(CORRECT)` fires. The second also resolves and also calls `recordResult(CORRECT)`, resulting in a **duplicate correct record** for the same question and two `setTimeout` advances queued.

This applies to all quizzes using `handleSubmit` with an API await and no in-flight guard.

Fix: a `submittingRef` boolean set to `true` before the await and reset after.

**Fix applied:** `submittingRef` in-flight guard added to every quiz page's `handleSubmit`. `beginSubmit()` (exposed from `useQuizCore`, added locally to `FlipQuiz`) returns `false` if a call is already in-flight — the handler returns early. `endSubmit()` is called after the await on CLOSE/WRONG paths (CORRECT paths are gated by `feedback` state and reset by `advanceQueue`). Combined with `questionSettledRef`, the second concurrent submission can neither fire a second API call nor record a second result.

---

### 1.3 Question timer can fire after Skip
**Severity: Medium | Files: `BordersQuiz.jsx`, `ShapesQuiz.jsx`, `LanguageQuiz.jsx`, `CitiesQuiz.jsx`**

In these quizzes, `onSkip` correctly calls `questionTimer.stop()` first. However, `questionTimer.stop()` calls `clearInterval(intervalRef.current)`, which is synchronous. The `setInterval` callback is queued in the macrotask queue. If the timer's tick fires at the EXACT same JavaScript event loop turn as the skip click (impossible due to single-threading) this would be safe. However, if the interval fires between the last render and when `stop()` executes in the event handler, the timer could record an additional SKIP. The probability is low but non-zero under heavy load.

---

### 1.4 BordersQuiz pre-fetch with empty answer POSTs on every question
**Severity: Medium | File: `BordersQuiz.jsx`**

```js
useEffect(() => {
    if (!current) return
    preFetchedBorderNamesRef.current = []
    api.submitBorderAnswer(current.isoA2, '').then(res => {
      preFetchedBorderNamesRef.current = res.borderNames || []
    }).catch(() => {})
}, [current])
```

Every question in BordersQuiz sends a POST to `/api/quiz/border-answer` with `answer: ""` to pre-fetch border names. This endpoint is also used for real answer scoring. If the server logs this as an answer attempt (even with empty string), monitoring stats for BordersQuiz will be artificially inflated with one "wrong attempt" per question. This also doubles the API call count for BordersQuiz versus other modes.

A dedicated read-only endpoint (GET `/api/borders/{iso}`) would be cleaner.

---

## 2. Timer Architecture

### 2.1 `setInterval` drift accumulates over time
**Severity: Medium | File: `useCountdownTimer.js`**
**Status: ✅ RESOLVED**

`setInterval` ticks are "at least N ms late" per firing, causing drift to accumulate over a 60-second session. Background-tab throttling could cause multi-second jumps on resume.

**Fix applied:** `useCountdownTimer` now anchors on an absolute `endTimeRef` set to `Date.now() + secs * 1000` at start time. Each tick computes `Math.ceil((endTimeRef.current - Date.now()) / 1000)` — accurate regardless of late ticks. The poll interval is 200 ms (down from 1000 ms) so expiry fires within 200 ms of the real zero-crossing; React state is only updated when the displayed integer second changes, keeping the render rate at ~1 Hz. Background-tab recovery is automatic: the first tick after the browser throttle releases immediately corrects the displayed time.

---

### 2.2 Session timer does not stop question timer before navigating
**Severity: Low | Files: `FlipQuiz.jsx`, `ShapesQuiz.jsx`, `CitiesQuiz.jsx`, etc.**

When the session countdown expires, `onExpire` calls `navigate('/session-end', ...)` without explicitly stopping the per-question timer. The question timer interval is only cleared when the component unmounts (via `useEffect` cleanup). Between `navigate` triggering and unmount, the question timer could fire one final tick — calling `recordResult` and `setFlipped` on an unmounting component. React 18 silently ignores stale state updates, but `recordResult` appends to `historyRef`, which is now passed to session-end. If the timer fires between navigate and unmount, session-end will receive one extra entry in `results`.

---

### 2.3 MapQuiz CLOSE retry restarts the question timer
**Severity: Low | File: `MapQuiz.jsx`**

```js
function handleRetry() {
    ...
    if (gp?.mode === 'maxquestions' && gp.perQuestionTimer) {
      questionTimer.startFrom(gp.perQuestionSecs)  // full reset
    }
}
```

When a player gets a CLOSE result and clicks "Retype", the question timer is reset to its full duration. This effectively rewards a CLOSE answer with extra time. All other quiz modes (`FlipQuiz.jsx`'s `handleRetry`) do NOT restart the timer — the countdown continues. This is an inconsistency that advantages MapQuiz players on per-question timer mode.

---

## 3. State & Closure Staleness

### 3.1 Score passed to session-end can miss the last result in synchronous advance paths
**Severity: Medium | Files: `FlipQuiz.jsx` (handleConfirm), standalone quizzes**
**Status: ✅ RESOLVED**

`FlipQuiz.advance()` was a `useCallback([score, ...])` that closed over the `score` state value at render time. When `recordResult` was called synchronously and `advance` fired in the same call stack (no `setTimeout`), the `score` captured in the closure was one update behind.

**Fix applied:** `advance()` now reads `scoreRef.current` (the mutable ref that mirrors `score`, updated via `useEffect`) instead of the stale closure value. `score` removed from the `useCallback` dep array. The `useQuizCore` hook already used this pattern correctly; this aligns `FlipQuiz` with it.

---

### 3.2 `scoreRef.current` stale when session timer fires
**Severity: Low | Files: all quiz pages with session timer**

The session timer's `onExpire` callback constructs the final score like this:
```js
const sessionScore = unanswered
    ? { ...scoreRef.current, skipped: scoreRef.current.skipped + 1 }
    : scoreRef.current
```

`scoreRef.current` is synced via:
```js
useEffect(() => { scoreRef.current = score }, [score])
```

This `useEffect` runs AFTER render, so `scoreRef.current` always lags by one render. When `onExpire` calls `recordResult(...)` (which schedules a setScore update) and then immediately reads `scoreRef.current`, it reads the value BEFORE the recordResult update is applied. The manual `+1` compensates for this, which is correct — but only for the single pending skip. If multiple state updates are batched (unlikely here), this could be incorrect.

---

### 3.3 `advance` update pattern inconsistency — FlipQuiz vs standalone quizzes
**Severity: Low | Files: all quiz pages**

FlipQuiz uses:
```js
useEffect(() => { advanceRef.current = advance }, [advance])
```
Standalone quizzes (ShapesQuiz, CitiesQuiz, BordersQuiz, LanguageQuiz, CurrencyQuiz) use:
```js
useEffect(() => { advanceRef.current = advance })  // no deps array
```

The no-deps version runs after EVERY render, always keeping the ref current. The FlipQuiz version only updates when `advance` (a `useCallback`) changes — which happens when its deps (`score`, `mode`, etc.) change.

Between score updates, FlipQuiz's `advanceRef.current` holds a `score` that is one question behind. The 700ms timeout window before `advance` is called usually compensates (score state updates before the timeout fires). But this is an implicit temporal assumption, not a guaranteed ordering. The standalone approach (no-deps) is more correct.

---

### 3.4 `getRegion()` is not reactive
**Severity: Low | Files: all quiz pages**

```js
const region = getRegion()  // reads localStorage at render time
```

Called once during component rendering. If a user could change their region setting mid-session (via another tab or devtools), the quiz would continue with the stale region. Not a practical concern today, but the pattern is brittle. Prefer a React state or context-driven value for settings that affect active data fetches.

---

## 4. Component Architecture Issues

### 4.1 FlipCard internal `flipped` state desyncs from `autoFlip` on user click
**Severity: Medium | File: `FlipCard.jsx`**
**Status: ✅ RESOLVED**

`FlipCard` had its OWN internal `flipped` state. The sync effect included `front` as a dependency:
```js
useEffect(() => { setFlipped(autoFlip) }, [autoFlip, front])
```
In `FlagsQuiz` and `CapitalsQuiz`, `renderFront` was an inline arrow function — new reference every render — causing `frontContent` to recompute on every timer tick. The effect fired on every render, calling `setFlipped(false)` and immediately snapping back any card the user had clicked to peek.

**Fix applied (two-part):**
1. `FlagsQuiz.jsx` and `CapitalsQuiz.jsx`: All prop functions (`renderFront`, `renderBack`, `filterFn`, `getQuestion`, `getCanonical`) extracted to module scope. Being pure functions of their `c` argument with no component state, they need no closure and are stable across renders.
2. `FlipCard.jsx`: Removed `front` from the sync effect's dep array. `autoFlip` alone is the authoritative flip trigger — the parent's `advance()` resets it to `false` on each new question, which is the correct signal to un-flip.

---

### 4.2 `FlipCard.onFlip` is not called when `autoFlip` triggers the flip
**Severity: Low | File: `FlipCard.jsx`, `BordersQuiz.jsx`**

```js
const flip = useCallback(() => {
    setFlipped(f => !f)
    onFlip?.()  // only called on user click
}, [onFlip])
```

The `useEffect([autoFlip, front])` directly calls `setFlipped(autoFlip)` without invoking `onFlip`. In `BordersQuiz.jsx`, `onFlip` is:
```jsx
onFlip={() => setLastBorderNames(preFetchedBorderNamesRef.current)}
```

When the card flips via `autoFlip` (timer expiry, skip, correct answer), border names are NOT populated via `onFlip`. BordersQuiz compensates by setting `lastBorderNames` directly before setting `flipped=true`. But this coupling is fragile — if the sequence changes, the back face would show an empty border list.

---

### 4.3 `FeedbackBanner.onConfirm` else-branch is dead code
**Severity: Low | Files: `FlipQuiz.jsx`, `ShapesQuiz.jsx`, `CitiesQuiz.jsx`, `LanguageQuiz.jsx`**

`FeedbackBanner` only renders the confirm/retry buttons for `result === 'CLOSE'`. For `result === 'CORRECT'`, it renders plain text with no buttons. Yet all quiz pages pass `onConfirm` handlers with logic for both CLOSE and a fallback `else`:
```js
onConfirm={() => {
    if (feedback?.result === 'CLOSE') { ... }
    else { recordResult(iso, 'SKIP', ...) }  // never called
}}
```
The `else` branch is unreachable today. If `FeedbackBanner` is ever extended to show a confirm button for CORRECT results, this code would record a SKIP for a correct answer — a silent correctness bug waiting to be triggered.

---

### 4.4 SessionEnd hero section is hardcoded for dark theme
**Severity: Low | File: `SessionEnd.jsx`**

```jsx
<div className="bg-[#0F1829] flex flex-col items-center justify-center ...">
```

The score hero uses hardcoded dark navy colors regardless of the current theme. The SVG progress ring also hardcodes dark theme stroke colors (`#1E2E47`, `#4F70FF`). In light mode, this section has an isolated dark island that does not follow `ThemeContext`. The rest of the page uses theme CSS variables correctly.

---

### 4.5 SessionEnd `useEffect` missing dependencies — fragile stale closure
**Severity: Low | File: `SessionEnd.jsx`**

```js
useEffect(() => {
    if (!results.length || !region) return
    api.getCountries(region).then(...)
}, [])  // ← region and results missing from deps

useEffect(() => {
    if (mode !== 'shapes' || !results.length) return
    ...
}, [])  // ← mode and results missing from deps
```

Both effects have empty dependency arrays. They work today because `region`, `mode`, and `results` come from `location.state` (available synchronously on first render). This is technically correct but will silently break if any of these values become async or start with a different initial value. The correct pattern is to either include all referenced values in deps or move initialization into `useState` with an initializer function.

---

### 4.6 Lobby HOST badge assigned by array position, not by role
**Severity: Low | File: `Lobby.jsx`**

```jsx
{players.map((p, i) => (
    <div key={p.id}>
        ...
        {i === 0 && <span>HOST</span>}  // first in array
    </div>
))}
```

The HOST badge is given to the player at index 0 in the array. This assumes the server always puts the host first. If the server sends players in join-order or alphabetical order, a non-host player could receive the HOST badge. The correct approach is to check `p.id === playerId && isHost` (or a server-provided `isHost` flag per player entry).

---

## 5. Multiplayer-Specific Issues

### 5.1 WebSocket messages published during disconnection are silently dropped
**Severity: High | File: `useStompClient.js`, `RoomContext.jsx`**
**Status: ✅ RESOLVED**

```js
const publish = useCallback((destination, body) => {
    clientRef.current?.publish({ destination, body: JSON.stringify(body) })
}, [])
```

If the STOMP client is temporarily disconnected (e.g., network blip, auto-reconnect in progress), `publish` is a no-op — the answer, join announcement, or game-start message is permanently lost. The STOMP client reconnects after 3 seconds, but there is no queuing or retry mechanism. A player who submits an answer during this window has their answer silently discarded.

**Fix applied:** `pendingPublishes` ref added to `useStompClient`. When `publish` is called while disconnected, the serialized message is pushed to the queue. On `onConnect`, all queued messages are flushed to the server before pending subscriptions are established. The server is responsible for rejecting stale messages (wrong `questionIndex`) if the game has moved on during the disconnection window.

---

### 5.2 Pending subscription cleanup removes by topic, not by handler
**Severity: Medium | File: `useStompClient.js`**
**Status: ✅ RESOLVED**

```js
} else {
    pendingSubscriptions.current.push({ topic, handler })
    return () => {
        pendingSubscriptions.current = pendingSubscriptions.current.filter(s => s.topic !== topic)
    }
}
```

The cleanup function filters by `topic` only. If `setupSubscriptions` in `RoomContext` is called twice before the STOMP client connects (e.g., if `initRoom` is called more than once, or in React StrictMode's double-invoke), both subscriptions for the same topic are pushed to pending. When the first one's cleanup runs, it removes **all** pending entries for that topic — including the second subscription. After reconnection, the second topic (e.g., the personal player channel `/topic/room/{code}/player/{id}`) would never be established. Result: the player misses all server messages sent to their private channel.

**Fix applied:** Cleanup function now uses object identity (`s !== pending`) instead of topic comparison. Each `subscribe()` call creates a unique `pending` object; its cleanup removes only that specific entry.

---

### 5.3 `GAME_STARTED` reducer action resets phase to `'LOBBY'`
**Severity: Medium | File: `RoomContext.jsx`**
**Status: ✅ RESOLVED**

`GAME_STARTED` previously re-set `phase` to `'LOBBY'`, making it semantically indistinguishable from the pre-game waiting state. If `QUESTION_STARTED` was dropped or delayed, the client was permanently stuck with no recovery path.

**Fix applied (three parts):**
1. `GAME_STARTED` now transitions to `phase: 'STARTING'` — semantically distinct from `'LOBBY'`.
2. `RoomContext` starts an 8-second timeout when `GAME_STARTED` arrives. If `QUESTION_STARTED` does not arrive in time, a `GAME_START_TIMEOUT` action resets to `phase: 'LOBBY'` and sets `gameStartError` in state. `Lobby.jsx` watches `gameStartError` and resets the "Starting…" spinner, showing the error inline so the host can retry.
3. `MultiplayerGame.jsx`'s loading guard now checks `phase === 'STARTING'` in addition to `'LOBBY'`, so a direct-URL navigation during the start window shows the spinner rather than a blank screen.

---

### 5.4 Multiplayer MapView re-fetches GeoJSON on every phase transition
**Severity: Low | File: `MultiplayerGame.jsx`**

`MapView` is conditionally rendered when `quizMode === 'map'`:
```jsx
{quizMode === 'map' && <MapView isoA2={question.isoA2} theme={theme} />}
```

When `phase` transitions to `RESULTS`, the `MapView` is rendered in the same JSX block (it's always inside the question area, visible alongside the leaderboard view). But when `phase` transitions back to `QUESTION`, a new `MapView` instance mounts. Since `useEffect([], [])` runs on mount, the world GeoJSON is re-fetched from the server for every question. A 25-question game would trigger 25 world GeoJSON downloads. This should be hoisted to the parent or cached.

---

### 5.5 Multiplayer answer submission has no question index validation on client
**Severity: Low | File: `MultiplayerGame.jsx`**

```js
ctxSubmit(code, playerId, question.questionIndex, answer.trim(), responseAttempts)
```

If the server advances to the next question while the player's answer is in-transit, the `question.questionIndex` would be stale. The server should reject mismatched indices, but the client does not warn the player. The user sees no feedback (the phase might have already changed to RESULTS) and their answer is silently rejected.

---

## 6. API & Data Loading

### 6.1 Missing `.catch()` on country data fetch in most quiz pages
**Severity: High | Files: `CitiesQuiz.jsx`, `LanguageQuiz.jsx`, `BordersQuiz.jsx`, `CurrencyQuiz.jsx`, `ShapesQuiz.jsx`**
**Status: ✅ RESOLVED** (fixed in `useQuizCore` refactor)

All these quizzes load countries in `useEffect` without a `.catch()`. If the API request fails, the component stays on "Loading…" indefinitely with no error message.

**Fix applied:** The `useQuizCore` hook (introduced in the structural refactor) includes `.catch(e => { setError(e.message); setLoading(false) })` on the country fetch. All five pages now render the error state when `error` is truthy.

---

### 6.2 API methods bypass the shared `request` wrapper — no error handling
**Severity: Medium | File: `api/client.js`**
**Status: ✅ RESOLVED**

Three API methods used `fetch` directly without going through the shared `request()` wrapper, meaning non-200 responses were parsed silently as JSON and callers received malformed payloads.

**Fix applied:** `submitLanguageAnswer`, `submitCurrencyAnswer`, and `submitBorderAnswer` now call `request()`, giving them `res.ok` checking, proper error throwing, and consistent JSON/text handling.

---

### 6.3 `Play Again` in SessionEnd navigates to routes that accept no incoming state
**Severity: Low | File: `SessionEnd.jsx`**

```jsx
<button onClick={() => navigate(`/quiz/${mode}`, { state: { region, timer: 30 } })}>
    Play Again
</button>
```

This navigates with `{ state: { region, timer: 30 } }` in router state. None of the quiz pages read `location.state` — they always read `region` from `getRegion()` (localStorage) and `timer` is ignored. The passed state is silently unused. This means:
1. A user who just played a different region than their saved preference won't replay with the same region
2. The `timer: 30` suggestion is completely ignored

---

## 7. Business Logic Inconsistencies

### 7.1 MapQuiz records WRONG on incorrect answers; all other modes allow retries
**Severity: Medium | Files: `MapQuiz.jsx` vs all others**
**Status: Deliberate design decision — no code change**

MapQuiz is intentionally harder: wrong = immediate advance + country reveal (single-attempt). This models the real-world difficulty of identifying a country purely from its map position. All other modes show the answer on the back of a flip card and allow unlimited retries, fitting a flashcard-learning metaphor.

The inconsistency in the `wrong` score counter (always 0 in non-map modes) is a display limitation — non-map modes never call `recordResult(WRONG)` by design. If a unified wrong-count display is needed, a future pass should either normalise the result types or remove the counter from modes where it has no meaning.

---

### 7.2 CurrencyQuiz silently drops CLOSE results from the API
**Severity: Medium | File: `CurrencyQuiz.jsx`**
**Status: ✅ RESOLVED**

CurrencyQuiz treated `CLOSE` identically to `WRONG` — wrong flash, no hint, no confirmation. Every other fuzzy-matching mode shows the CLOSE banner.

**Fix applied:** Added `CLOSE` branch to `handleSubmit` (stop timer, set CLOSE flash + feedback) and wired `FeedbackBanner` into the CurrencyQuiz render tree with the same `onConfirm`/`onRetry` pattern used by ShapesQuiz, LanguageQuiz, and CitiesQuiz. Currency CLOSE now records `CORRECT` on confirm and allows retype on retry, consistent with all other modes.

---

### 7.3 BordersQuiz accepts any ONE bordering country as correct
**Severity: Low | File: `BordersQuiz.jsx` — business logic note**

The prompt says "Name **a** bordering country" (singular). Once a user names one correct border, the question advances. Users who know one obvious neighbor (e.g., Germany for France) can skip through without knowing all borders. This is intentional by design but creates a very easy path for common countries. There is no feedback indicating "yes and there are X more borders" — the flip side shows all borders after advance, but this comes too late to encourage deeper learning.

---

### 7.4 CitiesQuiz can ask multiple questions for the same country
**Severity: Low | File: `CitiesQuiz.jsx`**

The queue is built by flattening ALL cities from ALL countries:
```js
for (const country of filtered) {
    for (const cityName of country.cityNames) {
        flat.push({ cityName, country })
    }
}
```

A country with 5 cities appears 5 times in the queue. In a `maxquestions=20` session with a dominant country, a player could answer France (Paris), France (Lyon), France (Marseille), France (Nice)... This isn't a bug, but the deduplication strategy (or lack thereof) means skill at one large country inflates the score relative to genuine global knowledge.

---

### 7.5 Difficulty rating defaults differ between singleplayer and multiplayer
**Severity: Low | Files: `difficultySettings.js`, `Lobby.jsx`**

Singleplayer default:
```js
rating: parseInt(localStorage.getItem('gq_difficulty_rating') || '5', 10)
// → default 5 (hardest)
```

Multiplayer default (from `Lobby.jsx` via `initRoom`):
```js
difficultyRating: roomData.difficultyRating ?? 5,
```
But `RoomContext` initial state is:
```js
difficultyRating: 2,  // ← default 2 (easy)
```

The effective multiplayer difficulty depends on whether the server returns a rating or falls back to the context default. Inconsistent defaults mean solo and multiplayer sessions have different baseline difficulty expectations.

---

## 8. UX / Accessibility Concerns

### 8.1 No visual indication that question timer continues during CLOSE banner
**Severity: Medium | Files: `FlipQuiz.jsx`, `ShapesQuiz.jsx`, etc.**

When a player gets a CLOSE result, the CLOSE banner appears with "Yes, that's it!" and "Let me retype" buttons. The question timer bar continues depleting in the background. There is no visual urgency cue that time is running out. A player deliberating over the CLOSE banner could unknowingly let the timer expire, triggering a SKIP record before they click confirm (see issue 1.1).

---

### 8.2 `AnswerInput` Skip button has no visual feedback after click
**Severity: Low | File: `AnswerInput.jsx`**

After clicking Skip (or pressing Tab), `skipping` state is set to true and the button is disabled. But there is no loading indicator or text change to confirm the skip was registered. The card flip takes 350ms and then the advance happens after 2 seconds. Users who click Skip and don't see immediate feedback may click it again or try to type, creating confusion.

---

### 8.3 Spacebar card flip is blocked when input is focused
**Severity: Low | File: `FlipQuiz.jsx`**

```js
if (e.key === ' ' && !e.target.matches('input')) {
    e.preventDefault()
    setFlipped(f => !f)
}
```

The spacebar flip is only active when the input field is NOT focused. Since `AnswerInput` auto-focuses on every question (`focusKey` changes), spacebar is typically disabled for the card flip. Users expecting to press Space to peek at the answer will find it unresponsive. The Tab key is used for Skip (via `AnswerInput`), so there is no non-mouse way to flip the card while typing.

---

### 8.4 No loading state when the CLOSE banner confirmation triggers advance
**Severity: Low | File: `FlipQuiz.jsx`**

After clicking "Yes, that's it!" on the CLOSE banner, the component immediately calls `setFlipped(true)` and queues `advanceRef.current?.()` after 700ms. During those 700ms, the banner remains visible with no indication that the action was registered. Users may click the button multiple times.

---

### 8.5 Multiplayer lobby "Start Game" enabled with only 1 player (host alone)
**Severity: Low | File: `Lobby.jsx`**

```jsx
disabled={starting || players.length < 1 || !connected}
```

The start button is enabled when `players.length >= 1`. This means the host can start a "multiplayer" game alone. While valid as a testing mechanism, there is no confirmation or warning that starting with one player is unusual. A minimum of 2 players is conventional for multiplayer games.

---

### 8.6 Console.log debug statement left in production code
**Severity: Low | File: `Lobby.jsx`**

```js
console.log('[Lobby] handleStart', { code, stored: parsed, ht })
```

A debug `console.log` with room codes and host tokens is present in the start game flow. In production, this leaks session information to the browser console.

---

## 9. Code Duplication & Maintainability

### 9.1 Six quiz pages duplicate the same timer + advance + session management pattern
**Severity: Medium | Files: `ShapesQuiz.jsx`, `CitiesQuiz.jsx`, `LanguageQuiz.jsx`, `CurrencyQuiz.jsx`, `BordersQuiz.jsx`, `MapQuiz.jsx`**
**Status: ✅ RESOLVED**

Each page contained near-identical implementations of session/question timers, advance logic, and ref mirrors. A single bug fix required 7 changes.

**Fix applied:** `useQuizCore` hook extracted as the single source of truth for all shared quiz state. All 6 standalone pages now delegate to it, keeping only mode-specific rendering, API calls, and local state. Bug fixes (like 1.1, 1.2, 6.1) now apply once in the hook and cover all modes automatically.

---

### 9.2 `advance()` in standalone quizzes uses `useEffect` without deps (runs every render)
**Severity: Low | Files: `ShapesQuiz.jsx`, `CitiesQuiz.jsx`, `LanguageQuiz.jsx`, `CurrencyQuiz.jsx`, `BordersQuiz.jsx`**

```js
useEffect(() => { advanceRef.current = advance })  // no deps
```

This runs after every render, which is functionally correct but semantically different from `FlipQuiz`'s deps-aware version. The no-deps approach runs even on unrelated re-renders (timer ticks, etc.), but since it's just a ref assignment, the performance impact is negligible. The inconsistency does make it harder to reason about when the ref is guaranteed to be current.

---

### 9.3 Hardcoded accent color `#7C3AED` bypasses the theme system
**Severity: Low | Files: `MultiplayerGame.jsx`, `Lobby.jsx`, `CreateRoom.jsx`, `JoinRoom.jsx`**

Multiple multiplayer components use inline `style={{ backgroundColor: '#7C3AED' }}` rather than the theme accent CSS variable (`var(--accent)`). If the accent color is ever changed in `tailwind.config.js` or `index.css`, the multiplayer UI will not update. Other parts of the app correctly use `bg-accent` (Tailwind class mapping to the CSS variable).

---

## 10. Summary Priority Matrix

| # | Issue | Severity | Status | File(s) |
|---|-------|----------|--------|---------|
| 1.1 | CLOSE banner + timer expiry = double result record | **High** | ✅ Fixed | FlipQuiz, ShapesQuiz, CitiesQuiz, LanguageQuiz |
| 1.2 | Rapid Enter/double-click causes duplicate API submission | **High** | ✅ Fixed | All quiz pages |
| 6.1 | Missing `.catch()` on data fetch — infinite loading on error | **High** | ✅ Fixed | All standalone quiz pages (via useQuizCore) |
| 5.1 | Published WS messages dropped during reconnection | **High** | ✅ Fixed | useStompClient |
| 9.1 | Six quiz pages duplicate session/question timer management | **Medium** | ✅ Fixed | All standalone quizzes |
| 5.2 | Pending subscription cleanup removes wrong entries | **Medium** | ✅ Fixed | useStompClient |
| 6.2 | submitLanguage/Currency/BorderAnswer bypass error wrapper | **Medium** | ✅ Fixed | api/client.js |
| 4.1 | FlipCard desyncs on user click due to inline renderFront | **Medium** | ✅ Fixed | FlipCard, FlagsQuiz, CapitalsQuiz |
| 3.1 | Last result missing from score in synchronous advance | **Medium** | ✅ Fixed | FlipQuiz (handleConfirm) |
| 2.1 | setInterval timer drift — accumulates over session | **Medium** | ✅ Fixed | useCountdownTimer |
| 5.3 | GAME_STARTED → LOBBY blocks recovery if QUESTION_STARTED drops | **Medium** | ✅ Fixed | RoomContext, Lobby, MultiplayerGame |
| 7.1 | MapQuiz single-attempt vs other modes unlimited-retry | **Medium** | Deliberate | MapQuiz |
| 7.2 | CurrencyQuiz silently drops CLOSE results | **Medium** | ✅ Fixed | CurrencyQuiz |
| 1.3 | Timer can fire after Skip in same event loop tick | **Low** | Open | Multiple |
| 1.4 | BordersQuiz pre-fetch POSTs empty answer (inflates monitoring) | **Low** | Open | BordersQuiz |
| 2.2 | Session timer doesn't stop question timer before navigate | **Low** | Open | All quiz pages |
| 2.3 | MapQuiz CLOSE retry restarts question timer (unfair extra time) | **Low** | Open | MapQuiz |
| 3.2 | `scoreRef.current` stale by one render on session expiry | **Low** | Open | All quiz pages |
| 3.4 | `getRegion()` not reactive to localStorage changes | **Low** | Open | All quiz pages |
| 4.2 | `onFlip` not called when autoFlip overrides | **Low** | Open | FlipCard, BordersQuiz |
| 4.3 | FeedbackBanner onConfirm else-branch unreachable — future trap | **Low** | Open | FlipQuiz, ShapesQuiz, CitiesQuiz, LanguageQuiz |
| 4.4 | SessionEnd hero hardcoded dark theme — breaks in light mode | **Low** | Open | SessionEnd |
| 4.5 | SessionEnd useEffect empty deps — fragile stale closure | **Low** | Open | SessionEnd |
| 4.6 | Lobby HOST badge by array index, not by role | **Low** | Open | Lobby |
| 5.4 | MapView re-fetches GeoJSON on every question in multiplayer | **Low** | Open | MultiplayerGame |
| 5.5 | No client-side stale question index guard in multiplayer submit | **Low** | Open | MultiplayerGame |
| 6.3 | Play Again passes ignored state to quiz routes | **Low** | Open | SessionEnd |
| 7.4 | CitiesQuiz allows same country to dominate queue | **Low** | Open | CitiesQuiz |
| 7.5 | Difficulty default differs between singleplayer (5) and multiplayer (2) | **Low** | Open | difficultySettings, RoomContext |
| 8.1 | No urgency cue that timer continues during CLOSE banner | **Low** | Open | FlipQuiz, others |
| 8.3 | Spacebar flip blocked when input is focused | **Low** | Open | FlipQuiz |
| 8.5 | Multiplayer game can start with 1 player | **Low** | Open | Lobby |
| 8.6 | Debug console.log with host token in production | **Low** | Open | Lobby |
| 9.3 | Hardcoded `#7C3AED` bypasses theme system | **Low** | Open | Multiplayer pages |
