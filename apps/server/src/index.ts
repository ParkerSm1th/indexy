import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { Effect, Layer } from "effect";

import { AppConfig, AppConfigLive } from "./config.js";
import { DatabaseService, DatabaseServiceLive } from "./services/database.js";
import { EmbeddingService, EmbeddingServiceLive } from "./services/embedding.js";
import { BookmarkService, BookmarkServiceLive } from "./services/bookmark.js";
import { SearchService, SearchServiceLive } from "./services/search.js";
import { UserService, UserServiceLive } from "./services/user.js";
import { createAuthMiddleware } from "./middleware/auth.js";

import { bookmarksRouter } from "./routes/bookmarks.js";
import { searchRouter } from "./routes/search.js";
import { webhooksRouter } from "./routes/webhooks.js";

// App runtime layer - all services combined
const AppLayer = Layer.mergeAll(
  AppConfigLive,
  DatabaseServiceLive,
  EmbeddingServiceLive,
  BookmarkServiceLive,
  SearchServiceLive,
  UserServiceLive
);

export type AppLayerType = typeof AppLayer;

export type AppEnv = {
  Variables: {
    userId: string;
    appLayer: AppLayerType;
    webhookSecret: string;
  };
};

const main = Effect.gen(function* () {
  const config = yield* AppConfig;

  const app = new Hono<AppEnv>();

  // Global middleware
  app.use("*", logger());
  app.use(
    "*",
    cors({
      origin: ["http://localhost:3000", config.apiUrl],
      credentials: true,
    })
  );

  // Inject layer into context
  app.use("*", async (c, next) => {
    c.set("appLayer", AppLayer);
    c.set("webhookSecret", config.clerkWebhookSecret);
    await next();
  });

  // Health check
  app.get("/api/health", (c) => c.json({ status: "ok" }));

  // Public webhook routes (no auth)
  app.route("/api/webhooks", webhooksRouter);

  // Protected routes
  const authMiddleware = createAuthMiddleware(config.clerkSecretKey);
  app.use("/api/bookmarks/*", authMiddleware);
  app.use("/api/search/*", authMiddleware);

  app.route("/api/bookmarks", bookmarksRouter);
  app.route("/api/search", searchRouter);

  // Start server
  console.log(`Server starting on port ${config.port}...`);

  serve({
    fetch: app.fetch,
    port: config.port,
  });

  console.log(`Server running at http://localhost:${config.port}`);

  // Keep the server running
  yield* Effect.never;
});

// Run the application
Effect.runPromise(
  main.pipe(Effect.provide(AppConfigLive))
).catch((error) => {
  console.error("Server failed to start:", error);
  process.exit(1);
});
