import { Schema } from "effect";
import { Bookmark } from "./bookmark.js";

export const SearchQuery = Schema.Struct({
  query: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(1000)),
  limit: Schema.optional(
    Schema.Number.pipe(
      Schema.int(),
      Schema.greaterThanOrEqualTo(1),
      Schema.lessThanOrEqualTo(50)
    )
  ),
});

export const SearchResultItem = Schema.Struct({
  bookmark: Bookmark,
  matchedChunk: Schema.String,
  similarity: Schema.Number.pipe(
    Schema.greaterThanOrEqualTo(0),
    Schema.lessThanOrEqualTo(1)
  ),
});

export const SearchResult = Schema.Struct({
  results: Schema.Array(SearchResultItem),
  query: Schema.String,
  totalResults: Schema.Number.pipe(
    Schema.int(),
    Schema.greaterThanOrEqualTo(0)
  ),
});
