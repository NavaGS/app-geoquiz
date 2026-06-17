# GeoQuiz — UI/UX Redesign Specification
**Version:** 1.0.0
**Date:** June 2026
**Status:** Proposal — no functional changes, design-only

> This document proposes a complete visual and experiential redesign of GeoQuiz.
> **No features are added or removed.** Every existing quiz mode, setting, and screen is preserved.
> All recommendations are purely aesthetic, structural, and navigational.

---

## 1. Design Philosophy

**Theme: Aerospace + Travel**

The redesign is inspired by two complementary worlds: the precision and ambition of aerospace, and the wonder and movement of travel. Together they produce a design language that feels:

- **Purposeful** — every element earns its place. No decoration for decoration's sake.
- **Expansive** — generous whitespace, deep colours, a sense of horizon and distance.
- **In motion** — subtle transitions, directional cues, the feeling of going somewhere.
- **Confident** — bold typography, clear hierarchy, nothing timid or tentative.

Inspirational references: cockpit instrument panels, airport departure boards, altitude charts, passport stamps, star charts, satellite imagery, terminal displays.

---

## 2. Colour Palette

### 2.1 Light Mode

| Token | Hex | Usage |
|---|---|---|
| `--bg-base` | `#F4F6FB` | Page backgrounds |
| `--bg-surface` | `#FFFFFF` | Cards, modals, panels |
| `--bg-subtle` | `#EDF0F7` | Table stripes, input backgrounds |
| `--border` | `#D8DEEB` | Borders, dividers |
| `--text-primary` | `#0D1526` | Headings, labels |
| `--text-secondary` | `#4A5568` | Body, descriptions |
| `--text-muted` | `#8896A8` | Placeholders, metadata |
| `--accent` | `#1B3FE4` | Primary CTA buttons, active states |
| `--accent-hover` | `#1432C0` | Hover on accent |
| `--accent-glow` | `#1B3FE420` | Focus rings, card highlights |
| `--success` | `#059669` | Correct answer feedback |
| `--warning` | `#D97706` | Close answer feedback |
| `--error` | `#DC2626` | Wrong answer feedback |
| `--amber-flag` | `#F59E0B` | Missing data indicator |

**Mode accent colours** (unchanged in role, refined in tone):

| Mode | Current | Redesign Light | Redesign Dark |
|---|---|---|---|
| Flags | blue-500 | `#1B3FE4` | `#4F70FF` |
| Map | green-500 | `#0D9488` | `#2DD4BF` |
| Capitals | orange-500 | `#EA580C` | `#FB923C` |
| Cities | purple-600 | `#7C3AED` | `#A78BFA` |
| Shapes | teal-600 | `#0F766E` | `#2DD4BF` |
| Currency | yellow-600 | `#CA8A04` | `#FACC15` |
| Language | green-600 | `#16A34A` | `#4ADE80` |
| Borders | indigo-600 | `#4338CA` | `#818CF8` |

---

### 2.2 Dark Mode

| Token | Hex | Usage |
|---|---|---|
| `--bg-base` | `#080D1A` | Page backgrounds — near-black with a blue tint (night sky) |
| `--bg-surface` | `#0F1829` | Cards, panels |
| `--bg-subtle` | `#162136` | Table stripes, hover states |
| `--border` | `#1E2E47` | Borders, dividers |
| `--text-primary` | `#E8EDF5` | Headings, labels |
| `--text-secondary` | `#8EA4BF` | Body, descriptions |
| `--text-muted` | `#4D637A` | Placeholders, metadata |
| `--accent` | `#4F70FF` | Primary CTA — electric blue |
| `--accent-hover` | `#6B87FF` | Hover on accent |
| `--accent-glow` | `#4F70FF25` | Focus rings, glows |
| `--success` | `#10B981` | Correct answer |
| `--warning` | `#F59E0B` | Close answer |
| `--error` | `#F87171` | Wrong answer |
| `--amber-flag` | `#F59E0B` | Missing data |

**Dark mode background rationale:** `#080D1A` reads like a clear night sky from altitude. Cards at `#0F1829` lift naturally off it. The overall effect is a cockpit or a flight-planning terminal — precise, dark, lit only where needed.

