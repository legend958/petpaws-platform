"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client";
import { useDemoRole } from "@/components/RoleProvider";
import RoleSwitcher from "@/components/RoleSwitcher";

type Metrics = {
  visits: number;
  registrations: number;
  guest_views: number;
  total_users: number;
  users_by_role: Record<string, number>;
};
type User = { id: number; name: string; email: string; role: string; is_guest: boolean };

export default function Admin() {
  const { role } = useDemoRole();
  const isAdmin = role === "admin";
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [note, setNote] = useState("");

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("customer");
  const [removeId, setRemoveId] = useState("");
  const [promoteId, setPromoteId] = useState("");
  const [promoteRole, setPromoteRole] = useState("groomer");
  const [categoryName, setCategoryName] = useState("");

  async function load() {
    const [m, u] = await Promise.all([
      apiFetch("/api/admin/metrics"),
      apiFetch("/api/admin/users"),
    ]);
    if (m.data) setMetrics(m.data);
    if (u.data) setUsers(u.data.users ?? []);
  }

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  async function addUser() {
    const { data, res } = await apiFetch("/api/admin/users", {
      method: "POST",
      body: JSON.stringify({ name: newName, email: newEmail, role: newRole }),
    });
    setNote(res.ok ? `Added ${newName} ✅` : data?.error ?? "Failed.");
    if (res.ok) { setNewName(""); setNewEmail(""); load(); }
  }

  async function removeUser() {
    if (!removeId) return;
    const { data, res } = await apiFetch(`/api/admin/users?user_id=${removeId}`, { method: "DELETE" });
    setNote(res.ok ? `Removed user ${removeId} ✅` : data?.error ?? "Failed.");
    if (res.ok) { setRemoveId(""); load(); }
  }

  async function changeRole() {
    if (!promoteId) return;
    const { data, res } = await apiFetch("/api/admin/metrics", {
      method: "POST",
      body: JSON.stringify({ user_id: Number(promoteId), role: promoteRole }),
    });
    setNote(res.ok ? `Access level updated ✅` : data?.error ?? "Failed.");
    if (res.ok) load();
  }

  async function addCategory() {
    const { data, res } = await apiFetch("/api/admin/categories", {
      method: "POST",
      body: JSON.stringify({ name: categoryName }),
    });
    setNote(res.ok ? `Added category ${categoryName} ✅` : data?.error ?? "Failed.");
    if (res.ok) setCategoryName("");
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="text-4xl">🛡️</div>
          <h1 className="mt-3 text-2xl font-bold text-slate-800">Admin super user</h1>
          <p className="mt-2 text-sm text-slate-500">
            This area is for the platform admin. Switch your demo role to <b>Admin</b> to see analytics and controls.
          </p>
          <div className="mt-5 flex justify-center">
            <RoleSwitcher />
          </div>
        </div>
      </div>
    );
  }

  const cards = metrics
    ? [
        { label: "App visits", value: metrics.visits, color: "bg-sky-100 text-sky-700" },
        { label: "Registrations", value: metrics.registrations, color: "bg-rose-100 text-rose-700" },
        { label: "Guest views", value: metrics.guest_views, color: "bg-amber-100 text-amber-700" },
        { label: "Total users", value: metrics.total_users, color: "bg-violet-100 text-violet-700" },
      ]
    : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800">Admin super user dashboard</h1>
      <p className="text-sm text-slate-500">Signed in as Alex (admin, id 1)</p>
      {note && <p className="mt-3 rounded-2xl bg-white p-3 text-sm font-medium text-rose-600 shadow-sm">{note}</p>}

      {/* Metrics */}
      <section className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${c.color}`}>{c.label}</div>
            <div className="mt-2 text-3xl font-bold text-slate-800">{c.value}</div>
          </div>
        ))}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Users */}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800">Users</h2>
          <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-pink-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-pink-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-pink-50">
                    <td className="px-3 py-2 font-medium text-slate-700">{u.name}</td>
                    <td className="px-3 py-2 text-slate-500">{u.email}</td>
                    <td className="px-3 py-2">
                      <span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs font-semibold text-pink-700">{u.role}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add user */}
          <h3 className="mt-4 text-sm font-bold text-slate-700">Add user</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" className="min-w-0 flex-1 rounded-xl border border-pink-200 px-3 py-2 text-sm outline-none focus:border-rose-400" />
            <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email" className="min-w-0 flex-1 rounded-xl border border-pink-200 px-3 py-2 text-sm outline-none focus:border-rose-400" />
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="rounded-xl border border-pink-200 px-3 py-2 text-sm">
              <option value="customer">customer</option>
              <option value="groomer">groomer</option>
              <option value="admin">admin</option>
            </select>
            <button onClick={addUser} className="rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">Add</button>
          </div>

          {/* Remove user */}
          <h3 className="mt-4 text-sm font-bold text-slate-700">Remove user</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <select value={removeId} onChange={(e) => setRemoveId(e.target.value)} className="min-w-0 flex-1 rounded-xl border border-pink-200 px-3 py-2 text-sm">
              <option value="">— choose —</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.id} · {u.name} ({u.role})</option>)}
            </select>
            <button onClick={removeUser} className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600">Remove</button>
          </div>

          {/* Access levels */}
          <h3 className="mt-4 text-sm font-bold text-slate-700">Update groomer access level</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <select value={promoteId} onChange={(e) => setPromoteId(e.target.value)} className="min-w-0 flex-1 rounded-xl border border-pink-200 px-3 py-2 text-sm">
              <option value="">— choose —</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.id} · {u.name} ({u.role})</option>)}
            </select>
            <select value={promoteRole} onChange={(e) => setPromoteRole(e.target.value)} className="rounded-xl border border-pink-200 px-3 py-2 text-sm">
              <option value="customer">customer</option>
              <option value="groomer">groomer</option>
              <option value="admin">admin</option>
            </select>
            <button onClick={changeRole} className="rounded-full bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-600">Update</button>
          </div>
        </section>

        {/* Categories */}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800">Category management</h2>
          <p className="mt-1 text-sm text-slate-500">Add a new species. Services must be tied to a category to appear in the catalog.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="e.g. Hamsters" className="min-w-0 flex-1 rounded-xl border border-pink-200 px-3 py-2 text-sm outline-none focus:border-rose-400" />
            <button onClick={addCategory} className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600">Add category</button>
          </div>
          <div className="mt-4 text-sm text-slate-500">Current species in the catalog:</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {["Dogs", "Cats", "Birds", "Reptiles"].map((c) => (
              <span key={c} className="rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-700">{c}</span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}