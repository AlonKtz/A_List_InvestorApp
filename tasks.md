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

- [ ] **T23** — Design inspiration: choose color palette / visual direction
- [ ] **T24** — Implement final design

---

## Completion Gate

All tasks checked + all commits pushed + Definition of Done verified = project complete.