---

## 3. Typography

### 3.1 Type Scale

| Role | Font | Weight | Size | Usage |
|---|---|---|---|---|
| App name | Inter | 800 | 2.25rem (36px) | "GeoQuiz" wordmark |
| Page title | Inter | 700 | 1.5rem (24px) | Quiz mode names, section headings |
| Card title | Inter | 600 | 1.125rem (18px) | Mode card names |
| Body | Inter | 400 | 0.875rem (14px) | Descriptions, labels |
| Caption | Inter | 400 | 0.75rem (12px) | Metadata, table secondary text |
| Quiz prompt | Inter | 500 | 0.8125rem (13px) | "Which country is this flag?" |
| Quiz answer (large) | Inter | 700 | 2.25rem (36px) | City names, currency symbols on front card |
| Country reveal | Inter | 700 | 1.75rem (28px) | Correct country on back card |
| Monospace (timer, codes) | JetBrains Mono | 600 | 0.875rem | Countdown timers, currency codes, ISO codes |

**Font loading:** Add `Inter` and `JetBrains Mono` via Google Fonts in `index.html`. Both are free, fast, and designed for screen readability.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@600&display=swap" rel="stylesheet">
```

### 3.2 Letter Spacing

- Headings: `tracking-tight` (-0.02em) — aerospace instruments use tight, precise labels
- Uppercase labels (table headers, prompts): `tracking-widest` (0.12em) — departure board effect
- Body: default

---

## 4. Iconography

Replace emoji icons with a consistent SVG icon set. Recommended: **Lucide React** (MIT licence, already popular in the Tailwind ecosystem).

| Mode | Current Emoji | Proposed Lucide Icon |
|---|---|---|
| Flags | 🚩 | `Flag` |
| Map | 🗺️ | `Globe` |
| Capitals | 🏛️ | `Landmark` |
| Cities | 🏙️ | `Building2` |
| Shapes | 🔷 | `Pentagon` / `Hexagon` |
| Currency | 💰 | `Coins` |
| Language | 🗣️ | `MessageSquare` |
| Borders | 🧭 | `Compass` |
| Settings | (gear) | `Settings2` |
| Admin | (link text) | `LayoutDashboard` |

Icons should be 20×20px (cards) and 16×16px (buttons/inline). Stroke width: 1.5px. No filled icons — consistent with the precision/aerospace aesthetic.

---

## 5. Spacing & Layout System

Use an 8px base grid throughout. Key spacing tokens:

| Token | Value | Usage |
|---|---|---|
| `space-1` | 8px | Icon-to-text gap, tight pairs |
| `space-2` | 16px | Component internal padding |
| `space-3` | 24px | Between related elements |
| `space-4` | 32px | Between sections |
| `space-6` | 48px | Page-level vertical rhythm |

**Border radius:**
- Cards: `12px` (down from current `2xl`/16px — slightly more structured, less bubbly)
- Buttons: `8px`
- Inputs: `8px`
- Badges: `4px` — pill badges feel too casual for this theme; rectangular with slight radius is more instrument-panel

---

## 6. Component Redesigns

### 6.1 Home Page

**Current:** Title + emoji, grid of colour-bordered mode cards, admin link.

**Proposed:** Minimal two-section layout beneath the persistent Navbar.

**Section 1 — Page heading strip**
- `--bg-base` background, `px-6 pt-6 pb-3`
- Left: "Quiz Modes" heading (Inter 600, 18px, `--text-primary`)
- No tagline or subtitle (removed — the Navbar already identifies the app)
- No Settings button here — Settings is always accessible via the Navbar gear icon (§6.9)

**Section 2 — Mode grid**
- `--bg-base` background
- 2-column on mobile, 4-column on desktop
- Cards: `--bg-surface`, `1px solid --border`, `border-radius: 12px`
- Card anatomy (top to bottom):
  1. Icon (Lucide, 22×22, mode accent colour)
  2. Mode name (Inter 600, 14px, `--text-primary`)
  3. Description (Inter 400, 12px, `--text-muted`, 2-line max)
  4. Fixed-height spacer (20px) — reserved whitespace, no PB chip displayed
  5. "Start Quiz →" button: full-width, mode accent colour background, white text, 8px radius

**Clicking a card navigates directly to the quiz** — no pre-quiz settings modal. All settings (region, difficulty, game play) are controlled globally via the Navbar Settings icon.

**No Admin/Monitoring links** on the Home page — these are in the Navbar.

---

### 6.2 Quiz Header (all quiz pages)

**Current:** `bg-white border-b`, three-column flex with ← Home, ScoreBar, counter/timer.

**Proposed:** Unified quiz header strip.
- Background: `--bg-surface` with `1px solid --border` — no shadow, border only
- Left: `←` back arrow (Lucide `ArrowLeft`, 16px, `--text-muted`) — no text label
- Centre: Mode name + region badge, e.g. **Map** · `Europe` (small pill badge, `--bg-subtle`, `--text-muted`)
- Right: ScoreBar (redesigned — see §6.3) + SessionTimer or counter
- Height: 52px fixed

---

### 6.3 ScoreBar

**Current:** `✓ 5 ✗ 2 → 1` plain text.

**Proposed:** Three compact chips in a row.
- Each chip: `--bg-subtle` background, `4px` radius, `px-2 py-0.5`
- Correct: success-coloured dot + count
- Wrong: error-coloured dot + count
- Skipped: muted dot + count
- No text labels — coloured dots carry the meaning
- On hover: tooltip expands with label

---

### 6.4 FlipCard

**Current:** `h-64`, white bg, 2xl radius, shadow-md, 0.3s 3D flip.

**Proposed:**
- Height: `h-56` (224px) — slightly shorter, more screen real estate for input
- Background: `--bg-surface`
- Border: `1px solid --border`
- Radius: `12px`
- Flip duration: `0.35s cubic-bezier(0.4, 0, 0.2, 1)` — the current linear ease feels abrupt; ease-in-out is more considered
- Flash overlays redesigned:
  - Correct: `--success` at 15% opacity, `1px solid --success` border flash
  - Wrong: `--error` at 15% opacity, subtle horizontal shake animation (3 keyframes, 0.3s)
  - Close: `--warning` at 15% opacity

**Front card:** Generous vertical centering. The prompt text ("Which country is this flag?") uses all-caps, wide letter-spacing, `--text-muted` — it is a label, not the focus.

**Back card:** Country name at `1.75rem` bold. Flag image (if shown) constrained to 80×54px (3:2, same ratio). Supporting detail (region, subregion) in small muted text below.

---

### 6.5 AnswerInput

**Current:** Flex row: text input + Submit (blue) + Skip (gray).

**Proposed:**
- Full-width text input, 44px tall, `--bg-subtle` background, `1px solid --border`, `8px` radius
- On focus: border becomes `--accent`, subtle `box-shadow: 0 0 0 3px --accent-glow`
- Below input: two ghost text buttons aligned right — **Submit** (accent colour text) and **Skip** (muted text, smaller) — not filled buttons. This reduces visual weight at the bottom of the screen.
- On mobile: keep Submit as a filled button (touch target requirement)
- Placeholder: `--text-muted`, italic, e.g. *"Type a country…"*

---

### 6.6 Global Settings Modal

There is no per-quiz settings modal. Settings are global and apply to all quizzes. The modal is opened from the Navbar gear icon (accessible from any non-quiz page). Clicking "Start Quiz →" on the Home page navigates directly.

**Proposed:** Slide-up sheet (mobile) / centred modal (desktop).

- Backdrop: `rgba(8, 13, 26, 0.65)`
- Card: `--bg-surface`, `16px` radius, `max-h: 92vh`, scrollable
- Sticky header: "Quiz Settings" + close X button
- Three sections (separated by labelled headings):
  1. **Region** — 3×2 grid of pill buttons (All / Africa / Americas / Asia / Europe / Oceania)
  2. **Difficulty** — range slider (1–5, Very Easy → Very Hard) + All-Inclusive / Exact-Only toggle buttons
  3. **Game Play** — Free Play / Countdown / Max Questions pill buttons; sub-options expand below when Countdown or Max Questions is selected
- CTA: Full-width "Save Settings" button in `--accent`; animates to "Saved ✓" on save then closes

---

### 6.7 FeedbackBanner

**Current:** Coloured box with border appears below the card.

**Proposed:** Inline status strip between card and input — 40px tall, no box, just a left-border accent + icon + text.

```
[✓] Correct — France                     ← green left border, success icon
[~] Close — did you mean Germany?  [Yes] [Retype]   ← amber left border
[✗] Not quite.                     [Try again] [Skip]  ← red left border
```

- No background fill — the left border (3px, coloured) provides the semantic signal
- Lighter visual weight means the card and input remain the visual anchors
- Transition: fade-in from opacity 0, 0.15s

---

### 6.8 Session End Screen

**Current:** White card, "Session Complete!" title, score table, two buttons.

**Proposed:** Full-screen result with three zones.

**Zone 1 — Top: score hero**
- Dark background (always dark, like the Home hero) with a large circular accuracy gauge — a single arc drawn in SVG showing accuracy % (0–100). Aerospace altimeter aesthetic.
- Large accuracy % in white, Inter 800, 3rem
- "Session Complete" in small caps, wide tracking, muted

**Zone 2 — Middle: breakdown**
- Three stat chips on one row: ✓ Correct · ✗ Wrong · → Skipped
- Personal best banner (if new): horizontal strip in amber, `"New personal best"` with a `Trophy` icon

**Zone 3 — Bottom: actions**
- "Play Again" — accent filled button
- "Change Mode" — ghost/outline button
- Both full-width on mobile, inline on desktop

---

### 6.9 Countries Data (`/admin`)

There is no Admin hub or sidebar. Countries Data lives directly at `/admin` and Monitoring at `/monitoring`. Both are linked from the Navbar via icon buttons (LHS, `Table2` and `Activity` icons with tooltips).

**Countries Data table:**
- `--bg-surface` card, `--border` borders, row hover `--bg-subtle`, sticky `thead` on `--bg-base`
- Sortable columns (name, capital, continent, sub-region, currency, language, difficulty)
- Search input filters by country name
- Warning border `--warning` on rows with missing data (capital, cities, boundary)
- Difficulty shown as coloured badge (green Very Easy → red Very Hard)
- No Settings tab — settings are in the GlobalSettingsModal (§6.6)

---

### 6.10 Monitoring Page (`/monitoring`)

**Current:** White cards, blue Recharts bars, green terminal feed.

**Proposed:**
- Live feed panel: keep the dark terminal aesthetic — it already works. Refine with `--bg-base` background, `--accent` blinking cursor.
- Stat cards: replace Recharts default colours with mode accent colours — Mode Popularity bar chart uses each mode's own accent colour per bar rather than a uniform blue.
- Grid layout: unchanged
- "Hardest Countries" table: same redesign as Countries Data table

---

### 6.11 Map Quiz

**Current:** Full-screen D3 SVG, water `#dbeafe`, countries `#e2e8f0`, highlight green.

