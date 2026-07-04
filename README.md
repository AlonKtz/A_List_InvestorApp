# The A List — Behavioral Trading Journal

A gamified trading journal that turns your trade history into a behavioral report card. Beginner traders lose on psychology (FOMO, panic exits, revenge trading) — not math. The A List exposes those patterns with sports-analytics-style stats.

**Live app:** https://alonktz.github.io/A_List_InvestorApp/
→ Try it instantly with the **"Demo login: Bearded Jack, Amateur Investor"** button — no signup needed.

Links to meta-prompting with Gemini Pro and Claude for this project's first prompt:
1. Gemini: https://share.gemini.google/NcCfOQK0lGSL
2. Claude: https://claude.ai/share/c2b7af98-f704-47a2-88c4-ec274e3e48b1

→ [PRD](PRD.md) · [Build Tasks](tasks.md)

---

## What It Does

- **Log trades:** stock ticker, sector (auto-filled), buy/sell price, quantity, order type, trade date
- **Live data:** ticker → sector auto-fill from a 2000+ ticker map (Finnhub fallback), plus a "Fetch Current Price" button that pulls the live quote
- **Behavioral metrics:** Composure Rating · FOMO Tax · Tilt Multiplier
- **Behavioral tagging:** every trade auto-tagged (`PANIC_EXIT`, `EUPHORIA_TRADE`, `REVENGE_TRADE`, `TUNNEL_VISION`, `CLEAN`)
- **Autopsy panels:** Best & Worst Trade · Recent 3 Trades · Top Sectors by P&L
- **Charts:** sector breakdown · cumulative P&L · behavioral breakdown
- **Watchlist:** a separate hash-routed page (`#/watchlist`) to track tickers with live Finnhub quotes, plus a one-click "Log trade" shortcut that prefills the form
- **Per-user accounts:** Appwrite Auth + document-level permissions — your trades are yours only
- **Demo account:** one-click login to a pre-seeded account for reviewers

---

## Running the App

**It's already live** — just open the [live app](https://alonktz.github.io/A_List_InvestorApp/). Nothing to install.

To run it locally, clone the repo and serve the folder with any static file server (no build step, no npm):

```bash
# Python (built-in)
python -m http.server 8080

# VS Code Live Server extension also works
```

`config.js` is committed with the repo, so a fresh clone runs against the same Appwrite backend out of the box — no setup needed just to try it. **Only if you want to point it at your own Appwrite project** do you need the setup below (create the resources, then edit the values in `config.js`).

---

## Appwrite Setup

> **Optional** — only needed if you're pointing the app at your *own* Appwrite project. The committed `config.js` already targets a working backend, so you can skip this just to try the app.

### 1. Create an Appwrite Cloud account

