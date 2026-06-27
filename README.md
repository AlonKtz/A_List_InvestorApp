# The A List — Behavioral Trading Journal

A gamified trading journal that turns your trade history into a behavioral report card. Beginner traders lose on psychology (FOMO, panic exits, revenge trading) — not math. The A List exposes those patterns with sports-analytics-style stats.

Links to meta-prompting with gemini pro and claude chat for this project first prompt:
1- gemini: https://share.gemini.google/NcCfOQK0lGSL
2- claude: https://claude.ai/share/c2b7af98-f704-47a2-88c4-ec274e3e48b1

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

## Appwrite Setup

### 1. Create an Appwrite Cloud account

Go to [cloud.appwrite.io](https://cloud.appwrite.io) and create a free account. The free tier supports 10 projects.

### 2. Create a project

In the Appwrite console, click **Create Project** and give it a name (e.g. `AList`). Note your **Project ID** from the project settings page.

### 3. Add a Web platform

In your project: **Overview → Add a platform → Web**. Set the hostname to `localhost` for local development (add your production domain later if deploying).

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

### 6. Set Collection Permissions

In the collection's **Settings → Permissions** tab, add a role:

- Role: **Users** → check **Create**

This allows any authenticated user to create documents. Read/update/delete permissions are set **per document** at insert time (scoped to the document owner's user ID), so no other user can access another user's trades.

### 7. Configure your keys

Copy `config.example.js` to `config.js` and fill in your values:

```bash
cp config.example.js config.js
```

Edit `config.js`:

```js
export const APPWRITE_ENDPOINT   = 'https://cloud.appwrite.io/v1';
export const APPWRITE_PROJECT_ID = 'your-project-id';
export const APPWRITE_DATABASE_ID   = 'your-database-id';
export const APPWRITE_COLLECTION_ID = 'your-collection-id';
```

`config.js` is gitignored and will never be committed. Only `config.example.js` (with placeholder values) is tracked.

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

HTML5 · Tailwind CSS (CDN) · Vanilla JS (ES modules) · Chart.js (CDN) · Appwrite Cloud (Database + Auth)