**Proposed:**
- **Light mode:** Water `#C8D8EC` (steel blue-grey, more cartographic), Countries `#E4E9F0`, Highlighted: `#60A5FA` fill + `#1B3FE4` stroke (accent blue — consistent with the redesign accent)
- **Dark mode:** Water `#0A1628`, Countries `#1A2744`, Highlighted: `#4F70FF` fill + `#6B87FF` stroke
- Popout inset: `--bg-surface` background, `--border` border — no more hard-coded white
- Input bar at bottom: same redesigned AnswerInput (§6.5)

---

### 6.12 Shape Quiz

**Current:** Shape fill `#0f766e` (dark teal), white stroke, drop shadow.

**Proposed:**
- **Light mode:** Fill `#1B3FE4` (redesign accent blue) — makes shapes feel like they belong to the same design system
- **Dark mode:** Fill `#4F70FF`
- Stroke: white (light mode), `#0A1628` (dark mode)
- Drop shadow preserved — it adds good depth
- Card background: `--bg-surface`

---

### 6.13 Session/Question Timers

**Current:** MM:SS text + progress bar (SessionTimer), thin bar only (QuestionTimer).

**Proposed:**
- **SessionTimer:** Replace text + bar with a single radial progress ring (SVG circle, 40×40px). Number in the centre in `JetBrains Mono`. Colour transitions green → amber → red. Less visual clutter than text + bar stacked.
- **QuestionTimer:** Unchanged in form (thin bar), but increase height to `3px` and use the mode accent colour rather than teal.

