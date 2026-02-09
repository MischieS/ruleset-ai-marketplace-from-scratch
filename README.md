# Ruleset AI Marketplace (From Scratch)

Marketplace for selling and buying digital assets:

- Rules
- Skills
- Agents
- n8n workflows

## Implemented phases

- Auth and role system (`buyer`, `seller`, `admin`)
- Product discovery, likes, scoring board, seller leaderboard
- Commerce flow (orders with platform fee and payout split)
- Seller finance and payout request flow
- Admin payout review and payment endpoint
- Buyer/seller messaging and seller SLA endpoint
- Listing policy engine for promotion eligibility
- Sponsored discovery feed with seller CPM campaigns and budget controls
- Optional Postgres event and score persistence
- Security hardening (headers + auth rate limiting)
- CI workflow for build/test gates
- Vercel deployment config and API entrypoint
- Product surface UI with five core pages: home, marketplace, user, seller, admin

## Demo accounts

Password for all demo users: `demo1234`

- `buyer@demo.local`
- `orbitlabs@demo.local`
- `studionine@demo.local`
- `fluxops@demo.local`
- `admin@demo.local`

## Run locally

```bash
npm install
npm run dev:server
```

Open: `http://localhost:4173`

## Validate

```bash
npm run check
```

## Optional environment variables

- `JWT_SECRET` - token signing secret for auth
- `DATABASE_URL` - enables Postgres event/score persistence

## API highlights

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/products`
- `GET /api/discovery/feed`
- `POST /api/products/:id/like`
- `POST /api/promotions/:id/click`
- `POST /api/orders`
- `GET /api/orders/me`
- `GET /api/seller/finance`
- `GET /api/seller/promotions`
- `POST /api/seller/promotions`
- `POST /api/seller/promotions/:id/status`
- `POST /api/seller/payouts/request`
- `GET /api/admin/payouts/pending`
- `POST /api/admin/payouts/:id`
- `POST /api/messages`
- `POST /api/messages/reply`
- `GET /api/messages/thread`
- `GET /api/sla/seller`
- `GET /api/policy/products/:id`

## Vercel

- `vercel.json` included
- API handler at `api/index.ts`
- static web app served from `web/`

## Ops files

- `.env.example`
- `.github/workflows/ci.yml`
- `db/migrations/001_market_observability.sql`
- `docs/DEPLOYMENT.md`
- `docs/PRODUCTION_EXECUTION_BLUEPRINT.md`
