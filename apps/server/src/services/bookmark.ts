import { Effect } from "effect";
import {
  bookmarks,
  embeddings,
  eq,
  and,
  desc,
  type NewBookmark,
  type NewEmbedding,
} from "@ai-bookmark/db";
import { BookmarkNotFoundError, DatabaseError } from "@ai-bookmark/common";
import { DatabaseService } from "./database.js";
import { EmbeddingService } from "./embedding.js";

export class BookmarkService extends Effect.Service<BookmarkService>()(
  "BookmarkService",
  {
    effect: Effect.gen(function* () {
      const { db } = yield* DatabaseService;
      const embeddingService = yield* EmbeddingService;

      const create = (userId: string, input: Omit<NewBookmark, "userId">) =>
        Effect.gen(function* () {
          // Create bookmark
          const [bookmark] = yield* Effect.tryPromise({
            try: () =>
              db
                .insert(bookmarks)
                .values({ ...input, userId })
                .returning(),
            catch: (error) =>
              new DatabaseError({
                message: "Failed to create bookmark",
                cause: error,
              }),
          });

          if (!bookmark) {
            return yield* Effect.fail(
              new DatabaseError({ message: "Failed to create bookmark" })
            );
          }

          // Chunk and embed content
          const chunks = embeddingService.chunkText(input.markdown);
          const vectors = yield* embeddingService.generateEmbeddings(chunks);

          // Store embeddings
          const embeddingRecords: NewEmbedding[] = chunks.map(
            (content, index) => ({
              bookmarkId: bookmark.id,
              content,
              embedding: vectors[index]!,
              chunkIndex: index,
            })
          );

          yield* Effect.tryPromise({
            try: () => db.insert(embeddings).values(embeddingRecords),
            catch: (error) =>
              new DatabaseError({
                message: "Failed to store embeddings",
                cause: error,
              }),
          });

          return bookmark;
        });

      const getById = (userId: string, bookmarkId: string) =>
        Effect.gen(function* () {
          const [bookmark] = yield* Effect.tryPromise({
            try: () =>
              db
                .select()
                .from(bookmarks)
                .where(
                  and(
                    eq(bookmarks.id, bookmarkId),
                    eq(bookmarks.userId, userId)
                  )
                ),
            catch: (error) =>
              new DatabaseError({
                message: "Failed to fetch bookmark",
                cause: error,
              }),
          });

          if (!bookmark) {
            return yield* Effect.fail(
              new BookmarkNotFoundError({ bookmarkId })
            );
          }

          return bookmark;
        });

      const list = (userId: string, page: number = 1, pageSize: number = 20) =>
        Effect.gen(function* () {
          const offset = (page - 1) * pageSize;

          const [items, countResult] = yield* Effect.all([
            Effect.tryPromise({
              try: () =>
                db
                  .select()
                  .from(bookmarks)
                  .where(eq(bookmarks.userId, userId))
                  .orderBy(desc(bookmarks.createdAt))
                  .limit(pageSize)
                  .offset(offset),
              catch: (error) =>
                new DatabaseError({
                  message: "Failed to list bookmarks",
                  cause: error,
                }),
            }),
            Effect.tryPromise({
              try: async () => {
                const result = await db
                  .select()
                  .from(bookmarks)
                  .where(eq(bookmarks.userId, userId));
                return result.length;
              },
              catch: (error) =>
                new DatabaseError({
                  message: "Failed to count bookmarks",
                  cause: error,
                }),
            }),
          ]);

          return {
            bookmarks: items,
            total: countResult,
            page,
            pageSize,
          };
        });

      const remove = (userId: string, bookmarkId: string) =>
        Effect.gen(function* () {
          // First verify ownership
          yield* getById(userId, bookmarkId);

          yield* Effect.tryPromise({
            try: () =>
              db.delete(bookmarks).where(eq(bookmarks.id, bookmarkId)),
            catch: (error) =>
              new DatabaseError({
                message: "Failed to delete bookmark",
                cause: error,
              }),
          });
        });

      return {
        create,
        getById,
        list,
        remove,
      };
    }),
    dependencies: [DatabaseService.Default, EmbeddingService.Default],
  }
) {}

export const BookmarkServiceLive = BookmarkService.Default;
