import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { userRole, ROLE_GUEST } from "@/lib/request";

// GET /api/services
// Categorized listing: species -> services -> available groomer sessions.
// Free sessions are hidden from guests (they require registration).

export async function GET(req: NextRequest) {
  const role = userRole(req);

  const rows = (await sql.query(`
    SELECT c.id AS category_id, c.name AS category_name,
           s.id AS service_id, s.title, s.description,
           s.base_price, s.location_type,
           gs.id AS session_id, gs.available_time,
           gs.discounted_price, gs.is_free_session, gs.status,
           u.name AS groomer_name
    FROM categories c
    INNER JOIN services s ON s.category_id = c.id
    LEFT JOIN groomer_sessions gs ON gs.service_id = s.id AND gs.status = 'Available'
    LEFT JOIN users u ON u.id = gs.groomer_id
    ORDER BY c.id, s.id, gs.available_time;
  `)) as Array<Record<string, any>>;

  const categories = new Map<number, any>();

  for (const row of rows) {
    let category = categories.get(row.category_id);
    if (!category) {
      category = { id: row.category_id, name: row.category_name, services: [] };
      categories.set(row.category_id, category);
    }

    let service = category.services.find((s: any) => s.id === row.service_id);
    if (!service) {
      service = {
        id: row.service_id,
        title: row.title,
        description: row.description,
        base_price: row.base_price,
        location_type: row.location_type,
        distance_tag:
          row.location_type === "Office"
            ? "At our salon"
            : "Groomer travels to you",
        available_sessions_count: 0,
        sessions: [],
      };
      category.services.push(service);
    }

    if (row.session_id != null) {
      // Registration-gated: guests never see free sessions.
      if (row.is_free_session && role === ROLE_GUEST) continue;
      service.sessions.push({
        id: row.session_id,
        available_time: row.available_time,
        discounted_price: row.discounted_price,
        is_free_session: row.is_free_session,
        groomer_name: row.groomer_name,
        status: row.status,
      });
      service.available_sessions_count += 1;
    }
  }

  return NextResponse.json({ categories: [...categories.values()] });
}