import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { userId, userRole, errorResponse, VALID_ROLES } from "@/lib/request";

// GET    /api/admin/users           — list all users
// POST   /api/admin/users           — add a user
// DELETE /api/admin/users?user_id=N — remove a user (and their data)

async function requireAdmin(req: NextRequest) {
  if (userRole(req) !== "admin") return errorResponse("Admin role required.", 403);
  return null;
}

export async function GET(req: NextRequest) {
  const forbidden = await requireAdmin(req);
  if (forbidden) return forbidden;

  const users = await sql.query(
    `SELECT id, name, email, role, is_guest, created_at FROM users ORDER BY id`
  );
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const forbidden = await requireAdmin(req);
  if (forbidden) return forbidden;

  const body = await req.json().catch(() => null);
  if (
    !body ||
    typeof body.name !== "string" ||
    body.name.trim() === "" ||
    typeof body.email !== "string" ||
    !body.email.includes("@") ||
    !VALID_ROLES.includes(body.role)
  ) {
    return errorResponse("Provide name, email and a valid role.", 400);
  }

  const taken = await sql.query(`SELECT id FROM users WHERE email = $1`, [body.email.trim().toLowerCase()]);
  if (taken.length > 0) return errorResponse("That email is already registered.", 409);

  const created = await sql.query(
    `INSERT INTO users (name, email, role) VALUES ($1, $2, $3) RETURNING id, name, email, role`,
    [body.name.trim(), body.email.trim().toLowerCase(), body.role]
  );
  return NextResponse.json({ created: created[0] }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const forbidden = await requireAdmin(req);
  if (forbidden) return forbidden;

  const targetId = Number(req.nextUrl.searchParams.get("user_id"));
  const me = userId(req);
  if (!Number.isInteger(targetId)) return errorResponse("Provide ?user_id=<id>.", 400);
  if (targetId === me) return errorResponse("You can't delete your own account.", 400);

  const target = (await sql.query(`SELECT id, role FROM users WHERE id = $1`, [targetId])) as Array<{
    id: number;
    role: string;
  }>;
  if (target.length === 0) return errorResponse("User not found.", 404);

  if (target[0].role === "admin") {
    const adminCount = await sql.query(`SELECT COUNT(*)::int AS n FROM users WHERE role = 'admin'`);
    if (adminCount[0].n <= 1) return errorResponse("Cannot delete the last admin.", 409);
  }

  // Remove the user's data first (children before parent).
  await sql.query(`DELETE FROM cart_items WHERE user_id = $1`, [targetId]);
  await sql.query(
    `DELETE FROM appointments WHERE user_id = $1 OR session_id IN (SELECT id FROM groomer_sessions WHERE groomer_id = $1)`,
    [targetId]
  );
  await sql.query(`DELETE FROM orders WHERE user_id = $1`, [targetId]);
  await sql.query(`DELETE FROM pets WHERE user_id = $1`, [targetId]);
  await sql.query(`DELETE FROM groomer_sessions WHERE groomer_id = $1`, [targetId]);
  await sql.query(`DELETE FROM users WHERE id = $1`, [targetId]);

  return NextResponse.json({ deleted: targetId });
}