import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import type { Role } from "../marketplace/types.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-only-change-me";
const JWT_EXPIRES = "7d";

export type AuthClaims = {
  sub: string;
  email: string;
  role: Role;
  sellerId?: string;
};

export function signAuthToken(claims: AuthClaims): string {
  return jwt.sign(claims, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyAuthToken(token: string): AuthClaims {
  const decoded = jwt.verify(token, JWT_SECRET) as AuthClaims;
  return decoded;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthClaims;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }

  try {
    const token = header.slice("Bearer ".length);
    req.auth = verifyAuthToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (!roles.includes(req.auth.role)) {
      res.status(403).json({ error: "Insufficient role" });
      return;
    }
    next();
  };
}
