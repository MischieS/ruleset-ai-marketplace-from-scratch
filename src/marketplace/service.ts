import bcrypt from "bcryptjs";
import { calculateProductScore, calculateSellerScore } from "./scoring.js";
import { MarketplaceRepository } from "./repository.js";
import { evaluateListingPolicy } from "./policy.js";
import type {
  DiscoveryFeedRow,
  Product,
  PromotionCampaignStatus,
  Role,
  SellerSlaStat,
  User,
} from "./types.js";

type SortMode = "score" | "likes" | "new";

export class MarketplaceService {
  constructor(private readonly repo: MarketplaceRepository) {}

  async bootstrapDemoUsers(password = "demo1234") {
    if (this.repo.getUsers().length > 0) return;

    const hash = await bcrypt.hash(password, 10);
    this.repo.addUser({
      email: "buyer@demo.local",
      name: "Demo Buyer",
      role: "buyer",
      passwordHash: hash,
    });

    const sellers = this.repo.getSellers();
    sellers.forEach((seller) => {
      const local = seller.name.toLowerCase().replace(/\s+/g, "");
      this.repo.addUser({
        email: `${local}@demo.local`,
        name: `${seller.name} Seller`,
        role: "seller",
        sellerId: seller.id,
        passwordHash: hash,
      });
    });

    this.repo.addUser({
      email: "admin@demo.local",
      name: "Marketplace Admin",
      role: "admin",
      passwordHash: hash,
    });
  }

  getUserById(userId: string): User | undefined {
    return this.repo.getUserById(userId);
  }

