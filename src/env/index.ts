import "dotenv/config";
import { z } from "zod";

const processEnv = (
  globalThis as {
    process?: {
      env?: Record<string, string | undefined>;
    };
  }
).process?.env;

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("production"),
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3333),
});

const parsedEnv = envSchema.safeParse(processEnv);

if (!parsedEnv.success) {
  console.error("Invalid environment variables", parsedEnv.error.format());
  throw new Error("Invalid environment variables.");
}

export const env = parsedEnv.data;
