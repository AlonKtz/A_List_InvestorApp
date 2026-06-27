# tasks.md — The A List: Build Checklist

Each task = one Git commit. Commit message format: `T##: <what changed and why>`

---

## Phase 1 — Project Foundation

- [x] **T01** — Write `PRD.md`: goals, scope, user stories, data model, RLS model, DoD
- [x] **T02** — Write `tasks.md`: ordered build checklist, one task per commit
- [x] **T03** — Write `README.md`: what it is, run instructions, Supabase setup DDL + RLS, known limits

---

## Phase 2 — Appwrite Setup

- [ ] **T04** — Create Appwrite project + database + `trades` collection with all attributes + set collection permissions (documented in README)
- [ ] **T05** — Create `config.js` with Appwrite endpoint, project ID, database ID, collection ID exports (gitignored); add `config.example.js` as the committed template

---

## Phase 3 — HTML Skeleton & Auth UI

- [ ] **T06** — Build `index.html`: Tailwind CDN, tab layout shell (Auth screen / Dashboard / Log Trade), placeholder sections
- [ ] **T07** — Auth forms: sign-up and login UI in the auth screen, logout button in nav
- [ ] **T08** — Auth logic: wire Supabase auth (signUp, signInWithPassword, signOut), session check on load, show/hide dashboard vs auth screen

---

## Phase 4 — Trade Logging

- [ ] **T09** — Trade log form: HTML form fields (stock, sector dropdown, entry/exit price, entry/exit time)
- [ ] **T10** — Trade insert logic: on submit, validate fields, insert row to Supabase `trades` table with `user_id = auth.uid()`
- [ ] **T11** — Trade history table: fetch all trades for current user, render as a table newest-first

---

## Phase 5 — Behavioral Metrics

- [ ] **T12** — Compute Panic Exit Rate: identify bottom-quartile hold durations, count loss trades within that group, render stat card
- [ ] **T13** — Compute FOMO Tax: flag trades entered within 30 min of a prior winner, sum their P&L, render stat card
- [ ] **T14** — Compute Tilt Multiplier: compare avg loss size on post-loss-window trades vs overall avg, render stat card

---

## Phase 6 — Trade Autopsy Timeline

- [ ] **T15** — Behavioral tagging logic: assign each trade one of `PANIC_EXIT`, `EUPHORIA_TRADE`, `REVENGE_TRADE`, `TUNNEL_VISION` (or `CLEAN` if none apply)
- [ ] **T16** — Render Autopsy timeline: horizontal scrollable bar, one dot per trade (colored by P&L), tooltip on hover showing stock + tag + P&L

---

## Phase 7 — Charts

- [ ] **T17** — Sector bar chart: Chart.js bar chart showing trade count grouped by sector
- [ ] **T18** — Cumulative P&L line chart: Chart.js line chart of running P&L total over time (by entry_time)

---

## Phase 8 — Polish & Edge Cases

- [ ] **T19** — Empty states: message when no trades logged yet (dashboard, table, timeline, charts)
- [ ] **T20** — Error handling: auth errors (wrong password, duplicate email), insert errors, network errors shown to user
- [ ] **T21** — Loading states: spinner or disabled button while async calls are in flight
- [ ] **T22** — Final README update: confirm all setup steps are accurate, add known limits, verify no secrets committed

## Phase 9 - Design

- [ ] **T23** - inspiration: get a set of colors or a known website design to be similar to.
- [ ] **T24** - system design: implement the design using claude design.

---

## Completion Gate

All tasks checked + all commits pushed + Definition of Done verified = project complete.