  async registerUser(input: {
    email: string;
    password: string;
    name: string;
    role: Role;
    sellerId?: string;
  }) {
    if (this.repo.getUserByEmail(input.email)) {
      throw new Error("Email already registered");
    }

    if (input.role === "seller") {
      if (!input.sellerId || !this.repo.getSellerById(input.sellerId)) {
        throw new Error("Seller role requires a valid sellerId");
      }
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const created = this.repo.addUser({
      email: input.email,
      name: input.name,
      role: input.role,
      sellerId: input.sellerId,
      passwordHash,
    });

    return this.toSafeUser(created);
  }

  async authenticate(email: string, password: string) {
    const user = this.repo.getUserByEmail(email);
    if (!user) return undefined;

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return undefined;

    return user;
  }

  toSafeUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      sellerId: user.sellerId,
      createdAt: user.createdAt,
    };
  }

  listProducts(filters: { q?: string; type?: string; sort?: SortMode } = {}) {
    const q = (filters.q ?? "").trim().toLowerCase();
    const rows = this.repo
      .getProducts()
      .filter((p) => {
        const typeOk = filters.type ? p.type === filters.type : true;
        const text = [p.title, p.description, p.tags.join(" ")].join(" ").toLowerCase();
        const queryOk = q.length > 0 ? text.includes(q) : true;
        return typeOk && queryOk;
      })
      .map((product) => ({ product, score: calculateProductScore(product) }));

    const sort = filters.sort ?? "score";
    if (sort === "score") rows.sort((a, b) => b.score.efficiencyScore - a.score.efficiencyScore);
    if (sort === "likes") rows.sort((a, b) => b.product.likes - a.product.likes);
    if (sort === "new") rows.sort((a, b) => Date.parse(b.product.createdAt) - Date.parse(a.product.createdAt));

    return rows;
  }

  likeProduct(productId: string) {
    const updated = this.repo.likeProduct(productId);
    if (!updated) return undefined;
    return { product: updated, score: calculateProductScore(updated) };
  }

  getProduct(productId: string) {
    const found = this.repo.getProductById(productId);
    if (!found) return undefined;
    return { product: found, score: calculateProductScore(found) };
  }

  productLeaderboard(limit = 10) {
    return this.repo
      .getProducts()
      .map((product) => ({ product, score: calculateProductScore(product) }))
      .sort((a, b) => b.score.efficiencyScore - a.score.efficiencyScore)
      .slice(0, limit);
  }

  sellerLeaderboard(limit = 10) {
    const allProducts = this.repo.getProducts();
    return this.repo
      .getSellers()
      .map((seller) => calculateSellerScore(seller, allProducts))
      .sort((a, b) => b.businessHealthScore - a.businessHealthScore)
      .slice(0, limit);
  }

  createOrder(buyerUserId: string, productId: string) {
    const product = this.repo.getProductById(productId);
    if (!product) {
      throw new Error("Product not found");
    }

    const amountUsd = product.priceUsd;
    const platformFeeUsd = Number((amountUsd * 0.12).toFixed(2));
    const payoutUsd = Number((amountUsd - platformFeeUsd).toFixed(2));

    return this.repo.addOrder({
      buyerUserId,
      productId,
      sellerId: product.sellerId,
      amountUsd,
      platformFeeUsd,
      payoutUsd,
    });
  }

  listOrdersForBuyer(userId: string) {
    return this.repo.getOrdersByBuyer(userId);
  }

  getSellerFinance(sellerId: string) {
    const orders = this.repo.getOrdersBySeller(sellerId);
    const payouts = this.repo.getPayoutsBySeller(sellerId);
    const promotions = this.repo.getPromotionsBySeller(sellerId);

    const grossRevenue = Number(orders.reduce((sum, o) => sum + o.amountUsd, 0).toFixed(2));
    const platformFees = Number(orders.reduce((sum, o) => sum + o.platformFeeUsd, 0).toFixed(2));
    const earnedPayout = Number(orders.reduce((sum, o) => sum + o.payoutUsd, 0).toFixed(2));
    const requestedPayout = Number(
      payouts.filter((p) => p.status === "pending" || p.status === "paid").reduce((sum, p) => sum + p.amountUsd, 0).toFixed(2),
    );
    const availablePayout = Number((earnedPayout - requestedPayout).toFixed(2));
    const adSpendUsd = Number(promotions.reduce((sum, campaign) => sum + campaign.spentUsd, 0).toFixed(2));
    const netEarningsAfterAdsUsd = Number((earnedPayout - adSpendUsd).toFixed(2));

    return {
      grossRevenue,
      platformFees,
      earnedPayout,
      requestedPayout,
      availablePayout,
      adSpendUsd,
      netEarningsAfterAdsUsd,
      orderCount: orders.length,
      pendingPayoutCount: payouts.filter((p) => p.status === "pending").length,
      activePromotionCount: promotions.filter((campaign) => campaign.status === "active").length,
    };
  }

  requestPayout(sellerId: string, requestedByUserId: string) {
    const finance = this.getSellerFinance(sellerId);
    if (finance.availablePayout <= 0) {
      throw new Error("No payout available");
    }

    return this.repo.addPayout({
      sellerId,
      requestedByUserId,
      amountUsd: finance.availablePayout,
    });
  }

  listPendingPayouts() {
    return this.repo.getPendingPayouts();
  }

  markPayoutPaid(payoutId: string) {
    const updated = this.repo.markPayoutPaid(payoutId);
    if (!updated) {
      throw new Error("Payout not found");
    }
    return updated;
  }

  sendMessage(input: { productId: string; fromUserId: string; toSellerId: string; body: string }) {
    const sellerUser = this.repo.getPrimarySellerUser(input.toSellerId);
    if (!sellerUser) {
      throw new Error("Seller contact is unavailable");
    }

    return this.repo.addMessage({
      productId: input.productId,
      fromUserId: input.fromUserId,
      toUserId: sellerUser.id,
      body: input.body,
    });
  }

  sendSellerReply(input: { productId: string; fromSellerUserId: string; toUserId: string; body: string }) {
    return this.repo.addMessage({
      productId: input.productId,
      fromUserId: input.fromSellerUserId,
      toUserId: input.toUserId,
      body: input.body,
    });
  }

  thread(productId: string, userA: string, userB: string) {
    return this.repo.getThreadMessages(productId, userA, userB);
  }

  computeSellerSla(sellerUserId: string): SellerSlaStat {
    const all = this.repo.getMessagesBySeller(sellerUserId).sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

    const inbound = all.filter((m) => m.toUserId === sellerUserId);
    let replied = 0;
    let within24h = 0;
    let totalHours = 0;

    inbound.forEach((incoming) => {
      const reply = all.find(
        (m) =>
          m.productId === incoming.productId &&
          m.fromUserId === sellerUserId &&
          m.toUserId === incoming.fromUserId &&
          Date.parse(m.createdAt) > Date.parse(incoming.createdAt),
      );

      if (reply) {
        replied += 1;
        const hours = (Date.parse(reply.createdAt) - Date.parse(incoming.createdAt)) / 1000 / 3600;
        totalHours += hours;
        if (hours <= 24) within24h += 1;
      }
    });

    return {
      sellerId: sellerUserId,
      conversations: inbound.length,
      avgFirstResponseHours: replied > 0 ? Number((totalHours / replied).toFixed(2)) : 0,
      onTimeRate: replied > 0 ? Number(((within24h / replied) * 100).toFixed(2)) : 0,
    };
  }

  createPromotionCampaign(sellerId: string, input: { productId: string; bidCpmUsd: number; dailyBudgetUsd: number }) {
    if (input.bidCpmUsd < 1) {
      throw new Error("bidCpmUsd must be at least 1");
    }
    if (input.dailyBudgetUsd < 10) {
      throw new Error("dailyBudgetUsd must be at least 10");
    }

    const product = this.repo.getProductById(input.productId);
    if (!product) {
      throw new Error("Product not found");
    }
    if (product.sellerId !== sellerId) {
      throw new Error("Promotion can only be created for your own listing");
    }

    const policy = this.evaluatePolicy(input.productId);
    if (!policy.promotedEligible) {
      throw new Error(`Product is not promotion eligible: ${policy.reasons.join(" ") || "policy check failed"}`);
    }

    return this.repo.addPromotionCampaign({
      sellerId,
      productId: input.productId,
      bidCpmUsd: Number(input.bidCpmUsd.toFixed(2)),
      dailyBudgetUsd: Number(input.dailyBudgetUsd.toFixed(2)),
    });
  }

  listSellerPromotions(sellerId: string) {
    return this.repo
      .getPromotionsBySeller(sellerId)
      .map((campaign) => {
        const product = this.repo.getProductById(campaign.productId);
        const ctr = campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0;
        const remainingBudgetUsd = Number(Math.max(0, campaign.dailyBudgetUsd - campaign.spentUsd).toFixed(2));
        return {
          ...campaign,
          productTitle: product?.title ?? "Unknown product",
          remainingBudgetUsd,
          ctrPercent: Number(ctr.toFixed(2)),
        };
      })
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  updatePromotionStatus(sellerId: string, campaignId: string, status: PromotionCampaignStatus) {
    const campaign = this.repo.getPromotionById(campaignId);
    if (!campaign || campaign.sellerId !== sellerId) {
      throw new Error("Promotion campaign not found");
    }
    if (campaign.status === "exhausted" && status === "active") {
      throw new Error("Exhausted campaigns cannot be reactivated");
    }

    const updated = this.repo.setPromotionStatus(campaignId, status);
    if (!updated) {
      throw new Error("Promotion campaign not found");
    }
    return updated;
  }

  registerPromotionClick(campaignId: string) {
    const campaign = this.repo.recordPromotionClick(campaignId);
    if (!campaign) {
      throw new Error("Promotion campaign not found");
    }
    return campaign;
  }

  discoveryFeed(filters: { q?: string; type?: string; slots?: number } = {}): DiscoveryFeedRow[] {
    const desiredSlots = Number.isFinite(filters.slots) ? Number(filters.slots) : 12;
    const slotLimit = Math.max(4, Math.min(30, desiredSlots));
    const q = (filters.q ?? "").trim().toLowerCase();
    const type = filters.type;

    const organicRows = this.listProducts({ q, type, sort: "score" });
    const sponsoredRows = this.repo
      .getActivePromotions()
      .map((campaign) => {
        const product = this.repo.getProductById(campaign.productId);
        if (!product) return undefined;
        if (!this.matchesProductFilters(product, q, type)) return undefined;

        const score = calculateProductScore(product);
        const budgetRatio = campaign.dailyBudgetUsd > 0 ? campaign.spentUsd / campaign.dailyBudgetUsd : 1;
        const deliveryBoost = Math.max(0.15, 1 - budgetRatio);
        const rankScore = campaign.bidCpmUsd * 0.75 + score.efficiencyScore * 0.25 + deliveryBoost * 6;
        return { campaign, product, score, rankScore };
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
      .sort((a, b) => b.rankScore - a.rankScore);

    const feed: DiscoveryFeedRow[] = [];
    const usedProductIds = new Set<string>();
    let organicIndex = 0;
    let sponsoredIndex = 0;

    const takeOrganic = (slot: number): DiscoveryFeedRow | undefined => {
      while (organicIndex < organicRows.length) {
        const row = organicRows[organicIndex++];
        if (usedProductIds.has(row.product.id)) continue;
        usedProductIds.add(row.product.id);
        return {
          slot,
          placement: "organic",
          product: row.product,
          score: row.score,
        };
      }
      return undefined;
    };

    const takeSponsored = (slot: number): DiscoveryFeedRow | undefined => {
      while (sponsoredIndex < sponsoredRows.length) {
        const row = sponsoredRows[sponsoredIndex++];
        if (usedProductIds.has(row.product.id)) continue;
        const cpmImpressionCost = Number((row.campaign.bidCpmUsd / 1000).toFixed(4));
        const updatedCampaign = this.repo.recordPromotionImpression(row.campaign.id, cpmImpressionCost);
        if (!updatedCampaign) continue;

        usedProductIds.add(row.product.id);
        return {
          slot,
          placement: "sponsored",
          campaignId: updatedCampaign.id,
          adCpmUsd: updatedCampaign.bidCpmUsd,
          product: row.product,
          score: row.score,
        };
      }
      return undefined;
    };

    for (let slot = 1; slot <= slotLimit; slot += 1) {
      const sponsoredSlot = slot % 4 === 1;
      const row = sponsoredSlot ? takeSponsored(slot) ?? takeOrganic(slot) : takeOrganic(slot) ?? takeSponsored(slot);
      if (!row) break;
      feed.push(row);
    }

    return feed;
  }

  private matchesProductFilters(product: Product, q: string, type?: string) {
    const typeOk = type ? product.type === type : true;
    const haystack = [product.title, product.description, product.tags.join(" ")].join(" ").toLowerCase();
    const queryOk = q.length > 0 ? haystack.includes(q) : true;
    return typeOk && queryOk;
  }

  evaluatePolicy(productId: string) {
    const product = this.repo.getProductById(productId);
    if (!product) throw new Error("Product not found");

    const seller = this.repo.getSellerById(product.sellerId);
    if (!seller) throw new Error("Seller not found");

    const sellerScore = calculateSellerScore(seller, this.repo.getProducts());
    return evaluateListingPolicy(product, seller, sellerScore);
  }
}

export function summarizeProduct(product: Product) {
  return {
    id: product.id,
    sellerId: product.sellerId,
    title: product.title,
    description: product.description,
    type: product.type,
    priceUsd: product.priceUsd,
    tags: product.tags,
    createdAt: product.createdAt,
    likes: product.likes,
  };
}
