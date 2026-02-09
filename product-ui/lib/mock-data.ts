export type ProductType = "rule" | "skill" | "agent" | "n8n_workflow";

export type Product = {
  id: string;
  name: string;
  type: ProductType;
  sellerId: string;
  sellerName: string;
  description: string;
  priceUsd: number;
  likes: number;
  qualityTier: "Platinum" | "Gold" | "Silver";
  metrics: {
    efficiency: number;
    speed: number;
    stability: number;
  };
  tags: string[];
  sponsored?: {
    cpmUsd: number;
    slot: number;
  };
};

export type Seller = {
  id: string;
  name: string;
  verified: boolean;
  health: number;
  avgEfficiency: number;
  totalLikes: number;
  monthlyRevenueUsd: number;
  responseSlaHours: number;
};

export type Order = {
  id: string;
  productName: string;
  amountUsd: number;
  status: "Completed" | "Processing";
  createdAt: string;
};

export type Campaign = {
  id: string;
  productName: string;
  bidCpmUsd: number;
  dailyBudgetUsd: number;
  spentUsd: number;
  ctrPercent: number;
  status: "active" | "paused";
};

export type PayoutRequest = {
  id: string;
  sellerName: string;
  amountUsd: number;
  requestedAt: string;
  status: "pending" | "approved";
};

export const products: Product[] = [
  {
    id: "prod_001",
    name: "Revenue Guard Agent",
    type: "agent",
    sellerId: "seller_orbit",
    sellerName: "Orbit Labs",
    description: "Monitors conversion anomalies and auto-creates remediation tasks.",
    priceUsd: 129,
    likes: 842,
    qualityTier: "Platinum",
    metrics: { efficiency: 94, speed: 82, stability: 91 },
    tags: ["growth", "analytics", "automation"],
    sponsored: { cpmUsd: 6.8, slot: 1 },
  },
  {
    id: "prod_002",
    name: "UX Clarity Skill Pack",
    type: "skill",
    sellerId: "seller_studio9",
    sellerName: "Studio Nine",
    description: "Advanced UX heuristics and onboarding audit templates for SaaS.",
    priceUsd: 69,
    likes: 701,
    qualityTier: "Platinum",
    metrics: { efficiency: 91, speed: 89, stability: 88 },
    tags: ["ux", "audit", "conversion"],
  },
  {
    id: "prod_003",
    name: "Marketplace Fraud Rule Stack",
    type: "rule",
    sellerId: "seller_orbit",
    sellerName: "Orbit Labs",
    description: "Rule sets for seller abuse detection, trust scoring, and queue escalation.",
    priceUsd: 99,
    likes: 522,
    qualityTier: "Gold",
    metrics: { efficiency: 84, speed: 78, stability: 87 },
    tags: ["security", "moderation", "risk"],
  },
  {
    id: "prod_004",
    name: "n8n Lead Router Pro",
    type: "n8n_workflow",
    sellerId: "seller_fluxops",
    sellerName: "FluxOps",
    description: "Routes high-intent leads into CRM with SLA-aware escalation loops.",
    priceUsd: 79,
    likes: 413,
    qualityTier: "Gold",
    metrics: { efficiency: 82, speed: 74, stability: 80 },
    tags: ["n8n", "crm", "sales"],
    sponsored: { cpmUsd: 5.2, slot: 5 },
  },
  {
    id: "prod_005",
    name: "Churn Early-Warning Agent",
    type: "agent",
    sellerId: "seller_studio9",
    sellerName: "Studio Nine",
    description: "Predicts churn cohorts and generates tactical retention workflows.",
    priceUsd: 149,
    likes: 390,
    qualityTier: "Gold",
    metrics: { efficiency: 86, speed: 75, stability: 83 },
    tags: ["retention", "agent", "customer-success"],
  },
  {
    id: "prod_006",
    name: "Support Automation Skill Set",
    type: "skill",
    sellerId: "seller_fluxops",
    sellerName: "FluxOps",
    description: "Prompt and policy templates for tiered support workflows.",
    priceUsd: 59,
    likes: 274,
    qualityTier: "Silver",
    metrics: { efficiency: 74, speed: 84, stability: 73 },
    tags: ["support", "ops", "templates"],
  },
];

