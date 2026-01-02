import { Schema } from "effect";

export const ApiErrorResponse = Schema.Struct({
  error: Schema.String,
  code: Schema.String,
  details: Schema.optional(Schema.Unknown),
});

export const ApiSuccessResponse = <T extends Schema.Schema.Any>(data: T) =>
  Schema.Struct({
    success: Schema.Literal(true),
    data,
  });

export const PaginationParams = Schema.Struct({
  page: Schema.optional(
    Schema.NumberFromString.pipe(
      Schema.int(),
      Schema.greaterThanOrEqualTo(1)
    )
  ),
  pageSize: Schema.optional(
    Schema.NumberFromString.pipe(
      Schema.int(),
      Schema.greaterThanOrEqualTo(1),
      Schema.lessThanOrEqualTo(100)
    )
  ),
});

export const IdParam = Schema.Struct({
  id: Schema.UUID,
});
