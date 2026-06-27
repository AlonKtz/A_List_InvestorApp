# The A List — Behavioral Trading Journal

A gamified trading journal that turns your trade history into a behavioral report card. Beginner traders lose on psychology (FOMO, panic exits, revenge trading) — not math. The A List exposes those patterns with sports-analytics-style stats.

→ [PRD](PRD.md) · [Build Tasks](tasks.md)

---

## What It Does

- Log trades: stock ticker, sector, entry/exit price, entry/exit time
- Behavioral metrics: Panic Exit Rate · FOMO Tax · Tilt Multiplier
- Trade Autopsy Timeline: every trade auto-tagged with its behavioral pattern
- Charts: sector breakdown + cumulative P&L over time
- Per-user accounts: Supabase Auth + Row Level Security — your trades are yours only

---

## Running the App

No build step. No npm. Open `index.html` directly in a browser, or serve it with any static file server:

```bash
# Python (built-in)
python -m http.server 8080

# VS Code Live Server extension also works
```

**Before opening the app**, complete the Supabase setup below and create your `config.js`.

---

## Supabase Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a new project, and note your **Project URL** and **anon public key** from Project Settings → API.

### 2. Disable email confirmation

In your Supabase dashboard: **Authentication → Providers → Email** → turn off **"Confirm email"**. This allows sign-up to immediately create an active session without requiring an email confirmation link.

### 3. Create the `trades` table

Run the following in **SQL Editor** in your Supabase dashboard:

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

### 4. Enable Row Level Security

Run this in the SQL Editor (same session is fine):

```sql
alter table trades enable row level security;

create policy "select_own_trades"
  on trades for select
  using (auth.uid() = user_id);

create policy "insert_own_trades"
  on trades for insert
  with check (auth.uid() = user_id);
```

This ensures every user can only read and write their own rows. No cross-user data leakage.

### 5. Configure your keys

Copy `config.example.js` to `config.js` and fill in your values:

```bash
cp config.example.js config.js
```

Edit `config.js`:

```js
export const SUPABASE_URL = 'https://your-project-id.supabase.co';
export const SUPABASE_ANON_KEY = 'your-anon-public-key-here';
```

`config.js` is listed in `.gitignore` and will never be committed. Only `config.example.js` (with placeholder values) is tracked.

---

## Project Structure

```
AList_App/
├── index.html          # Single-page app shell
├── app.js              # Main JS — auth, trade logic, metrics, charts
├── config.js           # Your Supabase keys (gitignored)
├── config.example.js   # Committed template with placeholder values
├── PRD.md              # Product requirements
├── tasks.md            # Build checklist (one task = one commit)
└── README.md           # This file
```

---

## Known Limits

- Add-only trades — the user can edit them and \ or delete in this version
- Behavioral metrics require at least 4–5 trades to produce meaningful output
- For real time data and stock prices we should use a CORS-proxied yahoo finance fetch or eal time mock price simoulator.
- Optimized for mobile on the highest standart

---

## Stack

HTML5 · Tailwind CSS (CDN) · Vanilla JS (ES modules) · Chart.js (CDN) · Supabase (Postgres + Auth)
