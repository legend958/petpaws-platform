"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client";
import { useDemoRole } from "@/components/RoleProvider";
import RoleSwitcher from "@/components/RoleSwitcher";

type Session = {
  id: number;
  service_title: string;
  category: string;
  available_time: string;
  discounted_price: string;
  is_free_session: boolean;
  status: string;
};
type Booking = {
  id: number;
  session_id: number;
  service_title: string;
  available_time: string;
  discounted_price: string;
  is_free_session: boolean;
  customer_name: string;
  customer_email: string;
  pet_name: string;
  species: string;
  status: string;
  created_at: string;
};
type ServiceOption = { id: number; title: string };

export default function Groomer() {
  const { role } = useDemoRole();
  const isGroomer = role === "groomer" || role === "admin";
  const [sessions, setSessions] = useState<Session[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [note, setNote] = useState("");

  const [newService, setNewService] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newFree, setNewFree] = useState(false);
  const [priceDrafts, setPriceDrafts] = useState<Record<number, string>>({});

  async function load() {
    const [s, b, sv] = await Promise.all([
      apiFetch("/api/groomer/sessions"),
      apiFetch("/api/groomer/bookings"),
      apiFetch("/api/services"),
    ]);
    if (s.data) setSessions(s.data.sessions ?? []);
    if (b.data) setBookings(b.data.bookings ?? []);
    if (sv.data) {
      const opts: ServiceOption[] = [];
      for (const c of sv.data.categories ?? []) {
        for (const ser of c.services ?? []) opts.push({ id: ser.id, title: ser.title });
      }
      setServiceOptions(opts);
    }
  }

  useEffect(() => {
    if (isGroomer) load();
  }, [isGroomer]);

  async function createSession() {
    if (!newService || !newTime) return setNote("Pick a service and a time.");
    const { data, res } = await apiFetch("/api/sessions/create", {
      method: "POST",
      body: JSON.stringify({
        service_id: Number(newService),
        available_time: new Date(newTime).toISOString(),
        discounted_price: newFree ? 0 : Number(newPrice || 0),
        is_free_session: newFree,
      }),
    });
    setNote(res.ok ? "Session created ✅" : data?.error ?? "Failed.");
    if (res.ok) {
      setNewTime("");
      setNewPrice("");
      setNewFree(false);
      load();
    }
  }

  async function updateSession(id: number, patch: Record<string, any>) {
    const { data, res } = await apiFetch("/api/sessions/create", {
      method: "POST",
      body: JSON.stringify({ session_id: id, ...patch }),
    });
    if (!res.ok) setNote(data?.error ?? "Update failed.");
    load();
  }

  if (!isGroomer) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="text-4xl">✂️</div>
          <h1 className="mt-3 text-2xl font-bold text-slate-800">Groomer dashboard</h1>
          <p className="mt-2 text-sm text-slate-500">
            This area is for groomers. Switch your demo role to <b>Groomer</b> to manage sessions and view bookings.
          </p>
          <div className="mt-5 flex justify-center">
            <RoleSwitcher />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800">Groomer dashboard</h1>
      <p className="text-sm text-slate-500">Signed in as Grace (groomer, id 2)</p>
      {note && <p className="mt-3 rounded-2xl bg-white p-3 text-sm font-medium text-rose-600 shadow-sm">{note}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Create session */}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800">Post a new session</h2>
          <div className="mt-3 flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Service</label>
            <select value={newService} onChange={(e) => setNewService(e.target.value)} className="rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400">
              <option value="">— choose —</option>
              {serviceOptions.map((o) => (
                <option key={o.id} value={o.id}>{o.title}</option>
              ))}
            </select>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Available time</label>
            <input type="datetime-local" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400" />
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Discounted price</label>
            <input type="number" min="0" step="0.01" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} disabled={newFree} className="rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400 disabled:bg-slate-100" />
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={newFree} onChange={(e) => setNewFree(e.target.checked)} />
              Free session (registered users only)
            </label>
            <button onClick={createSession} className="mt-2 rounded-full bg-rose-500 px-5 py-2.5 font-semibold text-white shadow hover:bg-rose-600">
              Create session
            </button>
          </div>
        </section>

        {/* Sessions */}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800">My sessions</h2>
          <div className="mt-3 max-h-96 space-y-3 overflow-y-auto pr-1">
            {sessions.map((s) => (
              <div key={s.id} className="rounded-xl border border-pink-100 bg-pink-50/50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-slate-800">{s.service_title} <span className="text-xs font-normal text-slate-400">({s.category})</span></div>
                    <div className="text-xs text-slate-500">{formatTime(s.available_time)}</div>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs font-bold ${s.status === "Available" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {s.status}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-bold text-rose-500">${s.discounted_price ?? "—"}</span>
                  {s.is_free_session && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">FREE</span>}
                  <input
                    type="number" step="0.01" value={priceDrafts[s.id] ?? s.discounted_price}
                    onChange={(e) => setPriceDrafts((d) => ({ ...d, [s.id]: e.target.value }))}
                    className="w-24 rounded-lg border border-pink-200 px-2 py-1 text-sm outline-none focus:border-rose-400"
                  />
                  <button onClick={() => updateSession(s.id, { discounted_price: Number(priceDrafts[s.id] ?? s.discounted_price) })} className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700">
                    Update price
                  </button>
                  <button onClick={() => updateSession(s.id, { is_free_session: !s.is_free_session, discounted_price: !s.is_free_session ? 0 : undefined })} className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">
                    {s.is_free_session ? "Make paid" : "Make free"}
                  </button>
                  <button onClick={() => updateSession(s.id, { status: s.status === "Available" ? "Booked" : "Available" })} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                    Toggle status
                  </button>
                </div>
              </div>
            ))}
            {sessions.length === 0 && <p className="text-sm text-slate-400">No sessions yet.</p>}
          </div>
        </section>
      </div>

      {/* Bookings */}
      <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">Registered-user bookings</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-pink-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-3">Service</th>
                <th className="py-2 pr-3">Customer</th>
                <th className="py-2 pr-3">Pet</th>
                <th className="py-2 pr-3">When</th>
                <th className="py-2 pr-3">Price</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b border-pink-50">
                  <td className="py-2 pr-3 font-medium text-slate-700">{b.service_title}</td>
                  <td className="py-2 pr-3 text-slate-600">{b.customer_name}</td>
                  <td className="py-2 pr-3 text-slate-500">{b.pet_name} ({b.species})</td>
                  <td className="py-2 pr-3 text-slate-500">{formatTime(b.available_time)}</td>
                  <td className="py-2 pr-3 font-semibold text-rose-500">${b.discounted_price}</td>
                  <td className="py-2">
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">{b.status}</span>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr><td colSpan={6} className="py-3 text-slate-400">No bookings yet — they appear here once customers check out.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}