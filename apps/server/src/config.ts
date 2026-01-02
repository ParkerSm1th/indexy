import { Config, Effect, Layer } from "effect";

export class AppConfig extends Effect.Service<AppConfig>()("AppConfig", {
  effect: Effect.gen(function* () {
    const databaseUrl = yield* Config.string("DATABASE_URL");
    const openaiApiKey = yield* Config.string("OPENAI_API_KEY");
    const clerkSecretKey = yield* Config.string("CLERK_SECRET_KEY");
    const clerkWebhookSecret = yield* Config.string("CLERK_WEBHOOK_SECRET");
    const port = yield* Config.number("API_PORT").pipe(Config.withDefault(3001));
    const apiUrl = yield* Config.string("API_URL").pipe(
      Config.withDefault("http://localhost:3001")
    );

    return {
      databaseUrl,
      openaiApiKey,
      clerkSecretKey,
      clerkWebhookSecret,
      port,
      apiUrl,
    };
  }),
}) {}

export const AppConfigLive = AppConfig.Default;
