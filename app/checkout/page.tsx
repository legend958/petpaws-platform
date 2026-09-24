"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client";
import { useDemoRole } from "@/components/RoleProvider";
import RoleSwitcher from "@/components/RoleSwitcher";

type CartItem = {
  cart_item_id: number;
  item_type: string;
  item_id: number;
  quantity: number;
  title: string;
  detail: string;
  unit_price: string;
  line_total: string;
};
type Cart = { items: CartItem[]; subtotal: string; total: string };
type Pet = { id: number; name: string; species: string; breed: string };

export default function Checkout() {
  const { role } = useDemoRole();
  const router = useRouter();
  const isCustomer = role === "customer";
  const [cart, setCart] = useState<Cart | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [petId, setPetId] = useState("");
  const [paying, setPaying] = useState(false);
  const [note, setNote] = useState("");

  async function load() {
    const [c, p] = await Promise.all([apiFetch("/api/cart"), apiFetch("/api/pets")]);
    if (c.data) setCart(c.data);
    if (p.data) {
      setPets(p.data.pets ?? []);
      if (p.data.pets?.length === 1 && !petId) setPetId(String(p.data.pets[0].id));
    }
  }

  useEffect(() => {
    if (isCustomer) load();
  }, [isCustomer]);

  async function removeItem(rowId: number) {
    await apiFetch(`/api/cart?item_id=${rowId}`, { method: "DELETE" });
    load();
  }

  async function pay() {
    if (!cart || cart.items.length === 0) return;
    const needsPet = cart.items.some((i) => i.item_type === "service");
    if (needsPet && !petId) {
      setNote("Select a pet for the grooming appointment.");
      return;
    }
    setPaying(true);
    const { data, res } = await apiFetch("/api/checkout", {
      method: "POST",
      body: JSON.stringify({
        items: cart.items.map((i) => ({ item_type: i.item_type, item_id: i.item_id, quantity: i.quantity })),
        pet_id: needsPet ? Number(petId) : null,
      }),
    });
    setPaying(false);
    if (res.ok && data?.order_id) {
      router.push(`/order-success/${data.order_id}`);
    } else {
      setNote(data?.error ?? "Payment failed.");
    }
  }

  if (!isCustomer) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="text-4xl">🛒</div>
          <h1 className="mt-3 text-2xl font-bold text-slate-800">Checkout</h1>
          <p className="mt-2 text-sm text-slate-500">
            Only registered customers can check out. Switch your demo role to <b>Customer</b> to continue.
          </p>
          <div className="mt-5 flex justify-center">
            <RoleSwitcher />
          </div>
        </div>
      </div>
    );
  }

  const hasServices = cart?.items.some((i) => i.item_type === "service");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800">Checkout</h1>
      <p className="text-sm text-slate-500">All totals are computed by the backend — your browser never does the math.</p>
      {note && <p className="mt-3 rounded-2xl bg-white p-3 text-sm font-medium text-rose-600 shadow-sm">{note}</p>}

      {!cart || cart.items.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="text-4xl">🛍️</div>
          <p className="mt-3 text-slate-600">Your cart is empty. Add services and products from the <b>Customer portal</b>.</p>
        </div>
      ) : (
        <>
          <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800">Cart summary</h2>
            <div className="mt-3 space-y-3">
              {cart.items.map((i) => (
                <div key={i.cart_item_id} className="flex items-center justify-between gap-3 rounded-xl border border-pink-100 bg-pink-50/50 p-3">
                  <div>
                    <div className="font-semibold text-slate-800">{i.title}</div>
                    <div className="text-xs text-slate-500">
                      {i.detail} · {i.quantity} × ${i.unit_price}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-800">${i.line_total}</span>
                    <button onClick={() => removeItem(i.cart_item_id)} className="text-xs font-semibold text-rose-400 hover:text-rose-600">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-6 border-t border-pink-100 pt-3 text-sm">
              <div>Subtotal <span className="font-bold text-slate-800">${cart.subtotal}</span></div>
              <div className="text-lg font-bold text-rose-500">Total ${cart.total}</div>
            </div>
          </section>

          {hasServices && (
            <section className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold text-slate-800">Choose a pet for grooming</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {pets.map((p) => (
                  <label key={p.id} className={`rounded-xl border p-3 text-sm ${petId === String(p.id) ? "border-rose-400 bg-rose-50" : "border-pink-100 bg-white"}`}>
                    <input type="radio" name="pet" value={p.id} checked={petId === String(p.id)} onChange={() => setPetId(String(p.id))} className="mr-2" />
                    <span className="font-semibold text-slate-700">{p.name}</span>
                    <span className="ml-1 text-slate-500">({p.species} · {p.breed})</span>
                  </label>
                ))}
              </div>
            </section>
          )}

          <button
            onClick={pay}
            disabled={paying}
            className="mt-6 w-full rounded-full bg-rose-500 py-4 text-lg font-bold text-white shadow-lg hover:bg-rose-600 disabled:opacity-60"
          >
            {paying ? "Processing payment…" : "🔒 Pay now — simulated secure payment"}
          </button>
        </>
      )}
    </div>
  );
}