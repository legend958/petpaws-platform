import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { userId, errorResponse } from "@/lib/request";

// GET /api/groomer/sessions — sessions belonging to the signed-in groomer.

export async function GET(req: NextRequest) {
  const groomerId = userId(req);
  if (!groomerId) return errorResponse("Log in as a groomer.", 401);

  const row = await sql.query(`SELECT id FROM users WHERE id = $1`, [groomerId]);
  if (row.length === 0) return errorResponse("That user does not exist.", 401);

  const sessions = (await sql.query(
    `SELECT gs.id, s.title AS service_title, c.name AS category,
            gs.available_time, gs.discounted_price, gs.is_free_session, gs.status
     FROM groomer_sessions gs
     INNER JOIN services s ON s.id = gs.service_id
     INNER JOIN categories c ON c.id = s.category_id
     WHERE gs.groomer_id = $1
     ORDER BY gs.available_time`,
    [groomerId]
  )) as Array<Record<string, any>>;

  return NextResponse.json({ sessions });
}