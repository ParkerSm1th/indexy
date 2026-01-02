import { Schema } from "effect";

export const Bookmark = Schema.Struct({
  id: Schema.UUID,
  userId: Schema.String,
  url: Schema.String.pipe(Schema.filter((s) => s.startsWith("http"))),
  title: Schema.String.pipe(Schema.minLength(1)),
  markdown: Schema.String,
  favicon: Schema.optional(Schema.String),
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
});

export const BookmarkCreate = Schema.Struct({
  url: Schema.String.pipe(Schema.filter((s) => s.startsWith("http"))),
  title: Schema.String.pipe(Schema.minLength(1)),
  markdown: Schema.String.pipe(Schema.minLength(1)),
  favicon: Schema.optional(Schema.String),
});

export const BookmarkChunk = Schema.Struct({
  id: Schema.UUID,
  bookmarkId: Schema.UUID,
  content: Schema.String,
  chunkIndex: Schema.Number.pipe(Schema.int(), Schema.greaterThanOrEqualTo(0)),
});

export const BookmarkWithChunks = Schema.extend(
  Bookmark,
  Schema.Struct({
    chunks: Schema.Array(BookmarkChunk),
  })
);

export const BookmarkListResponse = Schema.Struct({
  bookmarks: Schema.Array(Bookmark),
  total: Schema.Number.pipe(Schema.int(), Schema.greaterThanOrEqualTo(0)),
  page: Schema.Number.pipe(Schema.int(), Schema.greaterThanOrEqualTo(1)),
  pageSize: Schema.Number.pipe(Schema.int(), Schema.greaterThanOrEqualTo(1)),
});
