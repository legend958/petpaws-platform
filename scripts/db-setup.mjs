// db:setup — applies db/schema.sql then db/seed.sql to the Neon database.
// Run with: npm run db:setup
//
// Why drop tables first? So the script can be re-run safely during
// development without colliding with tables/data from a previous run.

import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set.");
  console.error("Create a .env.local file containing: DATABASE_URL=postgresql://...");
  process.exit(1);
}

const sql = neon(connectionString);

// Tables must be dropped child-first, then parents (CASCADE makes order forgiving).
const DROP_STATEMENTS = [
  "DROP TABLE IF EXISTS analytics_logs CASCADE",
  "DROP TABLE IF EXISTS orders CASCADE",
  "DROP TABLE IF EXISTS cart_items CASCADE",
  "DROP TABLE IF EXISTS appointments CASCADE",
  "DROP TABLE IF EXISTS groomer_sessions CASCADE",
  "DROP TABLE IF EXISTS products CASCADE",
  "DROP TABLE IF EXISTS services CASCADE",
  "DROP TABLE IF EXISTS categories CASCADE",
  "DROP TABLE IF EXISTS pets CASCADE",
  "DROP TABLE IF EXISTS users CASCADE",
];

// Turn a SQL file into individual statements.
function splitStatements(text) {
  // 1) Remove full-line comments (-- lines).
  const noComments = text
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
  // 2) Split on ';' that end a line (or the end of the file).
  return noComments
    .split(/;\s*(\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
}

async function runStatements(label, statements) {
  for (const statement of statements) {
    await sql.query(statement);
  }
  console.log(`${label}: applied ${statements.length} statement(s)`);
}

const schemaText = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
const seedText = await readFile(new URL("../db/seed.sql", import.meta.url), "utf8");

console.log("Dropping existing tables (development reset)...");
await runStatements("drop", DROP_STATEMENTS);

console.log("Applying schema.sql...");
await runStatements("schema", splitStatements(schemaText));

console.log("Applying seed.sql...");
await runStatements("seed", splitStatements(seedText));

// Verify: print a row count for every table.
const counts = await sql`
  SELECT 'users' AS table_name, COUNT(*) AS row_count FROM users
  UNION ALL SELECT 'pets', COUNT(*) FROM pets
  UNION ALL SELECT 'categories', COUNT(*) FROM categories
  UNION ALL SELECT 'services', COUNT(*) FROM services
  UNION ALL SELECT 'groomer_sessions', COUNT(*) FROM groomer_sessions
  UNION ALL SELECT 'products', COUNT(*) FROM products
  UNION ALL SELECT 'appointments', COUNT(*) FROM appointments
  UNION ALL SELECT 'cart_items', COUNT(*) FROM cart_items
  UNION ALL SELECT 'orders', COUNT(*) FROM orders
  UNION ALL SELECT 'analytics_logs', COUNT(*) FROM analytics_logs
  ORDER BY table_name;
`;
console.log("\nRow counts per table:");
console.table(counts);

console.log("\n✅ db:setup completed successfully.");