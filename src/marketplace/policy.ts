import type { ListingPolicy, Product, Seller, SellerScore } from "./types.js";

export function evaluateListingPolicy(product: Product, seller: Seller, sellerScore: SellerScore): ListingPolicy {
  const reasons: string[] = [];

  const contentQuality = product.title.length >= 8 && product.description.length >= 40 && product.tags.length >= 2;
  const performanceThreshold = product.metrics.successRate >= 85 && product.metrics.refundRate <= 8;
  const trustThreshold = sellerScore.businessHealthScore >= 70;
  const sellerVerified = seller.verified;

  if (!contentQuality) reasons.push("Listing content quality is below threshold.");
  if (!performanceThreshold) reasons.push("Performance metrics do not meet promoted criteria.");
  if (!trustThreshold) reasons.push("Seller health score is below promoted threshold.");
  if (!sellerVerified) reasons.push("Seller verification is required for promotions.");

  return {
    productId: product.id,
    promotedEligible: contentQuality && performanceThreshold && trustThreshold && sellerVerified,
    reasons,
    checks: {
      contentQuality,
      performanceThreshold,
      trustThreshold,
      sellerVerified,
    },
  };
}
