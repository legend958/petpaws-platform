"use client";

import Link from "next/link";
import { useDemoRole } from "@/components/RoleProvider";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/customer", label: "Customer" },
  { href: "/groomer", label: "Groomer" },
  { href: "/admin", label: "Admin" },
  { href: "/checkout", label: "Checkout" },
];

export default function TopNav() {
  const { role } = useDemoRole();
  return (
    <header className="sticky top-0 z-20 border-b border-pink-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-rose-500">
          🐾 PetPaws
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-pink-50 hover:text-rose-500"
            >
              {l.label}
            </Link>
          ))}
          <span className="ml-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {role}
          </span>
        </nav>
      </div>
    </header>
  );
}