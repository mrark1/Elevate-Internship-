import dotenv from 'dotenv';
import { z } from 'zod';
dotenv.config();

const schema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_FILE: z.string().min(1).default('./data/credvault.sqlite'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long').default('development-only-secret-change-this-123456'),
  JWT_EXPIRES_IN: z.string().default('2h'),
  ADMIN_USERNAME: z.string().min(1).default('admin'),
  ADMIN_PASSWORD: z.string().min(1).default('admin'),
  CORS_ORIGIN: z.string().default('http://localhost:5173')
});
const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}
export const config = parsed.data;