Go to [cloud.appwrite.io](https://cloud.appwrite.io) and create a free account.

### 2. Create a project

In the Appwrite console, click **Create Project** and give it a name (e.g. `AList`). Note your **Project ID** from the project settings page.

### 3. Add a Web platform

In your project: **Overview → Add a platform → Web**. Set the hostname to `localhost` for local development. For the deployed site, add the GitHub Pages host (e.g. `alonktz.github.io`) as a second Web platform — otherwise the browser blocks the API calls with a CORS error.

### 4. Create a Database

Go to **Databases → Create Database**. Name it anything (e.g. `alist_db`). Note the **Database ID**.

### 5. Create the `trades` Collection

Inside the database, click **Create Collection** and name it `trades`. Note the **Collection ID**.

Then add the following **Attributes**:

| Key | Type | Size | Required |
|-----|------|------|----------|
| `stock` | String | 50 | Yes |
| `sector` | String | 50 | Yes |
| `entry_price` | Float | — | Yes |
| `exit_price` | Float | — | Yes |
| `entry_time` | String | 30 | Yes |
| `exit_time` | String | 30 | Yes |
| `order_category` | String | 30 | Yes |
| `quantity` | Integer | — | Yes |

Enable **Document Security** on the collection so per-document permissions are enforced.

### 6. Set Collection Permissions

In the collection's **Settings → Permissions** tab, add a role:

- Role: **Users** → check **Create**

This lets any authenticated user create documents. Read/update/delete are set **per document** at insert time (scoped to the owner's user ID), so no other user can access another user's trades.

Then create a **second collection** with custom ID **`watchlist`** (for the Watchlist page), with these attributes:

| Key | Type | Size | Required |
|-----|------|------|----------|
| `symbol` | String | 10 | Yes |
| `sector` | String | 50 | Yes |

Enable **Document Security** on it too, and grant **Users → Create** — identical to `trades`.

### 7. Get a Finnhub API key

Sign up free at [finnhub.io](https://finnhub.io) and copy your API key. It powers the "Fetch Current Price" button and the sector fallback lookup.

### 8. Configure your keys

Copy `config.example.js` to `config.js` and fill in your values:

```bash
cp config.example.js config.js
```

`config.js` uses plain `const` declarations (loaded as a global script before `app.js`, **not** an ES module):

```js
const APPWRITE_ENDPOINT      = 'https://fra.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID    = 'your-project-id';
const APPWRITE_DATABASE_ID   = 'your-database-id';
const APPWRITE_COLLECTION_ID = 'trades';
const APPWRITE_WATCHLIST_COLLECTION_ID = 'watchlist';
const FINNHUB_API_KEY        = 'your-finnhub-api-key';
```

> **Note on `config.js` and secrets:** For a client-side app these values (endpoint, project/database/collection IDs) are sent with every browser request and are public by design — so `config.js` is committed so GitHub Pages can serve it. Real security comes from the Appwrite **platform allowlist** + **document-level permissions**, not from hiding these values. The Finnhub key is a free, client-exposed key.

---

## Seeding the Demo Account

`seed-jack.html` is a one-off utility page that creates the demo user `jack@alist.demo` ("Bearded Jack, Amateur Investor") and inserts a **26-trade portfolio engineered to populate the behavioral metrics** — 15 of the 26 trades demonstrate a relation: panic day-trade exits (Composure ≈25), same-day chaser losses (FOMO Tax ≈-$2,070), and escalating loss-after-loss tilts (Tilt ≈1.4×), across all four order types and 9 sectors. It also seeds a **6-ticker watchlist** (AMZN, TSLA, META, PLTR, COIN, DIS). Open it once in a browser (with a valid `config.js` present) and click **Run Seeder**; it wipes any existing trades *and* watchlist first, so re-running always yields the exact same demo. Afterwards the "Demo login: Bearded Jack, Amateur Investor" button on the main page logs straight in.

> The watchlist seeding needs the `watchlist` collection to exist (see step 6 above); if it's missing, the seeder skips it gracefully and still seeds the trades.

---

## Project Structure

```
AList_App/
├── index.html          # Single-page app shell (auth / dashboard / log trade)
├── app.js              # Main JS — auth, trade logic, metrics, tags, charts
├── sectors.js          # 2000+ ticker → sector map
├── design.css          # Liquid-glass design system (token-based)
├── config.js           # Appwrite + Finnhub config (committed; see note above)
├── config.example.js   # Template with placeholder values
├── seed-jack.html      # One-off demo-account seeder
├── PRD.md              # Product requirements
├── tasks.md            # Build checklist (one task = one commit)
└── README.md           # This file
```

---

## Data Sources

- **Appwrite Cloud** — user accounts (Auth) and trade storage (Database). All trade documents are scoped to their owner via document-level permissions.
- **Finnhub API** — `/quote` for the live "Fetch Current Price" feature and the Watchlist page's live quotes; `/stock/profile2` as a sector fallback for tickers not in `sectors.js`.

---

## Known Limits

- Sign-up passwords must be **letters and numbers only**, minimum 8 characters (no spaces or symbols).
- Trades are add-and-delete only — there is no in-place edit.
- Behavioral metrics need at least ~4–5 trades to produce meaningful output.
- Only the *current* live price is available (free Finnhub tier); historical intraday backfill is not supported.
- Responsive layout is functional but tuned primarily for desktop.

---

## Stack

HTML5 · Tailwind CSS (CDN) · Vanilla JS (plain scripts, no bundler) · Chart.js (CDN) · Appwrite Cloud (Database + Auth) · Finnhub API · GitHub Pages
