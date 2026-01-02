import { Effect } from "effect";
import { searchSimilar } from "@ai-bookmark/db";
import { DatabaseError } from "@ai-bookmark/common";
import { DatabaseService } from "./database.js";
import { EmbeddingService } from "./embedding.js";

export class SearchService extends Effect.Service<SearchService>()(
  "SearchService",
  {
    effect: Effect.gen(function* () {
      const { db } = yield* DatabaseService;
      const embeddingService = yield* EmbeddingService;

      const search = (userId: string, query: string, limit: number = 10) =>
        Effect.gen(function* () {
          // Generate embedding for query
          const queryEmbedding =
            yield* embeddingService.generateEmbedding(query);

          // Search for similar embeddings
          const results = yield* Effect.tryPromise({
            try: () => searchSimilar(db, userId, queryEmbedding, limit),
            catch: (error) =>
              new DatabaseError({
                message: "Failed to search bookmarks",
                cause: error,
              }),
          });

          // Deduplicate by bookmark ID, keeping highest similarity
          const bookmarkMap = new Map<
            string,
            {
              bookmark: {
                id: string;
                userId: string;
                url: string;
                title: string;
                markdown: string;
                favicon: string | null;
                createdAt: Date;
                updatedAt: Date;
              };
              matchedChunk: string;
              similarity: number;
            }
          >();

          for (const row of results) {
            const existing = bookmarkMap.get(row.bookmark_id);
            if (!existing || existing.similarity < row.similarity) {
              bookmarkMap.set(row.bookmark_id, {
                bookmark: {
                  id: row.bookmark_id,
                  userId,
                  url: row.url,
                  title: row.title,
                  markdown: row.markdown,
                  favicon: row.favicon,
                  createdAt: row.created_at,
                  updatedAt: row.updated_at,
                },
                matchedChunk: row.matched_chunk,
                similarity: row.similarity,
              });
            }
          }

          return {
            results: Array.from(bookmarkMap.values()).sort(
              (a, b) => b.similarity - a.similarity
            ),
            query,
            totalResults: bookmarkMap.size,
          };
        });

      return { search };
    }),
    dependencies: [DatabaseService.Default, EmbeddingService.Default],
  }
) {}

export const SearchServiceLive = SearchService.Default;
