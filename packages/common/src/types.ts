import type { Schema } from "effect";
import type {
  Bookmark,
  BookmarkCreate,
  BookmarkWithChunks,
} from "./schemas/bookmark.js";
import type { SearchQuery, SearchResult } from "./schemas/search.js";

// Inferred types from schemas
export type BookmarkType = Schema.Schema.Type<typeof Bookmark>;
export type BookmarkCreateType = Schema.Schema.Type<typeof BookmarkCreate>;
export type BookmarkWithChunksType = Schema.Schema.Type<
  typeof BookmarkWithChunks
>;
export type SearchQueryType = Schema.Schema.Type<typeof SearchQuery>;
export type SearchResultType = Schema.Schema.Type<typeof SearchResult>;

// User type (from Clerk)
export interface User {
  id: string;
  email: string;
  createdAt: Date;
}

// Embedding chunk
export interface EmbeddingChunk {
  id: string;
  bookmarkId: string;
  content: string;
  embedding: number[];
  chunkIndex: number;
}
