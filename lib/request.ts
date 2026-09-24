import type { NextRequest } from "next/server";

// Demo identity is simulated with role-selector headers instead of a real
// auth library. A missing x-user-role header means "guest".

export const ROLE_GUEST = "guest";
export const VALID_ROLES = ["customer", "groomer", "admin"];

export function userRole(req: NextRequest): string {
  return req.headers.get("x-user-role") ?? ROLE_GUEST;
}

export function userId(req: NextRequest): number | null {
  const raw = req.headers.get("x-user-id");
  if (!raw) return null;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}