---

## 7. Dark Mode Implementation

### 7.1 Strategy

Use Tailwind's `class`-based dark mode strategy (`darkMode: 'class'` in `tailwind.config.js`). A `dark` class on `<html>` toggles dark mode. Persist preference in `localStorage` as `gq_theme: 'light' | 'dark' | 'system'`.

### 7.2 Theme Toggle

The theme toggle is in the Navbar (persistent across all non-quiz pages), RHS alongside the gear icon. Lucide `Sun` / `Moon` icons toggle with a 0.2s rotation animation.

Use Lucide `Sun` / `Moon` icons. Toggle animates between them with a 0.2s rotation.

### 7.3 CSS Variables Approach

Define all colour tokens as CSS custom properties in `index.css`:

```css
:root {
  --bg-base: #F4F6FB;
  --bg-surface: #FFFFFF;
  --bg-subtle: #EDF0F7;
  --border: #D8DEEB;
  --text-primary: #0D1526;
  --text-secondary: #4A5568;
  --text-muted: #8896A8;
  --accent: #1B3FE4;
  --accent-hover: #1432C0;
  --accent-glow: rgba(27, 63, 228, 0.12);
  --success: #059669;
  --warning: #D97706;
  --error: #DC2626;
}

.dark {
  --bg-base: #080D1A;
  --bg-surface: #0F1829;
  --bg-subtle: #162136;
  --border: #1E2E47;
  --text-primary: #E8EDF5;
  --text-secondary: #8EA4BF;
  --text-muted: #4D637A;
  --accent: #4F70FF;
  --accent-hover: #6B87FF;
  --accent-glow: rgba(79, 112, 255, 0.15);
  --success: #10B981;
  --warning: #F59E0B;
  --error: #F87171;
}
```

