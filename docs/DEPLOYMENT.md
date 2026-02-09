# Deployment Guide

## Prerequisites

- GitHub repo connected to Vercel
- `vercel` CLI authenticated
- Optional Postgres database for event persistence

## Preview deploy

```bash
vercel deploy -y
```

## Production deploy

```bash
vercel --prod -y
```

## Runtime environment variables

Set in Vercel Project Settings:

- `JWT_SECRET`
- `DATABASE_URL` (optional)

## Postgres setup

Apply migration file:

- `db/migrations/001_market_observability.sql`

The API will still run without Postgres; observability writes are skipped if DB is unavailable.
