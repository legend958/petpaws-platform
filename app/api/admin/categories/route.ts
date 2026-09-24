import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { userRole, errorResponse } from "@/lib/request";

// POST /api/admin/categories — add a new species category (e.g. Birds, Reptiles).

export async function POST(req: NextRequest) {
  if (userRole(req) !== "admin") return errorResponse("Admin role required.", 403);

  const body = await req.json().catch(() => null);
  if (!body || typeof body.name !== "string" || body.name.trim() === "") {
    return errorResponse("Provide a category name.", 400);
  }
  const name = body.name.trim();

  const taken = await sql.query(`SELECT id FROM categories WHERE name = $1`, [name]);
  if (taken.length > 0) return errorResponse("That category already exists.", 409);

  const created = await sql.query(
    `INSERT INTO categories (name) VALUES ($1) RETURNING id, name`,
    [name]
  );
  return NextResponse.json({ created: created[0] }, { status: 201 });
}