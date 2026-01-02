import { Hono } from "hono";
import { Effect, Exit } from "effect";
import { Webhook } from "svix";
import { UserService } from "../services/user.js";
import type { AppEnv } from "../index.js";

interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{ email_address: string }>;
  };
}

export const webhooksRouter = new Hono<AppEnv>();

// Clerk webhook handler
webhooksRouter.post("/clerk", async (c) => {
  const webhookSecret = c.get("webhookSecret");
  const payload = await c.req.text();
  const headers = {
    "svix-id": c.req.header("svix-id") ?? "",
    "svix-timestamp": c.req.header("svix-timestamp") ?? "",
    "svix-signature": c.req.header("svix-signature") ?? "",
  };

  let event: ClerkWebhookEvent;

  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(payload, headers) as ClerkWebhookEvent;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return c.json({ error: "Invalid webhook signature" }, 400);
  }

  const appLayer = c.get("appLayer");

  switch (event.type) {
    case "user.created":
    case "user.updated": {
      const email = event.data.email_addresses?.[0]?.email_address ?? "";

      const result = await Effect.runPromiseExit(
        UserService.pipe(
          Effect.flatMap((service) =>
            service.upsert({ id: event.data.id, email })
          ),
          Effect.provide(appLayer)
        )
      );

      if (Exit.isFailure(result)) {
        console.error("Failed to upsert user:", result.cause);
        return c.json({ error: "Failed to process webhook" }, 500);
      }
      break;
    }

    case "user.deleted": {
      const result = await Effect.runPromiseExit(
        UserService.pipe(
          Effect.flatMap((service) => service.remove(event.data.id)),
          Effect.provide(appLayer)
        )
      );

      if (Exit.isFailure(result)) {
        console.error("Failed to delete user:", result.cause);
        return c.json({ error: "Failed to process webhook" }, 500);
      }
      break;
    }
  }

  return c.json({ received: true });
});
