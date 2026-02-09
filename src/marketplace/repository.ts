import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import {
  seedSchema,
  type MarketplaceSeed,
  type Message,
  type Order,
  type Payout,
  type Product,
  type Seller,
  type User,
} from "./types.js";

export class MarketplaceRepository {
  private products: Product[];
  private sellers: Seller[];
  private users: User[] = [];
  private messages: Message[] = [];
  private orders: Order[] = [];
  private payouts: Payout[] = [];

  constructor(seed: MarketplaceSeed) {
    this.products = seed.products;
    this.sellers = seed.sellers;
  }

  static async fromFile(seedPath = "data/marketplace.seed.json"): Promise<MarketplaceRepository> {
    const resolved = path.resolve(seedPath);
    const raw = await readFile(resolved, "utf8");
    const parsed = seedSchema.parse(JSON.parse(raw));
    return new MarketplaceRepository(parsed);
  }

  getProducts(): Product[] {
    return [...this.products];
  }

  getProductById(productId: string): Product | undefined {
    return this.products.find((p) => p.id === productId);
  }

  getSellers(): Seller[] {
    return [...this.sellers];
  }

  getSellerById(sellerId: string): Seller | undefined {
    return this.sellers.find((s) => s.id === sellerId);
  }

  likeProduct(productId: string): Product | undefined {
    const found = this.products.find((p) => p.id === productId);
    if (!found) return undefined;
    found.likes += 1;
    return found;
  }

  getUsers(): User[] {
    return [...this.users];
  }

  getUserById(userId: string): User | undefined {
    return this.users.find((u) => u.id === userId);
  }

  getUserByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  addUser(user: Omit<User, "id" | "createdAt">): User {
    const created: User = {
      ...user,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.users.push(created);
    return created;
  }

  getPrimarySellerUser(sellerId: string): User | undefined {
    return this.users.find((u) => u.role === "seller" && u.sellerId === sellerId);
  }

  addMessage(message: Omit<Message, "id" | "createdAt">): Message {
    const created: Message = {
      ...message,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.messages.push(created);
    return created;
  }

  getThreadMessages(productId: string, userA: string, userB: string): Message[] {
    return this.messages
      .filter(
        (m) =>
          m.productId === productId &&
          ((m.fromUserId === userA && m.toUserId === userB) || (m.fromUserId === userB && m.toUserId === userA)),
      )
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  }

  getMessagesBySeller(sellerUserId: string): Message[] {
    return this.messages.filter((m) => m.toUserId === sellerUserId || m.fromUserId === sellerUserId);
  }

  addOrder(order: Omit<Order, "id" | "createdAt" | "status">): Order {
    const created: Order = {
      ...order,
      id: randomUUID(),
      status: "completed",
      createdAt: new Date().toISOString(),
    };
    this.orders.push(created);
    return created;
  }

  getOrdersByBuyer(userId: string): Order[] {
    return this.orders.filter((o) => o.buyerUserId === userId);
  }

  getOrdersBySeller(sellerId: string): Order[] {
    return this.orders.filter((o) => o.sellerId === sellerId);
  }

  addPayout(payout: Omit<Payout, "id" | "createdAt" | "status">): Payout {
    const created: Payout = {
      ...payout,
      id: randomUUID(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    this.payouts.push(created);
    return created;
  }

  getPayoutsBySeller(sellerId: string): Payout[] {
    return this.payouts.filter((p) => p.sellerId === sellerId);
  }

  getPendingPayouts(): Payout[] {
    return this.payouts.filter((p) => p.status === "pending");
  }

  getPayoutById(payoutId: string): Payout | undefined {
    return this.payouts.find((p) => p.id === payoutId);
  }

  markPayoutPaid(payoutId: string): Payout | undefined {
    const found = this.payouts.find((p) => p.id === payoutId);
    if (!found) return undefined;
    found.status = "paid";
    return found;
  }
}
