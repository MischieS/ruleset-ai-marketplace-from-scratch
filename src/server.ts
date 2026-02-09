import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { MarketplaceRepository } from "./marketplace/repository.js";
import { MarketplaceService, summarizeProduct } from "./marketplace/service.js";
import { PostgresEventSink } from "./infra/postgres.js";
import { requireAuth, requireRole, signAuthToken } from "./infra/auth.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(["buyer", "seller", "admin"]).default("buyer"),
  sellerId: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const createOrderSchema = z.object({
  productId: z.string().min(2),
});

const sendMessageSchema = z.object({
  productId: z.string().min(2),
  toSellerId: z.string().min(2),
  body: z.string().min(3).max(1000),
});

const sendReplySchema = z.object({
  productId: z.string().min(2),
  toUserId: z.string().min(2),
  body: z.string().min(3).max(1000),
});

export async function createApp(seedPath = "data/marketplace.seed.json") {
  const repo = await MarketplaceRepository.fromFile(seedPath);
  const service = new MarketplaceService(repo);
  await service.bootstrapDemoUsers();

  const eventSink = new PostgresEventSink();
  try {
    await eventSink.init();
  } catch (error) {
    console.warn("Postgres event sink disabled:", (error as Error).message);
  }

  const logEvent = async (eventType: string, payload: unknown) => {
    try {
      await eventSink.logEvent(eventType, payload);
    } catch {
      // Non-blocking telemetry path.
    }
  };

  const logScore = async (scoreType: string, entityId: string, scoreValue: number, metadata: unknown) => {
    try {
      await eventSink.logScore(scoreType, entityId, scoreValue, metadata);
    } catch {
      // Non-blocking telemetry path.
    }
  };

  const app = express();
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", postgresEventSink: eventSink.enabled });
  });

  app.get("/api/demo/accounts", (_req, res) => {
    res.json({
      note: "Development-only demo identities",
      password: "demo1234",
      accounts: [
        "buyer@demo.local",
        "orbitlabs@demo.local",
        "studionine@demo.local",
        "fluxops@demo.local",
        "admin@demo.local",
      ],
    });
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const input = registerSchema.parse(req.body);
      const user = await service.registerUser(input);
      const token = signAuthToken({ sub: user.id, email: user.email, role: user.role, sellerId: user.sellerId });
      await logEvent("auth.register", { userId: user.id, role: user.role });
      res.status(201).json({ user, token });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const input = loginSchema.parse(req.body);
      const user = await service.authenticate(input.email, input.password);
      if (!user) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const token = signAuthToken({ sub: user.id, email: user.email, role: user.role, sellerId: user.sellerId });
      await logEvent("auth.login", { userId: user.id, role: user.role });
      res.json({ user: service.toSafeUser(user), token });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.get("/api/auth/me", requireAuth, (req, res) => {
    const user = service.getUserById(req.auth!.sub);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(service.toSafeUser(user));
  });

  app.get("/api/products", (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const type = typeof req.query.type === "string" ? req.query.type : undefined;
    const sort = typeof req.query.sort === "string" ? req.query.sort : undefined;

    const rows = service.listProducts({ q, type, sort: sort as "score" | "likes" | "new" | undefined });
    res.json(rows.map(({ product, score }) => ({ ...summarizeProduct(product), score })));
  });

  app.get("/api/products/:id", (req, res) => {
    const found = service.getProduct(req.params.id);
    if (!found) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json({ ...summarizeProduct(found.product), score: found.score, metrics: found.product.metrics });
  });

  app.post("/api/products/:id/like", async (req, res) => {
    const liked = service.likeProduct(req.params.id);
    if (!liked) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    await logEvent("product.like", { productId: liked.product.id });
    await logScore("product_efficiency", liked.product.id, liked.score.efficiencyScore, liked.score);
    res.json({ ...summarizeProduct(liked.product), score: liked.score });
  });

  app.get("/api/leaderboard/products", (req, res) => {
    const limit = Number(req.query.limit ?? 10);
    const rows = service.productLeaderboard(Number.isFinite(limit) ? limit : 10);
    res.json(rows.map(({ product, score }, i) => ({ rank: i + 1, ...summarizeProduct(product), score })));
  });

  app.get("/api/leaderboard/sellers", async (req, res) => {
    const limit = Number(req.query.limit ?? 10);
    const rows = service.sellerLeaderboard(Number.isFinite(limit) ? limit : 10);

    for (const row of rows) {
      await logScore("seller_business_health", row.sellerId, row.businessHealthScore, row);
    }

    res.json(rows.map((row, i) => ({ rank: i + 1, ...row })));
  });

  app.post("/api/orders", requireAuth, requireRole("buyer"), async (req, res) => {
    try {
      const input = createOrderSchema.parse(req.body);
      const order = service.createOrder(req.auth!.sub, input.productId);
      await logEvent("order.created", order);
      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.get("/api/orders/me", requireAuth, requireRole("buyer"), (req, res) => {
    res.json(service.listOrdersForBuyer(req.auth!.sub));
  });

  app.get("/api/seller/finance", requireAuth, requireRole("seller"), (req, res) => {
    if (!req.auth!.sellerId) {
      res.status(400).json({ error: "Seller account is missing sellerId" });
      return;
    }
    res.json(service.getSellerFinance(req.auth!.sellerId));
  });

  app.post("/api/seller/payouts/request", requireAuth, requireRole("seller"), async (req, res) => {
    try {
      if (!req.auth!.sellerId) {
        res.status(400).json({ error: "Seller account is missing sellerId" });
        return;
      }

      const payout = service.requestPayout(req.auth!.sellerId, req.auth!.sub);
      await logEvent("payout.requested", payout);
      res.status(201).json(payout);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.post("/api/messages", requireAuth, async (req, res) => {
    try {
      const input = sendMessageSchema.parse(req.body);
      const message = service.sendMessage({
        productId: input.productId,
        toSellerId: input.toSellerId,
        body: input.body,
        fromUserId: req.auth!.sub,
      });
      await logEvent("message.sent", message);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.post("/api/messages/reply", requireAuth, requireRole("seller"), async (req, res) => {
    try {
      const input = sendReplySchema.parse(req.body);
      const message = service.sendSellerReply({
        productId: input.productId,
        toUserId: input.toUserId,
        body: input.body,
        fromSellerUserId: req.auth!.sub,
      });
      await logEvent("message.reply", message);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.get("/api/messages/thread", requireAuth, (req, res) => {
    const productId = typeof req.query.productId === "string" ? req.query.productId : "";
    const withUserId = typeof req.query.withUserId === "string" ? req.query.withUserId : "";
    if (!productId || !withUserId) {
      res.status(400).json({ error: "productId and withUserId are required" });
      return;
    }

    res.json(service.thread(productId, req.auth!.sub, withUserId));
  });

  app.get("/api/sla/seller", requireAuth, requireRole("seller"), (req, res) => {
    res.json(service.computeSellerSla(req.auth!.sub));
  });

  app.get("/api/policy/products/:id", (req, res) => {
    try {
      const policy = service.evaluatePolicy(req.params.id);
      res.json(policy);
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  });

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const webRoot = path.resolve(__dirname, "../web");
  app.use(express.static(webRoot));
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(webRoot, "index.html"));
  });

  return app;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const port = Number(process.env.PORT ?? 4173);
  createApp()
    .then((app) => {
      app.listen(port, () => {
        console.log(`Ruleset AI Marketplace running at http://localhost:${port}`);
      });
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
