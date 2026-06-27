# PRD — The A List: Behavioral Trading Journal

## Problem & Goal

Beginner retail traders lose money primarily because of psychology, not math. FOMO entries, panic exits, and revenge trades after losses are the real culprits — but most journals only show P&L. The A List turns your trade history into a behavioral report card, presented as sports-analytics-style stats, so you can see and name the patterns that are costing you money.

## Target User

Beginner-to-intermediate retail trader (18–35). Has a brokerage account, is losing money or breaking even, suspects "emotions" are the problem but has no data to confirm it. Motivated by gamification — responds to scores, ratings, and visual rankings more than spreadsheets.

---

## Scope

### In Scope (MVP)
- User accounts: sign-up, login, logout via Supabase Auth (email/password)
- Session-gated dashboard — unauthenticated users see only the login/signup screen
- Trade log form: Stock ticker, Sector (dropdown), Entry Price, Exit Price, Entry Time, Exit Time
- Trade history table: all trades for the logged-in user, newest first
- **3 Behavioral Metrics** (computed client-side from raw trade data):
  1. **Panic Exit Rate** — % of trades exited in the fastest quartile of hold times with a loss
  2. **FOMO Tax** — total dollar loss on trades entered within 30 min of a prior winning trade
  3. **Tilt Multiplier** — average loss size on post-loss trades vs. overall average loss size
- Sports-style stat cards rendering each metric with a rating/grade
- **Trade Autopsy Timeline** — horizontal timeline of all trades, each dot auto-tagged with a behavioral label (`PANIC_EXIT`, `EUPHORIA_TRADE`, `REVENGE_TRADE`, `TUNNEL_VISION`)
- Sector bar chart (Chart.js) — trade count per sector
- P&L line chart (Chart.js) — cumulative P&L over time

### Out of Scope
- Edit or delete trades (add-only; simplifies RLS and UI)
- Real-time price data or brokerage integrations
- Social features, sharing, leaderboards
- Email confirmation flow (disabled in Supabase dashboard to eliminate redirect/delivery debugging)
- Mobile-first polish (Tailwind responsive classes used where free, but not a priority)
- Multi-page routing (single HTML file, tab-based switching)
- Notes/journal text field per trade

---

## User Stories

| ID | Story |
|----|-------|
| U01 | As a new user, I can sign up with email + password + 4 digits code (manual 2FA) so I have a personal account. |
| U02 | As a returning user, I can log in and see only my own trades. |
| U03 | As a logged-in user, I can log a trade (ticker, sector, prices, times) so it persists to the database. |
| U04 | As a logged-in user, I can view all my past trades in a table, newest first. |
| U05 | As a logged-in user, I can see my 3 behavioral metric scores on sports-style stat cards. |
| U06 | As a logged-in user, I can view my Trade Autopsy timeline and see which trades were behaviorally flagged. |
| U07 | As a logged-in user, I can view sector and P&L charts to spot concentration and trend patterns. |
| U08 | As a logged-in user, I can log out and have my session terminated. |

---

## Tech Choices

| Concern | Choice | Reason |
|---------|--------|--------|
| UI | HTML5 + Tailwind CSS (CDN) | No build step; rapid styling |
| Logic | Vanilla JS (ES modules) | No framework overhead; fits the no-bundler constraint |
| Charts | Chart.js (CDN) | Simple, well-documented, enough for bar + line |
| Backend / DB | Appwrite Cloud (Database + Auth) | Real accounts, document permissions, hosted — no backend code to write |
| Appwrite client | ESM CDN (`cdn.jsdelivr.net/npm/appwrite/dist/esm/sdk.mjs`) | No npm; works in browser directly |
| Config | `config.js` with exported constants | Keeps project IDs out of committed HTML; documented in README |

---

## Data Model

### Appwrite Collection: `trades`

Created in the Appwrite dashboard under a Database. No SQL DDL — attributes are defined per-field in the UI or via the Appwrite console.

| Attribute | Type | Required |
|-----------|------|----------|
| `stock` | String (50) | Yes |
| `sector` | String (50) | Yes |
| `entry_price` | Float | Yes |
| `exit_price` | Float | Yes |
| `entry_time` | String (ISO 8601) | Yes |
| `exit_time` | String (ISO 8601) | Yes |

**Auto-provided by Appwrite (no manual setup):**
- `$id` — unique document ID
- `$createdAt` — creation timestamp
- `$permissions` — document-level access control

**Derived fields (computed in JS, not stored):**
- `p_and_l = exit_price − entry_price`
- `hold_minutes = (new Date(exit_time) − new Date(entry_time)) / 60000`
- `behavioral_tag` — assigned per trade at render time using the autopsy logic

**Sectors (dropdown options):** Technology · Healthcare · Finance · Energy · Consumer · Industrials · Real Estate · Other

---

## Permission Model

Appwrite uses **document-level permissions** instead of table-level RLS. When a trade is inserted, it is created with permissions scoped to the authenticated user's ID:

```js
import { Permission, Role } from '...appwrite sdk...';

databases.createDocument(
  DATABASE_ID,
  COLLECTION_ID,
  ID.unique(),
  tradeData,
  [
    Permission.read(Role.user(userId)),
    Permission.write(Role.user(userId))
  ]
);
```

This means Appwrite enforces access at the document level — a user querying the collection only receives documents they own. No cross-user reads or writes are possible without an explicit permission grant.

---

## Definition of Done

- [ ] A user can sign up, log in, and log out without errors
- [ ] A logged-in user can submit a trade and see it appear in the history table
- [ ] All three behavioral metrics display correct values based on the user's trade data
- [ ] The Trade Autopsy timeline renders at least one correctly-tagged trade
- [ ] Both Chart.js charts render with real data
- [ ] A second user account cannot see the first user's trades (RLS verified manually)
- [ ] No Supabase URL or anon key is committed to the repository
- [ ] All tasks in `tasks.md` are checked off
- [ ] Commit history shows one commit per task or a group of specific related tasks with a meaningful message
