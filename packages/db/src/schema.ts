import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  index,
  vector,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users table - synced from Clerk webhooks
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user ID
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  bookmarks: many(bookmarks),
}));

// Bookmarks table - saved pages
export const bookmarks = pgTable(
  "bookmarks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    title: text("title").notNull(),
    markdown: text("markdown").notNull(),
    favicon: text("favicon"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("bookmarks_user_id_idx").on(table.userId),
    index("bookmarks_created_at_idx").on(table.createdAt),
  ]
);

export const bookmarksRelations = relations(bookmarks, ({ one, many }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
  embeddings: many(embeddings),
}));

// Embeddings table - vector chunks for semantic search
export const embeddings = pgTable(
  "embeddings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookmarkId: uuid("bookmark_id")
      .notNull()
      .references(() => bookmarks.id, { onDelete: "cascade" }),
    content: text("content").notNull(), // The chunk text
    embedding: vector("embedding", { dimensions: 1536 }).notNull(), // OpenAI text-embedding-3-small
    chunkIndex: integer("chunk_index").notNull(),
  },
  (table) => [
    index("embeddings_bookmark_id_idx").on(table.bookmarkId),
    // HNSW index for fast approximate nearest neighbor search
    index("embeddings_vector_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  ]
);

export const embeddingsRelations = relations(embeddings, ({ one }) => ({
  bookmark: one(bookmarks, {
    fields: [embeddings.bookmarkId],
    references: [bookmarks.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Bookmark = typeof bookmarks.$inferSelect;
export type NewBookmark = typeof bookmarks.$inferInsert;
export type Embedding = typeof embeddings.$inferSelect;
export type NewEmbedding = typeof embeddings.$inferInsert;
