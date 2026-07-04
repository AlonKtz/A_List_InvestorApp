# tasks.md — The A List: Build Checklist

Each task = one Git commit. Commit message format: `T##: <what changed and why>`

---

## Phase 1 — Project Foundation

- [x] **T01** — Write `PRD.md`: goals, scope, user stories, data model, RLS model, DoD
- [x] **T02** — Write `tasks.md`: ordered build checklist, one task per commit
- [x] **T03** — Write `README.md`: what it is, run instructions, Appwrite setup, known limits

---

## Phase 2 — Appwrite Setup

- [x] **T04** — Create Appwrite project + database + `trades` collection with all attributes + set collection permissions
- [x] **T05** — Create `config.js` with Appwrite endpoint, project ID, database ID, collection ID (gitignored); add `config.example.js` as the committed template

---

## Phase 3 — HTML Skeleton & Auth UI

- [x] **T06** — Build `index.html`: Tailwind CDN, tab layout shell (Auth screen / Dashboard / Log Trade)
- [x] **T07** — Auth forms: sign-up and login UI, logout button in nav
- [x] **T08** — Auth logic: Appwrite auth wiring (signUp, signIn, signOut), session check on load

---

## Phase 4 — Trade Logging

- [x] **T09** — Trade log form: ticker + sector auto-fill, buy/sell price, quantity, order type, date picker
- [x] **T10** — Trade insert logic: validate fields, insert to Appwrite with per-user document permissions
- [x] **T11** — Trade history table: fetch all trades for current user, render newest-first with delete button

---

## Phase 5 — Behavioral Metrics

- [x] **T12** — Composure Rating: % of Day Trades that lost money, shown as 0–100 score with color bar
- [x] **T13** — FOMO Tax: total $ lost on trades entered same day as a prior winner
- [x] **T14** — Tilt Multiplier: avg loss size after a prior loss vs overall avg loss

---

## Phase 6 — Trade Autopsy Timeline

- [x] **T15** — Behavioral tagging: assign each trade PANIC_EXIT, EUPHORIA_TRADE, REVENGE_TRADE, TUNNEL_VISION, or CLEAN
- [x] **T16** — Autopsy timeline: horizontal scrollable dots, colored by tag, hover tooltip with stock + tag + P&L

---

## Phase 7 — Charts

- [x] **T17** — Sector bar chart: trade count grouped by sector
- [x] **T18** — Cumulative P&L line chart + Behavioral Breakdown pie chart (tag distribution)

---

## Phase 8 — Polish & Edge Cases

- [x] **T19** — Empty states + metric explanations on each stat card
- [x] **T20** — Error handling: auth errors, insert errors, network errors with retry button
- [x] **T21** — Loading states: spinner on dashboard load, disabled buttons on auth and trade submit
- [x] **T22** — Final tasks.md + README update, verified no secrets committed

---

## Phase 9 — Design

- [x] **T23** — Design inspiration: choose color palette / visual direction (liquid-glass system)
- [x] **T24** — Implement final design: `design.css` token system, aurora backdrop, glass cards

---

## Phase 10 — Live Market Data & Sectors

- [x] **T25** — Finnhub live price fetch: "Fetch Current Price" button on the log-trade form
- [x] **T26** — Top Sectors panel: split the autopsy row, right half shows top 2 sectors by P&L
- [x] **T27** — Add Date column to the trade history table
- [x] **T28** — Expand stock universe: 2000+ tickers in `sectors.js` + Finnhub profile fallback for unknown tickers

---

## Phase 11 — Trade Autopsy Redesign

- [x] **T29** — Trade autopsy: flex-wrap dots to fill the card space (interim)
- [x] **T30** — Replace autopsy timeline with Best/Worst Trade + Recent 3 Trades panels

---

## Phase 12 — Demo Account & Deployment

- [x] **T31** — Add "Demo login" button + `seed-jack.html` to create and populate Jack's demo account (17 trades)
- [x] **T32** — Commit `config.js` so GitHub Pages can serve credentials (client-side public values)
- [x] **T33** — Simplify demo button text → "Demo login: Jack, Trader"

---

## Phase 13 — Documentation Sync

- [x] **T34** — Sync `PRD.md` with the shipped app
- [x] **T35** — Sync `tasks.md` and `README.md` with the shipped app

---

## Phase 14 — Demo Polish & Repo Hygiene

- [x] **T36** — Redesign demo user "Bearded Jack, Amateur Investor": 16-trade portfolio engineered to exercise every dashboard feature; seeder wipes old trades on re-run
- [x] **T37** — Gitignore personal Hebrew speech doc (presentation material, not a deliverable)
- [x] **T38** — Gitignore design-system handoff folder (source reference, not part of the app)

---

## Phase 15 — Security Hardening

- [x] **T39** — `esc()` HTML-escape on all user/API strings rendered via innerHTML (XSS guard); signup password policy (letters + numbers only); rotate demo password with seeder migration
- [x] **T40** — Make logout resilient — always reload to login screen even if `deleteSession` fails (guest)

---

## Phase 16 — Final Documentation Pass

- [x] **T41** — Fix README drift: remove `config.js` contradiction, update demo to Bearded Jack + 16 trades, mark Appwrite setup optional, document password policy
- [x] **T42** — Fix PRD stale demo-name references + add missing tasks T36–T41 to `tasks.md`

---

## Phase 17 — Multi-View & Watchlist

- [x] **T43** — Hash-based routing (`#/dashboard`, `#/log`) — real shareable URLs per view
- [x] **T44** — Watchlist feature: new `#/watchlist` view, Appwrite `watchlist` collection (per-user perms), live Finnhub quotes + refresh, sector auto-fill, "Log trade" prefill shortcut
- [x] **T45** — Sync `PRD.md`, `README.md`, `tasks.md` for routing + watchlist (collection, user story, setup step, config field)
- [x] **T46** — Seed Bearded Jack a 6-ticker watchlist; seeder wipes old watchlist on re-run, skips gracefully if collection missing
- [x] **T47** — Show "Last refreshed: <time>" next to the Watchlist refresh button after prices update
- [x] **T48** — Note the demo watchlist in `PRD.md` + `README.md`

---

## Phase 18 — Nav Polish & Richer Demo

- [x] **T49** — Reorder nav to workflow order (Dashboard / Watchlist / +Log Trade / Logout); make +Log Trade a filled CTA, soften active-tab style
- [x] **T50** — Color-code nav: Watchlist active pill in orange, Logout persistently red
- [x] **T51** — Expand Bearded Jack to a 26-trade portfolio engineered to populate the metrics (15/26 demonstrate a Composure / FOMO / Tilt relation)
- [x] **T52** — Update `PRD.md` + `README.md` to reflect the 26-trade demo portfolio

---

## Completion Gate

All tasks checked + all commits pushed + Definition of Done verified = project complete.
