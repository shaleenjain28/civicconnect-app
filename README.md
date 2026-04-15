# CivicConnect

This repo contains **three applications**:

- **Citizen app** (React/Vite): `./` (source in `src/`)
- **Authority dashboard** (React/Vite): `./dashboard`
- **Backend API** (Express + TypeScript + Prisma): `./server`

## High-level flow

- Citizen app + dashboard call the backend at `/api/*`
- In production, the frontends are typically deployed on Vercel and rewrite `/api/*` to the backend host
- Backend validates auth with Supabase JWTs and reads/writes data via Prisma/Postgres

## Local development

### 1) Backend

```bash
cd server
cp .env.example .env
npm install
npm run db:push
npm run dev
```

### 2) Citizen app

```bash
cp .env.example .env   # if you use any root env vars
npm install
npm run dev
```

### 3) Dashboard

```bash
cd dashboard
cp .env.example .env
npm install
npm run dev
```

## Environment variables

- **Server**: see `server/.env.example`
- **Dashboard**: see `dashboard/.env.example`
- **Citizen app**: root `.env.example` (if applicable)

## Notes

- Prisma schema is in `server/prisma/schema.prisma`.
- If you change the schema, use `npm run db:migrate` (preferred) or `npm run db:push` (quick dev sync).

