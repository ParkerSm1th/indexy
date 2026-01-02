import { verifyToken } from "@clerk/backend";
import type { Context, Next } from "hono";

export interface AuthContext {
  userId: string;
}

export const createAuthMiddleware = (clerkSecretKey: string) => {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: "Missing authorization header", code: "UNAUTHORIZED" }, 401);
    }

    const token = authHeader.slice(7);

    try {
      const payload = await verifyToken(token, {
        secretKey: clerkSecretKey,
      });

      if (!payload.sub) {
        return c.json({ error: "Invalid token: no subject", code: "UNAUTHORIZED" }, 401);
      }

      c.set("userId", payload.sub);
      await next();
    } catch (error) {
      console.error("Token verification failed:", error);
      return c.json({ error: "Invalid token", code: "UNAUTHORIZED" }, 401);
    }
  };
};

export const getUserId = (c: Context): string => {
  const userId = c.get("userId");
  if (!userId) {
    throw new Error("User ID not found in context");
  }
  return userId;
};
