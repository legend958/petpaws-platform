"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/client";
import RoleSwitcher from "@/components/RoleSwitcher";
import { useDemoRole } from "@/components/RoleProvider";

const POPULAR_BREEDS = [
  { name: "Golden Retriever", species: "Dog", emoji: "🦮", note: "The classic family favourite" },
  { name: "Maine Coon", species: "Cat", emoji: "🐈", note: "Gentle giant of the cat world" },
  { name: "Cockatiel", species: "Bird", emoji: "🦜", note: "Feathered friend, loves to chirp" },
  { name: "Bearded Dragon", species: "Reptile", emoji: "🦎", note: "Calm, curious, low-maintenance" },
];

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
type Product = {
  id: number;
  title: string;
  price: string;
  delivery_mode: string;
  availability: string;
};

export default function Home() {
  const { role } = useDemoRole();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [note, setNote] = useState("");
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    if (!logged) {
      setLogged(true);
      apiFetch("/api/analytics", {
        method: "POST",
        body: JSON.stringify({ event_type: "page_visit" }),
      });
    }
    apiFetch("/api/services").then(({ data }) => setCategories(data?.categories ?? []));
    apiFetch("/api/products").then(({ data }) => setProducts(data?.products ?? []));
  }, [logged]);

  async function addProduct(p: Product) {
    const { data, res } = await apiFetch("/api/cart", {
      method: "POST",
      body: JSON.stringify({ item_type: "product", item_id: p.id, quantity: 1 }),
    });
    if (res.ok) setNote(`Added "${p.title}" to your cart. → Checkout`);
    else setNote(data?.error ?? "Could not add to cart.");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Hero */}
      <section className="rounded-3xl bg-gradient-to-br from-rose-100 via-pink-50 to-sky-100 p-8 text-center shadow-sm md:p-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-rose-400">Pet grooming, re-imagined</p>
        <h1 className="mt-2 text-4xl font-bold text-slate-800 md:text-5xl">
          Happy pets, <span className="text-rose-500">beautiful coats</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-slate-600">
          Book grooming sessions with vetted groomers or order pet essentials —
          all in one place. Switch your demo role below to explore each side of
          the platform.
        </p>
        <div className="mt-6 flex justify-center">
          <RoleSwitcher />
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/customer" className="rounded-full bg-rose-500 px-6 py-3 font-semibold text-white shadow hover:bg-rose-600">
            Book a grooming
          </Link>
          <Link href="/checkout" className="rounded-full border border-rose-200 bg-white px-6 py-3 font-semibold text-rose-500 hover:bg-rose-50">
            View my cart
          </Link>
        </div>
        {note && <p className="mt-4 text-sm font-medium text-rose-600">{note}</p>}
      </section>

      {/* Breed showcase */}
      <section className="mt-10">
        <h2 className="text-2xl font-bold text-slate-800">Popular dog & cat breeds</h2>
        <p className="text-sm text-slate-500">The breeds our customers bring in most</p>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {POPULAR_BREEDS.map((b) => (
            <div key={b.name} className="rounded-2xl bg-white p-5 text-center shadow-sm">
              <div className="text-4xl">{b.emoji}</div>
              <div className="mt-2 font-semibold text-slate-800">{b.name}</div>
              <div className="text-xs font-medium uppercase tracking-wide text-rose-400">{b.species}</div>
              <div className="mt-1 text-xs text-slate-500">{b.note}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Service categories */}
      <section className="mt-10">
        <h2 className="text-2xl font-bold text-slate-800">Services by species</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {categories.map((c) => (
            <div key={c.id} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="font-semibold text-slate-800">{c.name}</div>
              {c.services.map((s) => (
                <div key={s.id} className="mt-2 rounded-xl bg-pink-50/70 p-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700">{s.title}</span>
                    <span className="text-slate-500">from ${s.base_price}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {s.distance_tag} · {s.available_sessions_count} open slot(s)
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="mt-10">
        <h2 className="text-2xl font-bold text-slate-800">Featured pet products</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {products.map((p) => (
            <div key={p.id} className="flex flex-col rounded-2xl bg-white p-5 shadow-sm">
              <div className="text-3xl">🛍️</div>
              <div className="mt-2 font-semibold text-slate-800">{p.title}</div>
              <div className="text-sm text-slate-500">{p.delivery_mode}</div>
              <div className="mt-2 text-lg font-bold text-rose-500">${p.price}</div>
              <button
                onClick={() => addProduct(p)}
                disabled={role !== "customer"}
                className="mt-3 rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {role === "customer" ? "Add to cart" : "Switch to Customer"}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}