Then reference tokens in Tailwind via `tailwind.config.js` `extend.colors`:

```js
colors: {
  base: 'var(--bg-base)',
  surface: 'var(--bg-surface)',
  subtle: 'var(--bg-subtle)',
  border: 'var(--border)',
  accent: 'var(--accent)',
  // etc.
}
```

This allows Tailwind classes like `bg-surface`, `text-accent`, `border-border`.

### 7.4 Components Needing Dark-Specific Treatment

| Component | Light | Dark | Notes |
|---|---|---|---|
| Home hero | Always dark | Always dark | Hero is always dark — creates continuity |
| Quiz header | `--bg-surface` | `--bg-surface` | Token handles it |
| FlipCard | White | `#0F1829` | Token handles it |
| D3 World Map | Steel blue water | Night-sky water | Hardcoded hex — needs `useEffect` recolour on theme change |
| D3 Shape SVG | Blue fill | Electric blue fill | Same |
| Recharts charts | Default blue | Match `--accent` | Pass `fill="var(--accent)"` |
| Live feed terminal | Always dark | Always dark | Terminal is always dark — already correct |
| FeedbackBanner | Coloured fills | Border-only | Already proposed border-only |

---

## 8. Animation & Motion

**Principle:** Motion should feel purposeful — confirming actions and guiding attention — not decorative.

| Interaction | Current | Proposed |
|---|---|---|
| Card flip | `0.3s linear` | `0.35s cubic-bezier(0.4,0,0.2,1)` |
| Correct flash | Green bg flash | Green tint + checkmark scale-in |
| Wrong flash | Red double-pulse | Horizontal shake (3 steps, 0.3s) |
| Page transition | None | Fade + 4px upward translate, 0.15s |
| Mode card hover | None | `translateY(-2px)` + shadow lift, 0.15s |
| Settings modal open | None | Scale from 0.96 + fade, 0.2s |
| Timer urgency pulse | `animate-pulse` Tailwind | Custom pulse: scale 1 → 1.05 → 1, 0.8s infinite |
| Score chip update | None | Number count-up animation |

