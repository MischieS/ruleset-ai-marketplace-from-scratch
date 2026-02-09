import type { Product, ProductMetrics, ProductScore, Seller, SellerScore } from "./types.js";

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

export function calculateProductScore(product: Product): ProductScore {
  const m: ProductMetrics = product.metrics;

  const speedScore = clamp(100 - m.avgSetupMinutes * 2, 0, 100);
  const stabilityScore = clamp(100 - m.issuesPer100Runs * 5, 0, 100);
  const baseScore =
    m.successRate * 0.3 +
    speedScore * 0.2 +
    stabilityScore * 0.2 +
    m.reuseRate * 0.15 +
    m.supportScore * 0.15;

  const refundPenalty = m.refundRate * 0.7;
  const engagementBonus = Math.min(product.likes * 0.4, 8);
  const adoptionBonus = Math.min(Math.log10(m.adoption30d + 1) * 8, 7);

  const efficiencyScore = clamp(baseScore - refundPenalty + engagementBonus + adoptionBonus, 0, 100);

  let qualityTier: ProductScore["qualityTier"] = "Needs Improvement";
  if (efficiencyScore >= 85) qualityTier = "Platinum";
  else if (efficiencyScore >= 75) qualityTier = "Gold";
  else if (efficiencyScore >= 60) qualityTier = "Silver";

  return {
    productId: product.id,
    efficiencyScore: Number(efficiencyScore.toFixed(2)),
    speedScore: Number(speedScore.toFixed(2)),
    stabilityScore: Number(stabilityScore.toFixed(2)),
    qualityTier,
  };
}

export function calculateSellerScore(seller: Seller, products: Product[]): SellerScore {
  const owned = products.filter((p) => p.sellerId === seller.id);
  if (owned.length === 0) {
    return {
      sellerId: seller.id,
      sellerName: seller.name,
      verified: seller.verified,
      productCount: 0,
      avgEfficiencyScore: 0,
      totalLikes: 0,
      businessHealthScore: 0,
    };
  }

  const avgEfficiencyScore =
    owned.reduce((sum, p) => sum + calculateProductScore(p).efficiencyScore, 0) / owned.length;
  const reliabilityMean = owned.reduce((sum, p) => sum + p.metrics.successRate, 0) / owned.length;
  const refundMean = owned.reduce((sum, p) => sum + p.metrics.refundRate, 0) / owned.length;
  const totalLikes = owned.reduce((sum, p) => sum + p.likes, 0);
  const verifiedBonus = seller.verified ? 5 : 0;

  const businessHealthScore = clamp(
    avgEfficiencyScore * 0.75 + reliabilityMean * 0.2 - refundMean * 0.15 + verifiedBonus,
    0,
    100,
  );

  return {
    sellerId: seller.id,
    sellerName: seller.name,
    verified: seller.verified,
    productCount: owned.length,
    avgEfficiencyScore: Number(avgEfficiencyScore.toFixed(2)),
    totalLikes,
    businessHealthScore: Number(businessHealthScore.toFixed(2)),
  };
}
