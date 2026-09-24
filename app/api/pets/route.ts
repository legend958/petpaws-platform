import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { userId, errorResponse } from "@/lib/request";

// GET /api/pets — the signed-in customer's own pets (used at checkout).

export async function GET(req: NextRequest) {
  const customerId = userId(req);
  if (!customerId) return errorResponse("Log in to see your pets.", 401);

  const pets = await sql.query(
    `SELECT id, name, species, breed FROM pets WHERE user_id = $1 ORDER BY id`,
    [customerId]
  );
  return NextResponse.json({ pets });
}