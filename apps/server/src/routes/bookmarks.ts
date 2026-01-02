import { Hono } from "hono";
import { Effect, Exit } from "effect";
import { Schema } from "effect";
import { BookmarkCreate, PaginationParams } from "@ai-bookmark/common";
import { BookmarkService } from "../services/bookmark.js";
import { getUserId } from "../middleware/auth.js";
import type { AppEnv } from "../index.js";

export const bookmarksRouter = new Hono<AppEnv>();

// Create bookmark
bookmarksRouter.post("/", async (c) => {
  const userId = getUserId(c);
  const body = await c.req.json();

  const parseResult = Schema.decodeUnknownEither(BookmarkCreate)(body);
  if (parseResult._tag === "Left") {
    return c.json(
      { error: "Invalid request body", code: "VALIDATION_ERROR" },
      400
    );
  }

  const input = parseResult.right;
  const appLayer = c.get("appLayer");

  const result = await Effect.runPromiseExit(
    BookmarkService.pipe(
      Effect.flatMap((service) => service.create(userId, input)),
      Effect.provide(appLayer)
    )
  );

  if (Exit.isFailure(result)) {
    const error = result.cause;
    console.error("Failed to create bookmark:", error);
    return c.json(
      { error: "Failed to create bookmark", code: "INTERNAL_ERROR" },
      500
    );
  }

  return c.json({ success: true, data: result.value }, 201);
});

// List bookmarks
bookmarksRouter.get("/", async (c) => {
  const userId = getUserId(c);
  const page = parseInt(c.req.query("page") ?? "1");
  const pageSize = parseInt(c.req.query("pageSize") ?? "20");

  const appLayer = c.get("appLayer");

  const result = await Effect.runPromiseExit(
    BookmarkService.pipe(
      Effect.flatMap((service) => service.list(userId, page, pageSize)),
      Effect.provide(appLayer)
    )
  );

  if (Exit.isFailure(result)) {
    console.error("Failed to list bookmarks:", result.cause);
    return c.json(
      { error: "Failed to list bookmarks", code: "INTERNAL_ERROR" },
      500
    );
  }

  return c.json({ success: true, data: result.value });
});

// Get single bookmark
bookmarksRouter.get("/:id", async (c) => {
  const userId = getUserId(c);
  const bookmarkId = c.req.param("id");

  const appLayer = c.get("appLayer");

  const result = await Effect.runPromiseExit(
    BookmarkService.pipe(
      Effect.flatMap((service) => service.getById(userId, bookmarkId)),
      Effect.provide(appLayer)
    )
  );

  if (Exit.isFailure(result)) {
    const cause = result.cause;
    if (cause._tag === "Fail" && cause.error._tag === "BookmarkNotFoundError") {
      return c.json({ error: "Bookmark not found", code: "NOT_FOUND" }, 404);
    }
    console.error("Failed to get bookmark:", cause);
    return c.json(
      { error: "Failed to get bookmark", code: "INTERNAL_ERROR" },
      500
    );
  }

  return c.json({ success: true, data: result.value });
});

// Delete bookmark
bookmarksRouter.delete("/:id", async (c) => {
  const userId = getUserId(c);
  const bookmarkId = c.req.param("id");

  const appLayer = c.get("appLayer");

  const result = await Effect.runPromiseExit(
    BookmarkService.pipe(
      Effect.flatMap((service) => service.remove(userId, bookmarkId)),
      Effect.provide(appLayer)
    )
  );

  if (Exit.isFailure(result)) {
    const cause = result.cause;
    if (cause._tag === "Fail" && cause.error._tag === "BookmarkNotFoundError") {
      return c.json({ error: "Bookmark not found", code: "NOT_FOUND" }, 404);
    }
    console.error("Failed to delete bookmark:", cause);
    return c.json(
      { error: "Failed to delete bookmark", code: "INTERNAL_ERROR" },
      500
    );
  }

  return c.json({ success: true });
});
