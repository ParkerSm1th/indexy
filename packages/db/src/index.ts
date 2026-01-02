import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

export * from "./schema.js";

// Create postgres client
const createClient = (connectionString: string) => {
  return postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
};

// Create drizzle instance
export const createDb = (connectionString: string) => {
  const client = createClient(connectionString);
  return drizzle(client, { schema });
};

export type Database = ReturnType<typeof createDb>;

// SQL template tag for raw queries (needed for pgvector operations)
export { sql } from "drizzle-orm";

// Re-export drizzle operators for queries
export { eq, and, or, desc, asc, like, ilike, isNull } from "drizzle-orm";

export { searchSimilar } from "./vector";