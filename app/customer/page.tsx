"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/client";
import { useDemoRole } from "@/components/RoleProvider";

type Session = {
  id: number;
  available_time: string;
  discounted_price: string;
  is_free_session: boolean;
  groomer_name: string;
  status: string;
};
type Service = {
  id: number;
  title: string;
  description: string;
  base_price: string;
  location_type: string;
  distance_tag: string;
  available_sessions_count: number;
  sessions: Session[];
};
type Category = { id: number; name: string; services: Service[] };
type Product = { id: number; title: string; price: string; delivery_mode: string; availability: string };
type ChatMsg = { from: "user" | "bot"; text: string; payload?: any };

export default function Customer() {
  const { role, setRole } = useDemoRole();
  const isRegistered = role === "customer";
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [note, setNote] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([
    { from: "bot", text: "Hi! I'm your booking helper. Try: \"I want a dog grooming session tomorrow\"." },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const key = "paw_logged_customer";
    if (!window.sessionStorage.getItem(key)) {
      window.sessionStorage.setItem(key, "1");
      apiFetch("/api/analytics", {
        method: "POST",
        body: JSON.stringify({ event_type: role === "guest" ? "guest_view" : "page_visit" }),
      });
    }
    apiFetch("/api/services").then(({ data }) => setCategories(data?.categories ?? []));
    apiFetch("/api/products").then(({ data }) => setProducts(data?.products ?? []));
  }, [role]);

  async function registerAsCustomer() {
    await apiFetch("/api/analytics", {
      method: "POST",
      body: JSON.stringify({ event_type: "registration" }),
    });
    setRole("customer");
    setNote("🎉 Registered! Free sessions are now unlocked.");
  }

  async function bookSession(s: Session, service: Service) {
    const { data, res } = await apiFetch("/api/cart", {
      method: "POST",
      body: JSON.stringify({ item_type: "service", item_id: s.id }),
    });
    if (res.ok) setNote(`Added "${service.title}" (${formatTime(s.available_time)}) to cart. → Checkout`);
    else setNote(data?.error ?? "Could not book.");
  }

  async function addProduct(p: Product) {
    const { data, res } = await apiFetch("/api/cart", {
      method: "POST",
      body: JSON.stringify({ item_type: "product", item_id: p.id, quantity: 1 }),
    });
    if (res.ok) setNote(`Added "${p.title}" to cart.`);
    else setNote(data?.error ?? "Could not add.");
  }

  async function sendChat() {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setMessages((m) => [...m, { from: "user", text }]);
    setSending(true);
    const { data } = await apiFetch("/api/ai-chat-booking", {
      method: "POST",
      body: JSON.stringify({ message: text }),
    });
    setSending(false);
    if (data) {
      setMessages((m) => [
        ...m,
        { from: "bot", text: data.reply ?? data.message ?? "I couldn't parse that.", payload: data.payload ?? null },
      ]);
    }
  }

  async function bookFromChat(payload: any) {
    const { res } = await apiFetch("/api/cart", {
      method: "POST",
      body: JSON.stringify({ item_type: "service", item_id: payload.session_id }),
    });
    setNote(res.ok ? "AI-booking added to cart. → Checkout" : "Could not add.");
  }

  const filtered = useMemo(
    () =>
      categories.map((c) => ({
        ...c,
        services: c.services.map((s) => ({
          ...s,
          sessions: isRegistered ? s.sessions : s.sessions.filter((x) => !x.is_free_session),
        })),
      })),
    [categories, isRegistered]
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Customer portal</h1>
          <p className="text-sm text-slate-500">
            {isRegistered
              ? "Signed in as Carla — free sessions unlocked."
              : "Browsing as a guest — free sessions are locked behind registration."}
          </p>
        </div>
        <Link href="/checkout" className="rounded-full bg-rose-500 px-5 py-2.5 font-semibold text-white shadow hover:bg-rose-600">
          Go to checkout 🛒
        </Link>
      </div>

      {note && <p className="mt-4 rounded-2xl bg-white p-3 text-sm font-medium text-rose-600 shadow-sm">{note}</p>}

      {!isRegistered && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div>
            <div className="font-semibold text-amber-800">🔒 Free sessions for registered users</div>
            <div className="text-sm text-amber-700">
              Create a free account (demo) to unlock $0 grooming sessions and member pricing.
            </div>
          </div>
          <button onClick={registerAsCustomer} className="rounded-full bg-amber-500 px-5 py-2.5 font-semibold text-white shadow hover:bg-amber-600">
            Register as customer
          </button>
        </div>
      )}

      {/* Services */}
      <section className="mt-8">
        <h2 className="text-2xl font-bold text-slate-800">Grooming services</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {filtered.map((c) => (
            <div key={c.id} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="text-lg font-bold text-slate-800">{c.name}</div>
              {c.services.map((s) => (
                <div key={s.id} className="mt-3 rounded-xl border border-pink-100 bg-pink-50/50 p-4">
                  <div className="flex justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-800">{s.title}</div>
                      <div className="text-xs text-slate-500">{s.description}</div>
                    </div>
                    <span className="shrink-0 rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-600">
                      {s.distance_tag}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    Base price <span className="font-semibold text-slate-800">${s.base_price}</span>
                  </div>
                  {s.sessions.length === 0 && (
                    <div className="mt-2 text-sm text-slate-400">No open slots right now.</div>
                  )}
                  {s.sessions.map((ses) => (
                    <div key={ses.id} className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3">
                      <div>
                        <div className="text-sm font-medium text-slate-700">{formatTime(ses.available_time)}</div>
                        <div className="text-xs text-slate-400">with {ses.groomer_name}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {ses.is_free_session ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">
                            FREE · registered only
                          </span>
                        ) : (
                          <span className="font-bold text-rose-500">${ses.discounted_price}</span>
                        )}
                        <button
                          onClick={() => bookSession(ses, s)}
                          className="rounded-full bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                        >
                          Book
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Products */}
      <section className="mt-10">
        <h2 className="text-2xl font-bold text-slate-800">Pet products</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {products.map((p) => (
            <div key={p.id} className="flex flex-col rounded-2xl bg-white p-5 shadow-sm">
              <div className="text-3xl">🛍️</div>
              <div className="mt-2 font-semibold text-slate-800">{p.title}</div>
              <div className="text-sm text-slate-500">{p.delivery_mode}</div>
              <div className="mt-2 text-lg font-bold text-rose-500">${p.price}</div>
              <button
                onClick={() => addProduct(p)}
                disabled={!isRegistered}
                className="mt-3 rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:bg-slate-300"
              >
                {isRegistered ? "Add to cart" : "Register to buy"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* AI chat */}
      <section className="mt-10 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">🤖 AI booking chat</h2>
        <p className="text-sm text-slate-500">
          Ask in plain language. The agent confirms real availability with the backend before suggesting a slot.
        </p>
        <div className="mt-4 flex max-h-80 flex-col gap-2 overflow-y-auto rounded-xl bg-pink-50/60 p-3">
          {messages.map((m, i) => (
            <div key={i} className={`max-w-[85%] rounded-2xl p-3 text-sm ${m.from === "user" ? "self-end bg-slate-800 text-white" : "self-start bg-white shadow-sm text-slate-700"}`}>
              {m.text}
              {m.payload && (
                <button
                  onClick={() => bookFromChat(m.payload)}
                  className="mt-2 block rounded-full bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-600"
                >
                  Book this slot ({formatTime(m.payload.available_time)})
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendChat()}
            placeholder='Try "I want a dog grooming session tomorrow"'
            className="flex-1 rounded-full border border-pink-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-rose-400"
          />
          <button onClick={sendChat} disabled={sending} className="rounded-full bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-50">
            Send
          </button>
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