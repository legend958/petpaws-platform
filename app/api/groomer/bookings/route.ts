import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { userId, errorResponse } from "@/lib/request";

// GET /api/groomer/bookings — registered-customer bookings on this groomer's sessions.

export async function GET(req: NextRequest) {
  const groomerId = userId(req);
  if (!groomerId) return errorResponse("Log in as a groomer.", 401);

  const bookings = (await sql.query(
    `SELECT a.id, gs.id AS session_id, s.title AS service_title,
            gs.available_time, gs.discounted_price, gs.is_free_session,
            u.name AS customer_name, u.email AS customer_email,
            p.name AS pet_name, p.species, a.status, a.created_at
     FROM appointments a
     INNER JOIN groomer_sessions gs ON gs.id = a.session_id
     INNER JOIN services s ON s.id = gs.service_id
     INNER JOIN users u ON u.id = a.user_id
     INNER JOIN pets p ON p.id = a.pet_id
     WHERE gs.groomer_id = $1
     ORDER BY gs.available_time`,
    [groomerId]
  )) as Array<Record<string, any>>;

  return NextResponse.json({ bookings });
}