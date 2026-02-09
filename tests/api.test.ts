import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

describe("marketplace API", () => {
  it("lists products and increments likes", async () => {
    const app = await createApp("data/marketplace.seed.json");

    const list = await request(app).get("/api/products?sort=score").expect(200);
    expect(Array.isArray(list.body)).toBe(true);
    expect(list.body.length).toBeGreaterThan(0);

    const productId = list.body[0].id as string;
    const beforeLikes = list.body[0].likes as number;

    const liked = await request(app).post(`/api/products/${productId}/like`).expect(200);
    expect(liked.body.likes).toBe(beforeLikes + 1);

    const sellers = await request(app).get("/api/leaderboard/sellers").expect(200);
    expect(Array.isArray(sellers.body)).toBe(true);
    expect(sellers.body[0]).toHaveProperty("businessHealthScore");
  });

  it("returns 404 for unknown product", async () => {
    const app = await createApp("data/marketplace.seed.json");
    await request(app).post("/api/products/missing/like").expect(404);
  });
});