**Reduced motion:** All animations wrapped in `@media (prefers-reduced-motion: reduce) { ... }` — either disabled or replaced with instant transitions.

---

## 9. Page & Route Naming

| Current | Proposed | Reason |
|---|---|---|
| GeoQuiz (title) | **GeoQuiz** | Keep — clean and direct |
| "Admin Centre" | **Countries Data** | No admin concept — page shows the countries data table directly |
| "Session Complete!" | **Results** | Clear and direct — matches what the user expects after a quiz |
| "Play →" | **Start Quiz** | Explicit action, no ambiguity |
| "Skip" | **Skip** | Keep — universally understood |
| "Change Mode" | **All Quizzes** | Navigational — takes user back to the mode picker |
| "Game Play Mode" (settings label) | **Quiz Settings** | Clearer — "Game Play Mode" is an odd compound noun |
| `/admin` route | `/admin` (keep) | Route stays the same — naming is UI only |

---

## 12. Accessibility

- All colour tokens maintain **WCAG AA contrast** (4.5:1 for body text, 3:1 for large text/UI components)
- Accent blue `#1B3FE4` on white: 7.2:1 ✓
- Dark mode accent `#4F70FF` on `#080D1A`: 6.8:1 ✓
- Focus states: `box-shadow: 0 0 0 3px var(--accent-glow)` on all interactive elements — visible in both modes
- Icons supplemented with `aria-label` or adjacent text — no icon-only interactive elements
- Reduced motion media query applied to all animations (§8)
- Flip card: `aria-live="polite"` on the back panel so screen readers announce the revealed answer

---

## 11. Theme Management — Technical Guidance

### 11.1 Switching Themes Without Side Effects

The core contract is: **theme is purely a CSS concern**. No quiz state, session timers, scores, or routing logic should ever read or write the theme. If this boundary is maintained, switching theme at any point — mid-quiz, mid-session, on the Results screen — has zero functional impact.

**Implementation rule:** The only things that should respond to a theme change are:
- The `dark` class on `<html>`
- CSS custom properties (which update instantly via cascade)
- The two D3 visualisations (Map and Shapes — see §11.3 below)

Nothing else in the app needs to know about theme.

---

### 11.2 Theme Context Pattern

Wrap the app in a single `ThemeContext` at the root (`App.jsx`). This is the only place theme state lives.

```jsx
// ThemeContext.jsx
const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('gq_theme');
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('gq_theme', theme);
  }, [theme]);

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

**Why `useEffect` on `[theme]`:** Keeps DOM manipulation out of render. The `classList.toggle` is a side effect, not part of React's virtual DOM — it must not run during SSR or test renders.

**Why `localStorage` initialiser in `useState`:** Reads once on mount. Avoids flash-of-wrong-theme (FOWT) on page load — the correct class is set before the first paint.

**localStorage key:** `gq_theme` — add to the existing keys documented in SPEC.md.

---

### 11.3 D3 Visualisations (Map + Shapes)

D3 renders to a `<canvas>` or directly mutates SVG DOM — it does not go through React's render cycle. CSS custom properties do not automatically affect D3-drawn colours. These two components need explicit handling.

**Pattern:** Subscribe to the `theme` value from context and re-render the D3 scene when it changes.

```jsx
const { theme } = useTheme();

const colors = useMemo(() => theme === 'dark'
  ? { water: '#0A1628', country: '#1A2744', highlight: '#4F70FF' }
  : { water: '#C8D8EC', country: '#E4E9F0', highlight: '#1B3FE4' },
  [theme]
);

useEffect(() => {
  // re-draw D3 paths with new colors
  svg.selectAll('.country').attr('fill', colors.country);
  svg.select('.water').attr('fill', colors.water);
}, [colors]);
```

**Key point:** This `useEffect` only touches colours. It does not re-initialise the projection, re-bind data, or reset the quiz state — so an in-progress Map quiz survives a theme switch with no interruption.

---

### 11.4 Preventing Flash of Wrong Theme (FOWT)

Without mitigation, the page briefly renders in light mode before JavaScript applies the `dark` class — visible as a white flash.

**Fix:** Add an inline `<script>` to `index.html` **before** any stylesheet:

```html
<script>
  (function() {
    var t = localStorage.getItem('gq_theme');
    if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  })();
