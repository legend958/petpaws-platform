import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { userRole, userId, VALID_ROLES, errorResponse } from "@/lib/request";

// POST /api/sessions/create
// Groomer creates or updates a session (a bookable time slot).
// Free sessions are flagged for registered users only.

export async function POST(req: NextRequest) {
  const role = userRole(req);
  if (role !== "groomer" && role !== "admin") {
    return errorResponse("Only groomers or admins can manage sessions.", 403);
  }
  const currentUserId = userId(req);

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return errorResponse("Body must be valid JSON.", 400);
  }

  const sessionId: number | null = body.session_id ?? null;
  const serviceId: number | null = body.service_id ?? null;
  const availableTime: string | null = body.available_time ?? null;
  const rawPrice = body.discounted_price;
  const discountedPrice: number | null = rawPrice === undefined || rawPrice === null ? null : Number(rawPrice);
  const isFreeSession: boolean = Boolean(body.is_free_session ?? false);
  const status: string = body.status ?? "Available";
  const requestedGroomerId: number | null = body.groomer_id ?? currentUserId;

  if (sessionId != null) {
    if (serviceId == null && availableTime == null && discountedPrice == null) {
      return errorResponse("Provide at least one field to update.", 400);
    }
  } else {
    if (!serviceId || !availableTime || discountedPrice == null) {
      return errorResponse("service_id, available_time and discounted_price are required to create a session.", 400);
    }
  }

  if (discountedPrice != null && (!Number.isFinite(discountedPrice) || discountedPrice < 0)) {
    return errorResponse("discounted_price must be a non-negative number.", 400);
  }
  // A "free" session must have zero price.
  if (isFreeSession && discountedPrice !== null && discountedPrice !== 0) {
    return errorResponse("A free session must have discounted_price 0.", 400);
  }
  if (status !== "Available" && status !== "Booked") {
    return errorResponse("status must be 'Available' or 'Booked'.", 400);
  }

  if (serviceId != null) {
    const service = await sql.query(`SELECT id FROM services WHERE id = $1`, [serviceId]);
    if (service.length === 0) {
      return errorResponse("service_id does not exist.", 400);
    }
  }

  if (sessionId != null) {
    const existing = (await sql.query(
      `SELECT id, groomer_id FROM groomer_sessions WHERE id = $1`,
      [sessionId]
    )) as Array<{ id: number; groomer_id: number }>;

    if (existing.length === 0) {
      return errorResponse("Session not found.", 404);
    }
    // Non-admin groomers can only edit their own sessions.
    if (role !== "admin" && existing[0].groomer_id !== currentUserId) {
      return errorResponse("You can only update your own sessions.", 403);
    }

    const sets: string[] = [];
    const params: any[] = [];
    if (serviceId != null) { params.push(serviceId); sets.push(`service_id = $${params.length}`); }
    if (availableTime != null) { params.push(availableTime); sets.push(`available_time = $${params.length}`); }
    if (discountedPrice != null) { params.push(discountedPrice.toFixed(2)); sets.push(`discounted_price = $${params.length}`); }
    params.push(isFreeSession); sets.push(`is_free_session = $${params.length}`);
    params.push(status); sets.push(`status = $${params.length}`);
    params.push(sessionId);
    const updated = await sql.query(
      `UPDATE groomer_sessions SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING id, groomer_id, service_id, available_time, discounted_price, is_free_session, status`,
      params
    );
    return NextResponse.json({ session: updated[0], updated: true });
  }

  const created = await sql.query(
    `INSERT INTO groomer_sessions (groomer_id, service_id, available_time, discounted_price, is_free_session, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, groomer_id, service_id, available_time, discounted_price, is_free_session, status`,
    [requestedGroomerId, serviceId, availableTime, (discountedPrice as number).toFixed(2), isFreeSession, status]
  );
  return NextResponse.json({ session: created[0], created: true }, { status: 201 });
}