import { Data } from "effect";

export class BookmarkNotFoundError extends Data.TaggedError(
  "BookmarkNotFoundError"
)<{
  readonly bookmarkId: string;
}> {}

export class UnauthorizedError extends Data.TaggedError("UnauthorizedError")<{
  readonly message: string;
}> {}

export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly message: string;
  readonly field?: string;
}> {}

export class EmbeddingError extends Data.TaggedError("EmbeddingError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export type AppError =
  | BookmarkNotFoundError
  | UnauthorizedError
  | ValidationError
  | EmbeddingError
  | DatabaseError;
