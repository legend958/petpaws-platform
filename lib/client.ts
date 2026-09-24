// Client-side helper: attaches the demo identity (role + user id) to every
// request, exactly like the curl headers we used in M3.

const ROLE_KEY = "paw_role";

// Fixed demo personas matching the seeded rows.
export const DEFAULT_USER_IDS: Record<string, number> = {
  customer: 3,
  groomer: 2,
  admin: 1,
};

export type DemoRole = "guest" | "customer" | "groomer" | "admin";

export function getStoredRole(): DemoRole {
  if (typeof window === "undefined") return "guest";
  const role = window.localStorage.getItem(ROLE_KEY);
  return role === "customer" || role === "groomer" || role === "admin" ? role : "guest";
}

export function storeRole(role: DemoRole) {
  window.localStorage.setItem(ROLE_KEY, role);
}

export function demoIdentity(role: DemoRole = getStoredRole()) {
  return {
    role,
    userId: role !== "guest" ? DEFAULT_USER_IDS[role] ?? null : null,
  };
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const { role, userId } = demoIdentity();
  const headers = new Headers(options.headers);
  headers.set("x-user-role", role);
  if (userId !== null) headers.set("x-user-id", String(userId));
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => null);
  return { res, data };
}