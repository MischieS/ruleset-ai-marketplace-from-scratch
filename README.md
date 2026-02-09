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
- Buyer/seller messaging and seller SLA endpoint
- Listing policy engine for promotion eligibility
- Optional Postgres event and score persistence
- Vercel deployment config and API entrypoint

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
- `POST /api/products/:id/like`
- `POST /api/orders`
- `GET /api/orders/me`
- `GET /api/seller/finance`
- `POST /api/seller/payouts/request`
- `POST /api/messages`
- `POST /api/messages/reply`
- `GET /api/messages/thread`
- `GET /api/sla/seller`
- `GET /api/policy/products/:id`

## Vercel

- `vercel.json` included
- API handler at `api/index.ts`
- static web app served from `web/`
