import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

// GET /api/products
// Product catalog with price, delivery mode, and computed stock availability.

export async function GET() {
  const rows = (await sql.query(`
    SELECT id, title, price, delivery_mode, stock_quantity
    FROM products
    ORDER BY id;
  `)) as Array<Record<string, any>>;

  const products = rows.map((p) => ({
    id: p.id,
    title: p.title,
    price: p.price,
    delivery_mode: p.delivery_mode,
    stock_quantity: p.stock_quantity,
    availability: p.stock_quantity > 0 ? "In Stock" : "Out of Stock",
  }));

  return NextResponse.json({ products });
}