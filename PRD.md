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
| U01 | As a new user, I can sign up with email + password so I have a personal account. |
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
| Backend / DB | Supabase (Postgres + Auth) | Real accounts, RLS, hosted — no backend code to write |
| Supabase client | ESM CDN (`esm.sh/@supabase/supabase-js@2`) | No npm; works in browser directly |
| Config | `config.js` with exported constants | Keeps keys out of committed HTML; documented in README |

---

## Data Model

### `trades` table

```sql
create table trades (
  id          uuid        default gen_random_uuid() primary key,
  user_id     uuid        references auth.users(id) on delete cascade not null,
  stock       text        not null,
  sector      text        not null,
  entry_price numeric(12, 4) not null,
  exit_price  numeric(12, 4) not null,
  entry_time  timestamptz not null,
  exit_time   timestamptz not null,
  created_at  timestamptz default now()
);
```

**Derived fields (computed in JS, not stored):**
- `p_and_l = exit_price − entry_price`
- `hold_minutes = (exit_time − entry_time) / 60000`
- `behavioral_tag` — assigned per trade at render time using the autopsy logic

**Sectors (dropdown options):** Technology · Healthcare · Finance · Energy · Consumer · Industrials · Real Estate · Other

---

## RLS Model

Row Level Security is **ON** for the `trades` table. Users can only read and write their own rows.

```sql
alter table trades enable row level security;

-- SELECT: users see only their own trades
create policy "select_own_trades"
  on trades for select
  using (auth.uid() = user_id);

-- INSERT: users can only insert rows where user_id matches their session
create policy "insert_own_trades"
  on trades for insert
  with check (auth.uid() = user_id);
```

No UPDATE or DELETE policies — add-only is intentional for MVP.

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
- [ ] Commit history shows one commit per task with a meaningful message
