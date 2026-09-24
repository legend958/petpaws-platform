import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { errorResponse } from "@/lib/request";

// POST /api/analytics — the frontend reports demo events here so the
// Admin dashboard has real numbers to show.

const ALLOWED_EVENTS = ["page_visit", "guest_view", "registration"];

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !ALLOWED_EVENTS.includes(body.event_type)) {
    return errorResponse(`event_type must be one of: ${ALLOWED_EVENTS.join(", ")}.`, 400);
  }
  await sql.query(`INSERT INTO analytics_logs (event_type) VALUES ($1)`, [body.event_type]);
  return NextResponse.json({ ok: true });
}