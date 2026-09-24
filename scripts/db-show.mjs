// db:show — read-only viewer: prints the seeded rows with JOINs.
// Run with: npm run db:show

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function printTable(title, query) {
  const rows = await sql.query(query);
  console.log(`\n=== ${title} ===`);
  console.table(rows);
}

await printTable(
  "users",
  `SELECT id, name, email, role, is_guest FROM users ORDER BY id;`
);

await printTable(
  "categories",
  `SELECT id, name FROM categories ORDER BY id;`
);

await printTable(
  "pets (with owner)",
  `SELECT pets.id, pets.name, pets.species, pets.breed, users.name AS owner
   FROM pets
   INNER JOIN users ON users.id = pets.user_id
   ORDER BY pets.id;`
);

await printTable(
  "services (with category)",
  `SELECT services.id, categories.name AS category, services.title,
          services.base_price, services.location_type
   FROM services
   INNER JOIN categories ON categories.id = services.category_id
   ORDER BY services.id;`
);

await printTable(
  "products",
  `SELECT id, title, price, delivery_mode, stock_quantity FROM products ORDER BY id;`
);

await printTable(
  "groomer_sessions (with groomer + service)",
  `SELECT groomer_sessions.id,
          users.name AS groomer,
          services.title AS service,
          groomer_sessions.available_time,
          groomer_sessions.discounted_price,
          groomer_sessions.is_free_session,
          groomer_sessions.status
   FROM groomer_sessions
   INNER JOIN users ON users.id = groomer_sessions.groomer_id
   INNER JOIN services ON services.id = groomer_sessions.service_id
   ORDER BY groomer_sessions.id;`
);

console.log("\n✅ db:show complete.");