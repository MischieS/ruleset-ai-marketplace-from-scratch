# Business Architecture

## Product goal
Build a trusted marketplace where teams buy and sell reusable digital assets (`rules`, `skills`, `agents`, `n8n workflows`) with measurable performance outcomes.

## Phase completion status

1. Auth and role model: done
- JWT-based authentication.
- Roles: buyer, seller, admin.
- Protected routes for commerce, payouts, messaging, and SLA.

2. Persistence and analytics: done
- Postgres event sink enabled when `DATABASE_URL` is set.
- Event and score tables auto-created.
- Non-blocking fallback when DB is unavailable.

3. Messaging and SLA: done
- Buyer-to-seller messaging.
- Seller replies.
- Seller SLA endpoint for first-response performance.

4. Policy engine: done
- Listing quality checks.
- Promotion eligibility checks based on content, performance, trust, and verification.

5. Monetization mechanics: done
- Order pipeline with platform fee split.
- Seller finance summaries.
- Payout request flow.

## Operational strategy

- Use policy and score signals for ranking and promotion eligibility.
- Keep likes as soft social signal with capped influence.
- Use SLA and refund performance for trust gating.
- Use Postgres event data for dashboards and abuse detection.

## Next business enhancement options

1. Add fraud/risk models for account, payment, and content abuse.
2. Add subscription tiers and promoted inventory bidding.
3. Add dispute management with evidence timeline and arbitration rules.
4. Add multi-currency and tax/VAT handling.
