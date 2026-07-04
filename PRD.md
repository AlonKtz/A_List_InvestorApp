# PRD — The A List: Behavioral Trading Journal

## Problem & Goal

Beginner retail traders lose money primarily because of psychology, not math. FOMO entries, panic exits, and revenge trades after losses are the real culprits — but most journals only show P&L. The A List turns your trade history into a behavioral report card, presented as sports-analytics-style stats, so you can see and name the patterns that are costing you money.

## Target User

Beginner-to-intermediate retail trader (18–35). Has a brokerage account, is losing money or breaking even, suspects "emotions" are the problem but has no data to confirm it. Motivated by gamification — responds to scores, ratings, and visual rankings more than spreadsheets.

---

## Scope

### In Scope (MVP)
- User accounts: sign-up, login, logout via **Appwrite Auth** (email/password)
- **Demo account** — a one-click "Demo login: Bearded Jack, Amateur Investor" button that signs into a pre-seeded account so reviewers can explore the app with real data instantly
- Session-gated dashboard — unauthenticated users see only the login/signup screen
- Trade log form: Stock ticker, Sector (auto-filled), Buy Price, Sell Price, Quantity, Order Type, Trade Date
- **Ticker → sector auto-fill** from a bundled 2000+ ticker map (`sectors.js`), with a Finnhub profile API fallback for unknown tickers
- **"Fetch Current Price"** button — pulls the live quote for the entered ticker from the Finnhub API
- Trade history table: all trades for the logged-in user, newest first, with per-row delete
- **3 Behavioral Metrics** (computed client-side from raw trade data):
  1. **Composure Rating** — `100 − panicRate`, where panicRate is the % of *Day Trades* that lost money. High score = you hold your nerve.
  2. **FOMO Tax** — total dollar loss on trades entered the *same day as a prior winning trade*
  3. **Tilt Multiplier** — average loss size on post-loss trades vs. overall average loss size (above 1.2× = betting bigger when on tilt)
- Sports-style stat cards rendering each metric with a rating/grade and progress bar
- **Behavioral tagging** — every trade auto-tagged with one of: `PANIC_EXIT`, `EUPHORIA_TRADE`, `REVENGE_TRADE`, `TUNNEL_VISION`, `CLEAN`
- **Trade Autopsy panels** — Best & Worst Trade, Recent 3 Trades, and Top 2 Sectors by P&L
- Charts (Chart.js): Trades by Sector (bar), Cumulative P&L (line), Behavioral Breakdown (pie, tag distribution)
- **Liquid-glass design system** — aurora backdrop, translucent glass cards, custom CSS token system
- **Watchlist** (`#/watchlist`) — a separate view to track tickers you *don't* own yet, with live Finnhub quotes (price + day %), add/remove, and a one-click **"Log trade"** shortcut that jumps to the trade form pre-filled with the ticker and its live price
- **Hash-based routing** — real per-view URLs (`#/dashboard`, `#/log`, `#/watchlist`) that survive a refresh and can be bookmarked/shared
- Deployed live on **GitHub Pages**

### Out of Scope
- Editing trades after creation (delete is supported; in-place edit is not)
- Brokerage integrations / automated trade import
- Historical intraday price backfill (free API tiers only provide the *current* quote)
- Social features, sharing, leaderboards
- Email confirmation / true 2FA flow (plain email + password only)
- Server-side routing / separate HTML files (views are hash-routed client-side within one `index.html`)
- Notes/journal text field per trade

---

## User Stories

| ID | Story |
|----|-------|
| U01 | As a new user, I can sign up with email + password so I have a personal account. |
| U02 | As a returning user, I can log in and see only my own trades. |
| U03 | As a reviewer, I can click "Demo login: Bearded Jack, Amateur Investor" to instantly explore a pre-populated account. |
| U04 | As a logged-in user, I can log a trade (ticker, sector, prices, quantity, order type, date) so it persists to the database. |
| U05 | As a logged-in user, the sector auto-fills from the ticker, and I can fetch the live price with one click. |
| U06 | As a logged-in user, I can view all my past trades in a table, newest first, and delete any of them. |
| U07 | As a logged-in user, I can see my 3 behavioral metric scores on sports-style stat cards. |
| U08 | As a logged-in user, I can see my best/worst trade, recent trades, and most profitable sectors. |
| U09 | As a logged-in user, I can view sector, P&L, and behavioral-breakdown charts to spot patterns. |
| U10 | As a logged-in user, I can log out and have my session terminated. |
| U11 | As a logged-in user, I can keep a watchlist of tickers with live prices, and jump straight to logging a trade from any of them. |

