import { Effect } from "effect";
import OpenAI from "openai";
import { AppConfig } from "../config.js";
import { EmbeddingError } from "@ai-bookmark/common";

const EMBEDDING_MODEL = "text-embedding-3-small";
const CHUNK_SIZE = 500; // tokens (approximate)
const CHUNK_OVERLAP = 50;

export class EmbeddingService extends Effect.Service<EmbeddingService>()(
  "EmbeddingService",
  {
    effect: Effect.gen(function* () {
      const config = yield* AppConfig;
      const openai = new OpenAI({ apiKey: config.openaiApiKey });

      const generateEmbedding = (text: string) =>
        Effect.tryPromise({
          try: async () => {
            const response = await openai.embeddings.create({
              model: EMBEDDING_MODEL,
              input: text,
            });
            return response.data[0]!.embedding;
          },
          catch: (error) =>
            new EmbeddingError({
              message: "Failed to generate embedding",
              cause: error,
            }),
        });

      const generateEmbeddings = (texts: string[]) =>
        Effect.tryPromise({
          try: async () => {
            const response = await openai.embeddings.create({
              model: EMBEDDING_MODEL,
              input: texts,
            });
            return response.data.map((d) => d.embedding);
          },
          catch: (error) =>
            new EmbeddingError({
              message: "Failed to generate embeddings",
              cause: error,
            }),
        });

      const chunkText = (text: string): string[] => {
        // Simple chunking by paragraphs then by size
        const paragraphs = text.split(/\n\n+/);
        const chunks: string[] = [];
        let currentChunk = "";

        for (const paragraph of paragraphs) {
          // Approximate token count (1 token ≈ 4 chars)
          const paragraphTokens = Math.ceil(paragraph.length / 4);
          const currentTokens = Math.ceil(currentChunk.length / 4);

          if (currentTokens + paragraphTokens > CHUNK_SIZE && currentChunk) {
            chunks.push(currentChunk.trim());
            // Keep overlap from end of previous chunk
            const words = currentChunk.split(" ");
            const overlapWords = words.slice(
              -Math.ceil(CHUNK_OVERLAP / 2)
            );
            currentChunk = overlapWords.join(" ") + "\n\n" + paragraph;
          } else {
            currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
          }
        }

        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }

        return chunks.length > 0 ? chunks : [text];
      };

      return {
        generateEmbedding,
        generateEmbeddings,
        chunkText,
      };
    }),
    dependencies: [AppConfig.Default],
  }
) {}

export const EmbeddingServiceLive = EmbeddingService.Default;
