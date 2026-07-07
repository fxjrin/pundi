# Pundi

Personal finance tracker built for the "Pemrograman Web 2" final exam (UAS).
See [PRD.md](./PRD.md) for the full product requirements.

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
