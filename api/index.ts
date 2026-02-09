import serverless from "serverless-http";
import { createApp } from "../src/app.js";

let cachedHandler: ((req: any, res: any) => Promise<unknown>) | null = null;

async function getHandler() {
  if (!cachedHandler) {
    const app = await createApp();
    const h = serverless(app);
    cachedHandler = (req, res) => h(req, res);
  }
  return cachedHandler;
}

export default async function handler(req: any, res: any) {
  const h = await getHandler();
  return h(req, res);
}

