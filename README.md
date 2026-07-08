# Pundi

Personal finance tracker built for the "Pemrograman Web 2" final exam (UAS).
See [PRD.md](./PRD.md) for the full product requirements.

## Features

- Registration and login with JWT stored in an httpOnly cookie
- Transactions: add, edit, delete, list with filters (type, category, date
  range) and pagination
- Categories: default global categories plus per-user custom categories
- Monthly budgets per category with usage-percentage progress
- Dashboard: current-month totals, expense breakdown pie chart, 6-month
  income/expense trend, budget progress indicators
- CSV export of a user's transaction history
- AI receipt scan: photograph a receipt, Gemini extracts merchant, date,
  total, and category into the transaction form for the user to review and
  confirm before it is saved
- Admin dashboard with aggregate app statistics (no access to any user's
  transaction detail) and management of global default categories

## Stack

React 19 + Vite + TypeScript, Tailwind CSS v4, shadcn/ui + react bits, Vercel
Functions (backend), Drizzle ORM + Neon Postgres, JWT auth, Gemini API for the
AI receipt-scan feature.

## Local development

```bash
cp .env.example .env.local   # fill in real values
npm install
npx vercel dev                # runs the Vite frontend and /api functions together
```

Plain `npm run dev` only serves the frontend; it cannot call `/api/*` since
Vite itself does not run the serverless functions.

## Database

```bash
npx drizzle-kit generate   # generate a migration from db/schema.ts
npx drizzle-kit migrate    # apply migrations
npx tsx db/seed.ts         # seed default categories
npx tsx db/promote-admin.ts <email>   # grant admin role to an existing user
```

## Deployment

The project deploys to Vercel as a single project: the Vite frontend and the
`api/**` Vercel Functions share one domain, so the auth cookie needs no
cross-origin handling.

Neon Postgres is provisioned through the Vercel dashboard's Storage tab
(Marketplace integration -> Neon), which injects `DATABASE_URL` into the
project automatically once linked.

Before the app will function in production, set these environment variables
in the Vercel dashboard (Project Settings -> Environment Variables):

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Set automatically by the Neon Marketplace integration once linked; only needed manually for local development. |
| `JWT_SECRET` | Generate a fresh production value with `openssl rand -base64 32`; do not reuse the local dev secret. |
| `GEMINI_API_KEY` | From https://aistudio.google.com/apikey, used only by backend functions for the receipt-scan feature. |

After the first deploy, run the migration, seed, and admin-promotion scripts
against the production database (point `DATABASE_URL` at it locally, or run
them from a shell with the production env loaded), then smoke test:
register, log in, refresh the browser to confirm the session cookie
survives, add a transaction, and check the dashboard updates.
