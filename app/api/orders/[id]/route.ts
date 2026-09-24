import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { userId, errorResponse } from "@/lib/request";

// GET /api/orders/[id] — receipt for one order + upcoming appointment reminders.

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const customerId = userId(req);
  if (!customerId) return errorResponse("Log in to view your order.", 401);
  const { id } = await context.params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) return errorResponse("Invalid order id.", 400);

  const order = await sql.query(
    `SELECT id, user_id, total_amount, payment_status, created_at FROM orders WHERE id = $1 AND user_id = $2`,
    [orderId, customerId]
  );
  if (order.length === 0) return errorResponse("Order not found.", 404);

  const appointments = (await sql.query(
    `SELECT a.id, p.name AS pet_name, p.species,
            s.title AS service_title, gs.available_time, gs.discounted_price,
            gs.is_free_session, u.name AS groomer_name, a.status
     FROM appointments a
     INNER JOIN pets p ON p.id = a.pet_id
     INNER JOIN groomer_sessions gs ON gs.id = a.session_id
     INNER JOIN services s ON s.id = gs.service_id
     INNER JOIN users u ON u.id = gs.groomer_id
     WHERE a.user_id = $1 AND a.status = 'Confirmed' AND gs.available_time > NOW()
     ORDER BY gs.available_time
     LIMIT 5`,
    [customerId]
  )) as Array<Record<string, any>>;

  return NextResponse.json({ order: order[0], upcoming_appointments: appointments });
}