export const sellers: Seller[] = [
  {
    id: "seller_orbit",
    name: "Orbit Labs",
    verified: true,
    health: 93,
    avgEfficiency: 89,
    totalLikes: 1694,
    monthlyRevenueUsd: 38450,
    responseSlaHours: 2.8,
  },
  {
    id: "seller_studio9",
    name: "Studio Nine",
    verified: true,
    health: 90,
    avgEfficiency: 88,
    totalLikes: 1091,
    monthlyRevenueUsd: 27680,
    responseSlaHours: 3.4,
  },
  {
    id: "seller_fluxops",
    name: "FluxOps",
    verified: false,
    health: 76,
    avgEfficiency: 78,
    totalLikes: 687,
    monthlyRevenueUsd: 14210,
    responseSlaHours: 7.1,
  },
];

export const userOrders: Order[] = [
  {
    id: "ord_7821",
    productName: "Revenue Guard Agent",
    amountUsd: 129,
    status: "Completed",
    createdAt: "2026-02-03T11:24:00Z",
  },
  {
    id: "ord_7811",
    productName: "UX Clarity Skill Pack",
    amountUsd: 69,
    status: "Completed",
    createdAt: "2026-01-29T09:41:00Z",
  },
  {
    id: "ord_7803",
    productName: "n8n Lead Router Pro",
    amountUsd: 79,
    status: "Processing",
    createdAt: "2026-01-21T17:08:00Z",
  },
];

export const sellerCampaigns: Campaign[] = [
  {
    id: "camp_901",
    productName: "Revenue Guard Agent",
    bidCpmUsd: 6.8,
    dailyBudgetUsd: 120,
    spentUsd: 88.4,
    ctrPercent: 3.6,
    status: "active",
  },
  {
    id: "camp_902",
    productName: "Marketplace Fraud Rule Stack",
    bidCpmUsd: 4.9,
    dailyBudgetUsd: 70,
    spentUsd: 21.7,
    ctrPercent: 2.1,
    status: "paused",
  },
];

export const payoutQueue: PayoutRequest[] = [
  {
    id: "pay_3301",
    sellerName: "Orbit Labs",
    amountUsd: 6120,
    requestedAt: "2026-02-08T08:35:00Z",
    status: "pending",
  },
  {
    id: "pay_3302",
    sellerName: "Studio Nine",
    amountUsd: 3280,
    requestedAt: "2026-02-08T10:10:00Z",
    status: "pending",
  },
  {
    id: "pay_3303",
    sellerName: "FluxOps",
    amountUsd: 1490,
    requestedAt: "2026-02-07T19:52:00Z",
    status: "pending",
  },
];

export const businessPillars = [
  {
    title: "Demand Engine",
    detail:
      "SEO landing architecture, social proof loops, and onboarding conversion into trial or first purchase.",
  },
  {
    title: "Trust Engine",
    detail:
      "Transparent scoring, seller verification, anti-fraud queues, and response SLA visibility across listings.",
  },
  {
    title: "Monetization Engine",
    detail:
      "Marketplace take rate, sponsored inventory, seller subscriptions, and enterprise workflow bundles.",
  },
  {
    title: "Retention Engine",
    detail:
      "Usage nudges, recommendation loops, in-product support, and lifecycle expansion offers.",
  },
];

export const executionRoadmap = [
  {
    phase: "Phase 1",
    focus: "Acquisition + Conversion",
    outcome: "Premium homepage, marketplace discovery, and first-purchase optimization.",
  },
  {
    phase: "Phase 2",
    focus: "Seller Liquidity",
    outcome: "Seller dashboard, campaign controls, payout confidence, and ranking health.",
  },
  {
    phase: "Phase 3",
    focus: "Governance + Scale",
    outcome: "Admin moderation, settlement controls, abuse prevention, and enterprise expansion.",
  },
];
