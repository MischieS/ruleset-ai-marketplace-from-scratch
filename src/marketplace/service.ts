import bcrypt from "bcryptjs";
import { calculateProductScore, calculateSellerScore } from "./scoring.js";
import { MarketplaceRepository } from "./repository.js";
import { evaluateListingPolicy } from "./policy.js";
import type { Product, Role, SellerSlaStat, User } from "./types.js";

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

    const grossRevenue = Number(orders.reduce((sum, o) => sum + o.amountUsd, 0).toFixed(2));
    const platformFees = Number(orders.reduce((sum, o) => sum + o.platformFeeUsd, 0).toFixed(2));
    const earnedPayout = Number(orders.reduce((sum, o) => sum + o.payoutUsd, 0).toFixed(2));
    const requestedPayout = Number(
      payouts.filter((p) => p.status === "pending" || p.status === "paid").reduce((sum, p) => sum + p.amountUsd, 0).toFixed(2),
    );
    const availablePayout = Number((earnedPayout - requestedPayout).toFixed(2));

    return {
      grossRevenue,
      platformFees,
      earnedPayout,
      requestedPayout,
      availablePayout,
      orderCount: orders.length,
      pendingPayoutCount: payouts.filter((p) => p.status === "pending").length,
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
