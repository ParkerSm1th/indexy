import { sql } from "drizzle-orm";
import type { Database } from "./index.js";
import { embeddings, bookmarks } from "./schema.js";

// Initialize pgvector extension
export const initializeVector = async (db: Database) => {
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`);
};

// Cosine similarity search
export const searchSimilar = async (
  db: Database,
  userId: string,
  queryEmbedding: number[],
  limit: number = 10
) => {
  const vectorStr = `[${queryEmbedding.join(",")}]`;

  const results = await db.execute(sql`
    SELECT
      e.id as embedding_id,
      e.content as matched_chunk,
      e.chunk_index,
      b.id as bookmark_id,
      b.url,
      b.title,
      b.markdown,
      b.favicon,
      b.created_at,
      b.updated_at,
      1 - (e.embedding <=> ${vectorStr}::vector) as similarity
    FROM ${embeddings} e
    JOIN ${bookmarks} b ON e.bookmark_id = b.id
    WHERE b.user_id = ${userId}
    ORDER BY e.embedding <=> ${vectorStr}::vector
    LIMIT ${limit}
  `);

// @ts-ignore
  return results as Array<{
    embedding_id: string;
    matched_chunk: string;
    chunk_index: number;
    bookmark_id: string;
    url: string;
    title: string;
    markdown: string;
    favicon: string | null;
    created_at: Date;
    updated_at: Date;
    similarity: number;
  }>;
};
