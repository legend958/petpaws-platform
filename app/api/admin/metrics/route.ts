import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { userRole, errorResponse, VALID_ROLES } from "@/lib/request";

// GET /api/admin/metrics — platform analytics.
// POST /api/admin/metrics — admin updates a user's access level (their role).

async function requireAdmin(req: NextRequest) {
  if (userRole(req) !== "admin") {
    return errorResponse("Admin role required.", 403);
  }
  return null;
}

export async function GET(req: NextRequest) {
  const forbidden = await requireAdmin(req);
  if (forbidden) return forbidden;

  const eventRows = (await sql.query(`
    SELECT event_type, COUNT(*)::int AS count
    FROM analytics_logs
    GROUP BY event_type;
  `)) as Array<{ event_type: string; count: number }>;

  const userRows = (await sql.query(`
    SELECT role, COUNT(*)::int AS count
    FROM users
    GROUP BY role;
  `)) as Array<{ role: string; count: number }>;

  const countByEvent = Object.fromEntries(eventRows.map((r) => [r.event_type, r.count]));
  const usersByRole = Object.fromEntries(userRows.map((r) => [r.role, r.count]));
  const totalUsers = Object.values(usersByRole).reduce((a: number, b: number) => a + b, 0);

  return NextResponse.json({
    visits: countByEvent.page_visit ?? 0,
    registrations: countByEvent.registration ?? 0,
    guest_views: countByEvent.guest_view ?? 0,
    total_users: totalUsers,
    users_by_role: usersByRole,
  });
}

export async function POST(req: NextRequest) {
  const forbidden = await requireAdmin(req);
  if (forbidden) return forbidden;

  const body = await req.json().catch(() => null);
  if (!body || !Number.isInteger(body.user_id) || !VALID_ROLES.includes(body.role)) {
    return errorResponse(`Provide user_id and a valid role (${VALID_ROLES.join(", ")}).`, 400);
  }

  const updated = await sql.query(
    `UPDATE users SET role = $2 WHERE id = $1 RETURNING id, name, email, role`,
    [body.user_id, body.role]
  );
  if (updated.length === 0) {
    return errorResponse("User not found.", 404);
  }

  return NextResponse.json({ updated: updated[0] });
}