---

## Tech Choices

| Concern | Choice | Reason |
|---------|--------|--------|
| UI | HTML5 + Tailwind CSS (CDN) + custom `design.css` | No build step; rapid styling + bespoke glass design system |
| Logic | Vanilla JS (plain `<script>` tags, no modules/bundler) | No framework or build overhead; fits the no-npm constraint |
| Routing | Hash-based client-side router (`hashchange`) | Real per-view URLs with no build step or server config |
| Charts | Chart.js (CDN) | Simple, well-documented; enough for bar + line + pie |
| Backend / DB | Appwrite Cloud (Database + Auth) | Real accounts, document-level permissions, hosted — no backend code to write |
| Appwrite client | IIFE CDN build (`appwrite/dist/iife/sdk.js`) | Loads as a plain global script — no ES module setup needed |
| Market data | Finnhub API (`/quote`, `/stock/profile2`) | Free real-time quote + sector profile lookup |
| Config | `config.js` with plain `const` declarations | Holds endpoint + IDs + Finnhub key; loaded as a global before `app.js` |
| Hosting | GitHub Pages | Free static hosting straight from the repo |

> **Note on config & secrets:** For a purely client-side app, the Appwrite endpoint, project/database/collection IDs are sent with every browser request and are therefore public by nature. Access is protected by the Appwrite **platform allowlist** (only the deployed origin may call the API) plus **document-level permissions** — not by hiding these values. `config.js` is committed so GitHub Pages can serve it; the Finnhub key is a free, client-exposed key.

---

## Data Model

### Appwrite Collection: `trades`

Created in the Appwrite console under a Database. Attributes are defined per-field in the UI (no SQL DDL).

| Attribute | Type | Required |
|-----------|------|----------|
| `stock` | String (50) | Yes |
| `sector` | String (50) | Yes |
| `entry_price` | Float | Yes |
| `exit_price` | Float | Yes |
| `entry_time` | String (ISO 8601) | Yes |
| `exit_time` | String (ISO 8601) | Yes |
| `order_category` | String (30) | Yes |
| `quantity` | Integer | Yes |

**Auto-provided by Appwrite (no manual setup):**
- `$id` — unique document ID
- `$createdAt` — creation timestamp (used as the chronological sort key)
- `$permissions` — document-level access control

**Order categories:** Day Trade · Swing Trade · Long Position · Short Sell

**Derived fields (computed in JS, not stored):**
- `p_and_l` — `(exit_price − entry_price) × quantity`, **inverted for Short Sell** (profit when price falls)
- `behavioral_tag` — assigned per trade at render time from the tagging logic
- Metric aggregates (Composure, FOMO Tax, Tilt) — computed across the user's trade set

**Sectors:** the 11 GICS sectors + ETF, mapped from ticker via `sectors.js` (2000+ tickers), with a Finnhub profile fallback for anything not in the map.

### Appwrite Collection: `watchlist`

A second collection for tracked tickers (no trade data). Same per-user document-permission model as `trades`.

| Attribute | Type | Required |
|-----------|------|----------|
| `symbol` | String (10) | Yes |
| `sector` | String (50) | Yes |

Live price and day-change % are **not stored** — they're fetched on demand from the Finnhub `/quote` endpoint each time the view loads or the user hits Refresh.

---

## Permission Model

Appwrite uses **document-level permissions** instead of table-level RLS. When a trade is inserted, it is created with permissions scoped to the authenticated user's ID:

```js
const { ID, Permission, Role } = Appwrite;

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

Appwrite enforces access at the document level — a user querying the collection only receives documents they own. No cross-user reads or writes are possible without an explicit permission grant.

---

## Definition of Done

- [x] A user can sign up, log in, and log out without errors
- [x] A reviewer can use the demo login to explore a populated account
- [x] A logged-in user can submit a trade and see it appear in the history table
- [x] A logged-in user can delete a trade
- [x] All three behavioral metrics display correct values based on the user's trade data
- [x] Every trade is assigned a correct behavioral tag
- [x] All three Chart.js charts render with real data
- [x] A second user account cannot see the first user's trades (document permissions verified)
- [x] The app is deployed and reachable on GitHub Pages
- [x] All tasks in `tasks.md` are checked off
- [x] Commit history shows one commit per task (or a group of specific related tasks) with meaningful messages
