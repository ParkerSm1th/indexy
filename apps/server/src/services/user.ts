import { Effect } from "effect";
import { users, eq, type NewUser } from "@ai-bookmark/db";
import { DatabaseError } from "@ai-bookmark/common";
import { DatabaseService } from "./database.js";

export class UserService extends Effect.Service<UserService>()("UserService", {
  effect: Effect.gen(function* () {
    const { db } = yield* DatabaseService;

    const upsert = (user: NewUser) =>
      Effect.tryPromise({
        try: async () => {
          const [result] = await db
            .insert(users)
            .values(user)
            .onConflictDoUpdate({
              target: users.id,
              set: { email: user.email },
            })
            .returning();
          return result!;
        },
        catch: (error) =>
          new DatabaseError({
            message: "Failed to upsert user",
            cause: error,
          }),
      });

    const getById = (userId: string) =>
      Effect.tryPromise({
        try: async () => {
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, userId));
          return user ?? null;
        },
        catch: (error) =>
          new DatabaseError({
            message: "Failed to fetch user",
            cause: error,
          }),
      });

    const remove = (userId: string) =>
      Effect.tryPromise({
        try: () => db.delete(users).where(eq(users.id, userId)),
        catch: (error) =>
          new DatabaseError({
            message: "Failed to delete user",
            cause: error,
          }),
      });

    return { upsert, getById, remove };
  }),
  dependencies: [DatabaseService.Default],
}) {}

export const UserServiceLive = UserService.Default;
