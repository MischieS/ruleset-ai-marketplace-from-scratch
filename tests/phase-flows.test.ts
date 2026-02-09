import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

describe("phase flows", () => {
  it("supports auth, order creation, payouts, messaging, policy and sponsored discovery", async () => {
    const app = await createApp("data/marketplace.seed.json");

    const buyerLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "buyer@demo.local", password: "demo1234" })
      .expect(200);
    const buyerToken = buyerLogin.body.token as string;

    const sellerLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "orbitlabs@demo.local", password: "demo1234" })
      .expect(200);
    const sellerToken = sellerLogin.body.token as string;
    const sellerUserId = sellerLogin.body.user.id as string;

    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@demo.local", password: "demo1234" })
      .expect(200);
    const adminToken = adminLogin.body.token as string;

    const products = await request(app).get("/api/products?sort=score").expect(200);
    const orbitProduct = products.body.find((p: any) => p.sellerId === "seller_orbit");
    const productId = orbitProduct.id as string;
    const sellerId = orbitProduct.sellerId as string;

    const order = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId })
      .expect(201);
    expect(order.body.productId).toBe(productId);

    const finance = await request(app)
      .get("/api/seller/finance")
      .set("Authorization", `Bearer ${sellerToken}`)
      .expect(200);
    expect(finance.body.grossRevenue).toBeGreaterThan(0);

    const payout = await request(app)
      .post("/api/seller/payouts/request")
      .set("Authorization", `Bearer ${sellerToken}`)
      .expect(201);
    expect(payout.body.amountUsd).toBeGreaterThan(0);

    const pending = await request(app)
      .get("/api/admin/payouts/pending")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(pending.body.length).toBeGreaterThan(0);

    const pay = await request(app)
      .post(`/api/admin/payouts/${payout.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "paid" })
      .expect(200);
    expect(pay.body.status).toBe("paid");

    const buyerMessage = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId, toSellerId: sellerId, body: "Need implementation guidance" })
      .expect(201);

    await request(app)
      .post("/api/messages/reply")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({ productId, toUserId: buyerMessage.body.fromUserId, body: "I can help with setup" })
      .expect(201);

    const thread = await request(app)
      .get(`/api/messages/thread?productId=${productId}&withUserId=${sellerUserId}`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .expect(200);
    expect(thread.body.length).toBeGreaterThan(0);

    const sla = await request(app)
      .get("/api/sla/seller")
      .set("Authorization", `Bearer ${sellerToken}`)
      .expect(200);
    expect(sla.body.conversations).toBeGreaterThan(0);

    const policy = await request(app).get(`/api/policy/products/${productId}`).expect(200);
    expect(policy.body).toHaveProperty("promotedEligible");

    const campaign = await request(app)
      .post("/api/seller/promotions")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({
        productId,
        bidCpmUsd: 6,
        dailyBudgetUsd: 30,
      })
      .expect(201);
    expect(campaign.body.status).toBe("active");

    const discovery = await request(app).get("/api/discovery/feed?slots=8").expect(200);
    expect(Array.isArray(discovery.body)).toBe(true);
    const sponsored = discovery.body.find((row: any) => row.placement === "sponsored");
    expect(sponsored).toBeDefined();
    expect(sponsored.campaignId).toBe(campaign.body.id);

    await request(app).post(`/api/promotions/${campaign.body.id}/click`).expect(200);

    const promotions = await request(app)
      .get("/api/seller/promotions")
      .set("Authorization", `Bearer ${sellerToken}`)
      .expect(200);
    const listed = promotions.body.find((row: any) => row.id === campaign.body.id);
    expect(listed.impressions).toBeGreaterThan(0);
    expect(listed.clicks).toBeGreaterThan(0);

    await request(app)
      .post(`/api/seller/promotions/${campaign.body.id}/status`)
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({ status: "paused" })
      .expect(200);
  });
});

