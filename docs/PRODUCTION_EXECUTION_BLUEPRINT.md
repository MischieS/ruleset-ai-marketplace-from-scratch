# Production Execution Blueprint

## Goal
Build Ruleset AI as a production SaaS marketplace with five core surfaces:

1. Homepage (acquisition and trust)
2. Marketplace (discovery and conversion)
3. User workspace (usage and retention)
4. Seller workspace (revenue and optimization)
5. Admin workspace (governance and settlement)

## Environment Setup

### Runtime and Deployment
- Runtime: Node.js 20+
- API engine: Express + TypeScript (`src/app.ts`)
- Frontend shell: static app served from `web/`
- Deployment: Vercel production alias

### Local Developer Workflow
1. `npm install`
2. `npm run dev:server`
3. Open `http://localhost:4173`
4. Validate with `npm run check`

### Required Env Vars
- `JWT_SECRET`: auth token signing
- `DATABASE_URL`: optional Postgres event/score sink

## Product Architecture

### Core Domains
- `auth`: registration/login/session identity
- `marketplace`: products, ranking, discovery feed
- `commerce`: orders, platform fees, payouts
- `seller growth`: campaign creation, status controls, ad spend
- `support`: buyer/seller messaging and SLA
- `admin`: payout review and settlement

### Page Responsibilities

#### 1. Homepage
- Communicate product promise
- Surface top assets and sellers
- Show KPI confidence signals
- Route traffic to conversion pages

#### 2. Marketplace
- Search/filter/sort assets
- Display product score breakdown
- Support buy, like, message, policy inspect
- Blend sponsored and organic inventory transparently

#### 3. User Workspace
- Show account identity
- Show order history
- Inspect support threads

#### 4. Seller Workspace
- Show revenue and payout availability
- Show campaign metrics and controls
- Handle payout requests
- Track response SLA

#### 5. Admin Workspace
- Review pending payouts
- Mark payouts as paid
- Observe operational queue health

## Delivery Approach

### Phase A: Foundation (done)
- Auth and role model
- Marketplace scoring
- Commerce and payouts
- Messaging and SLA
- Policy engine

### Phase B: Product Surface (done)
- Full page model (home/user/seller/marketplace/admin)
- KPI instrumentation in UI
- Role-aware controls and fallback states

### Phase C: Production Hardening (next)
1. Replace in-memory repository with persistent Postgres domain storage
2. Add structured audit logs for admin/seller actions
3. Add E2E test suite for role journeys
4. Add Sentry + uptime monitoring
5. Add DB migrations for orders/promotions/messages/payouts

### Phase D: Commercial Readiness (next)
1. Stripe billing and promotion credits
2. Tax/VAT handling and invoice records
3. Seller reputation anti-fraud rules
4. Dispute workflow and evidence timeline

## Definition of Done (Per Feature)
- API endpoint implemented + validated
- UI interaction implemented + role-guarded
- Errors rendered with user-readable copy
- Tests updated (`npm run check` passes)
- Release deployed and smoke-checked

## Operational QA Checklist
- Buyer can browse, buy, and message
- Seller can view finance, request payout, manage promotions
- Admin can see and settle pending payouts
- Discovery feed shows sponsored labels clearly
- 401/403/400 paths are user-readable
- Mobile layout remains usable across all five surfaces

## Immediate Next Sprint
1. Move repository persistence to Postgres tables
2. Add route-level frontend tests (Playwright)
3. Add real notification center for payout/promotions/messages
4. Add admin moderation queues for promotion abuse
