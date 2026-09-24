"use client";

// The demo "login": switching roles changes the identity headers every
// request sends, which changes what the backend lets you see and do.

import { useDemoRole } from "@/components/RoleProvider";
import type { DemoRole } from "@/lib/client";

const ROLES: Array<{ id: DemoRole; label: string; color: string }> = [
  { id: "guest", label: "Guest", color: "bg-slate-200 text-slate-700" },
  { id: "customer", label: "Customer", color: "bg-rose-200 text-rose-800" },
  { id: "groomer", label: "Groomer", color: "bg-sky-200 text-sky-800" },
  { id: "admin", label: "Admin", color: "bg-violet-200 text-violet-800" },
];

export default function RoleSwitcher() {
  const { role, setRole } = useDemoRole();
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white/70 p-2 shadow-sm">
      <span className="px-2 text-xs font-medium uppercase tracking-wide text-slate-500">
        Demo login
      </span>
      {ROLES.map((r) => (
        <button
          key={r.id}
          onClick={() => setRole(r.id)}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
            role === r.id ? `${r.color} ring-2 ring-white shadow` : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}