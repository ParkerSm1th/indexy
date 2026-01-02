import { Effect, Layer } from "effect";
import { createDb, type Database } from "@ai-bookmark/db";
import { AppConfig } from "../config.js";

export class DatabaseService extends Effect.Service<DatabaseService>()(
  "DatabaseService",
  {
    effect: Effect.gen(function* () {
      const config = yield* AppConfig;
      const db = createDb(config.databaseUrl);

      return { db };
    }),
    dependencies: [AppConfig.Default],
  }
) {}

export const DatabaseServiceLive = DatabaseService.Default;
