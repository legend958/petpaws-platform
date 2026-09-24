"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/client";
import { useDemoRole } from "@/components/RoleProvider";

type Appointment = {
  id: number;
  pet_name: string;
  species: string;
  service_title: string;
  available_time: string;
  discounted_price: string;
  is_free_session: boolean;
  groomer_name: string;
  status: string;
};

export default function OrderSuccess() {
  const params = useParams<{ id: string }>();
  const { role } = useDemoRole();
  const [order, setOrder] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (role === "customer" && params.id) {
      apiFetch(`/api/orders/${params.id}`).then(({ data, res }) => {
        if (res.ok) {
          setOrder(data.order);
          setAppointments(data.upcoming_appointments ?? []);
        } else {
          setError(data?.error ?? "Order not found.");
        }
      });
    }
  }, [role, params.id]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
        <div className="text-5xl">🎉</div>
        <h1 className="mt-3 text-3xl font-bold text-emerald-600">Payment successful!</h1>
        <p className="mt-2 text-sm text-slate-500">
          Your order has been placed and payment was simulated successfully.
        </p>

        {error && <p className="mt-4 text-sm font-medium text-rose-500">{error}</p>}

        {order && (
          <div className="mt-6 rounded-2xl bg-pink-50 p-5 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Order number</span>
              <span className="font-semibold text-slate-800">#{order.id}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-slate-500">Total paid</span>
              <span className="font-bold text-rose-500">${order.total_amount}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-slate-500">Payment status</span>
              <span className="font-semibold text-emerald-600">{order.payment_status}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-slate-500">Placed</span>
              <span className="text-slate-600">{new Date(order.created_at).toLocaleString()}</span>
            </div>
          </div>
        )}

        {appointments.length > 0 && (
          <div className="mt-6 rounded-2xl bg-sky-50 p-5 text-left">
            <h2 className="font-bold text-sky-800">📅 Upcoming pet appointment reminders</h2>
            <div className="mt-3 space-y-2">
              {appointments.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl bg-white p-3 text-sm">
                  <div>
                    <div className="font-semibold text-slate-800">{a.service_title} — {a.pet_name}</div>
                    <div className="text-xs text-slate-500">with {a.groomer_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-700">{formatTime(a.available_time)}</div>
                    <div className={`text-xs font-bold ${a.is_free_session ? "text-emerald-600" : "text-rose-500"}`}>
                      {a.is_free_session ? "FREE session" : `$${a.discounted_price}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/customer" className="rounded-full bg-rose-500 px-6 py-3 font-semibold text-white shadow hover:bg-rose-600">
            Book more
          </Link>
          <Link href="/" className="rounded-full border border-pink-200 bg-white px-6 py-3 font-semibold text-rose-500 hover:bg-rose-50">
            Back home
          </Link>
        </div>
      </div>
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