import { z } from "zod";

export const assetTypeSchema = z.enum(["rule", "skill", "agent", "n8n_workflow"]);
export const roleSchema = z.enum(["buyer", "seller", "admin"]);

export const productMetricsSchema = z.object({
  successRate: z.number().min(0).max(100),
  avgSetupMinutes: z.number().min(0),
  reuseRate: z.number().min(0).max(100),
  supportScore: z.number().min(0).max(100),
  refundRate: z.number().min(0).max(100),
  adoption30d: z.number().min(0),
  issuesPer100Runs: z.number().min(0),
});

export const sellerSchema = z.object({
  id: z.string().min(2),
  name: z.string().min(2),
  bio: z.string().min(2),
  verified: z.boolean(),
});

export const productSchema = z.object({
  id: z.string().min(2),
  sellerId: z.string().min(2),
  title: z.string().min(3),
  description: z.string().min(10),
  type: assetTypeSchema,
  priceUsd: z.number().min(0),
  tags: z.array(z.string()).default([]),
  createdAt: z.string().min(10),
  likes: z.number().min(0),
  metrics: productMetricsSchema,
});

export const seedSchema = z.object({
  sellers: z.array(sellerSchema).min(1),
  products: z.array(productSchema).min(1),
});

export type AssetType = z.infer<typeof assetTypeSchema>;
export type Role = z.infer<typeof roleSchema>;
export type ProductMetrics = z.infer<typeof productMetricsSchema>;
export type Seller = z.infer<typeof sellerSchema>;
export type Product = z.infer<typeof productSchema>;
export type MarketplaceSeed = z.infer<typeof seedSchema>;

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  sellerId?: string;
  passwordHash: string;
  createdAt: string;
};

export type Message = {
  id: string;
  productId: string;
  fromUserId: string;
  toUserId: string;
  body: string;
  createdAt: string;
};

export type Order = {
  id: string;
  buyerUserId: string;
  productId: string;
  sellerId: string;
  amountUsd: number;
  platformFeeUsd: number;
  payoutUsd: number;
  status: "completed";
  createdAt: string;
};

export type Payout = {
  id: string;
  sellerId: string;
  requestedByUserId: string;
  amountUsd: number;
  status: "pending" | "paid";
  createdAt: string;
};

export type PromotionCampaignStatus = "active" | "paused" | "exhausted";

export type PromotionCampaign = {
  id: string;
  sellerId: string;
  productId: string;
  bidCpmUsd: number;
  dailyBudgetUsd: number;
  spentUsd: number;
  impressions: number;
  clicks: number;
  status: PromotionCampaignStatus;
  createdAt: string;
  updatedAt: string;
};

export type ProductScore = {
  productId: string;
  efficiencyScore: number;
  speedScore: number;
  stabilityScore: number;
  qualityTier: "Platinum" | "Gold" | "Silver" | "Needs Improvement";
};

export type SellerScore = {
  sellerId: string;
  sellerName: string;
  verified: boolean;
  productCount: number;
  avgEfficiencyScore: number;
  totalLikes: number;
  businessHealthScore: number;
};

export type ListingPolicy = {
  productId: string;
  promotedEligible: boolean;
  reasons: string[];
  checks: {
    contentQuality: boolean;
    performanceThreshold: boolean;
    trustThreshold: boolean;
    sellerVerified: boolean;
  };
};

export type SellerSlaStat = {
  sellerId: string;
  conversations: number;
  avgFirstResponseHours: number;
  onTimeRate: number;
};

export type DiscoveryFeedRow = {
  slot: number;
  placement: "sponsored" | "organic";
  campaignId?: string;
  adCpmUsd?: number;
  product: Product;
  score: ProductScore;
};