</script>
```

This runs synchronously before the browser paints. The `dark` class is present from the first render — no flash.

---

### 11.5 Session State Isolation

Current session state lives in React component state within each quiz page (queue, current index, score, timer refs). None of this is stored in a context or global store, which is correct — it means theme context has no overlap with quiz state.

**Verify before implementing:** Check that no quiz page currently reads or writes `localStorage` inside a render function or in a way that could conflict with the new `gq_theme` key. Existing keys (`pb_*`, `gq_difficulty_*`, `gq_gp_*`) are all prefixed differently — no collision risk.

---

### 11.6 Tailwind `darkMode: 'class'` Configuration

```js
// tailwind.config.js
export default {
  darkMode: 'class',   // ← required; default is 'media' which cannot be user-toggled
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base:    'var(--bg-base)',
        surface: 'var(--bg-surface)',
        subtle:  'var(--bg-subtle)',
        border:  'var(--border)',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted:   'var(--text-muted)',
        accent:  'var(--accent)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        error:   'var(--error)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
};
```

With `darkMode: 'class'`, Tailwind's `dark:` variant responds to the `dark` class on `<html>` — not the OS preference. This is what allows user-toggled switching. The CSS variable approach means you rarely need `dark:` prefixes in component classes at all — the tokens switch automatically.

---

### 11.7 Switching Theme at Runtime — What Breaks, What Doesn't

| Concern | Safe? | Notes |
|---|---|---|
| Quiz score / progress | ✓ Safe | Lives in React state, untouched |
| Countdown timer / question timer | ✓ Safe | `useRef`-based intervals, not affected by re-render |
| Personal bests in `localStorage` | ✓ Safe | Separate keys, no conflict |
| Difficulty / gameplay settings | ✓ Safe | Separate keys, no conflict |
| D3 map colours | ⚠ Needs handler | Requires explicit `useEffect` on theme change (§11.3) |
| D3 shape colours | ⚠ Needs handler | Same pattern as map |
| FlipCard mid-flip | ✓ Safe | CSS transition is not interrupted by class toggle on `<html>` |
| Open Settings modal | ✓ Safe | Background class toggle has no impact on modal state |
| FeedbackBanner visible | ✓ Safe | CSS custom property cascade is instant |

---

## 12. Accessibility

- All colour tokens maintain **WCAG AA contrast** (4.5:1 for body text, 3:1 for large text/UI components)
- Accent blue `#1B3FE4` on white: 7.2:1 ✓
- Dark mode accent `#4F70FF` on `#080D1A`: 6.8:1 ✓
- Focus states: `box-shadow: 0 0 0 3px var(--accent-glow)` on all interactive elements — visible in both modes
- Icons supplemented with `aria-label` or adjacent text — no icon-only interactive elements
- Reduced motion media query applied to all animations (§8)
- Flip card: `aria-live="polite"` on the back panel so screen readers announce the revealed answer

---

## 13. Implementation Notes

### Priority Order (suggested)

1. **CSS variables + dark mode toggle** — foundational, unlocks all other changes
2. **Typography** — Inter + JetBrains Mono, one `index.html` change
3. **Home page redesign** — highest user-facing impact
4. **FlipCard + AnswerInput + FeedbackBanner** — affects all 8 quiz modes at once
5. **Quiz header + ScoreBar** — shared, high leverage
6. **Results screen**
7. **Map + Shape colour updates**
8. **Countries Data table styling** (at `/admin`)
9. **Monitoring chart re-skin**
10. **Icon swap** (Lucide) — can be done incrementally

### What Not to Change

- All routing logic
- All data fetching and API contracts
- All localStorage keys and quiz state logic
- Difficulty settings, gameplay settings — only their form controls are restyled
- D3 projection logic (only colours change)
- Fuzzy matching thresholds
- Quiz queue and scoring mechanics
