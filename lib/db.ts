import { neon } from "@neondatabase/serverless";

// Shared database connection used by every API route.
// DATABASE_URL comes from .env.local (dev) or Vercel env vars (production).
export const sql = neon(process.env.DATABASE_URL!);