import { describe, expect, it } from "vitest";
import { calculateProductScore, calculateSellerScore } from "../src/marketplace/scoring.js";
import type { Product, Seller } from "../src/marketplace/types.js";

const seller: Seller = {
  id: "seller_1",
  name: "Seller One",
  bio: "Testing seller",
  verified: true,
};

const baselineProduct: Product = {
  id: "prod_1",
  sellerId: "seller_1",
  title: "Workflow Alpha",
  description: "Automates a common SaaS operations process with robust defaults.",
  type: "n8n_workflow",
  priceUsd: 79,
  tags: ["automation"],
  createdAt: "2026-02-01T00:00:00.000Z",
  likes: 60,
  metrics: {
    successRate: 95,
    avgSetupMinutes: 12,
    reuseRate: 90,
    supportScore: 88,
    refundRate: 2,
    adoption30d: 220,
    issuesPer100Runs: 3,
  },
};

describe("scoring", () => {
  it("gives high quality product a strong score", () => {
    const score = calculateProductScore(baselineProduct);
    expect(score.efficiencyScore).toBeGreaterThan(75);
    expect(["Platinum", "Gold"]).toContain(score.qualityTier);
  });

  it("penalizes weak runtime quality", () => {
    const weak: Product = {
      ...baselineProduct,
      id: "prod_2",
      likes: 2,
      metrics: {
        ...baselineProduct.metrics,
        successRate: 65,
        refundRate: 20,
        issuesPer100Runs: 14,
      },
    };

    expect(calculateProductScore(weak).efficiencyScore).toBeLessThan(
      calculateProductScore(baselineProduct).efficiencyScore,
    );
  });

  it("aggregates seller score", () => {
    const sellerScore = calculateSellerScore(seller, [baselineProduct]);
    expect(sellerScore.businessHealthScore).toBeGreaterThan(70);
    expect(sellerScore.productCount).toBe(1);
  });
});
