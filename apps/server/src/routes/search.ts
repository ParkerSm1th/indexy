import { Hono } from "hono";
import { Effect, Exit } from "effect";
import { Schema } from "effect";
import { SearchQuery } from "@ai-bookmark/common";
import { SearchService } from "../services/search.js";
import { getUserId } from "../middleware/auth.js";
import type { AppEnv } from "../index.js";

export const searchRouter = new Hono<AppEnv>();

// Semantic search
searchRouter.post("/", async (c) => {
  const userId = getUserId(c);
  const body = await c.req.json();

  const parseResult = Schema.decodeUnknownEither(SearchQuery)(body);
  if (parseResult._tag === "Left") {
    return c.json(
      { error: "Invalid request body", code: "VALIDATION_ERROR" },
      400
    );
  }

  const { query, limit } = parseResult.right;
  const appLayer = c.get("appLayer");

  const result = await Effect.runPromiseExit(
    SearchService.pipe(
      Effect.flatMap((service) => service.search(userId, query, limit ?? 10)),
      Effect.provide(appLayer)
    )
  );

  if (Exit.isFailure(result)) {
    console.error("Failed to search:", result.cause);
    return c.json({ error: "Failed to search", code: "INTERNAL_ERROR" }, 500);
  }

  return c.json({ success: true, data: result.value });
});
