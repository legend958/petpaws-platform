import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { userId, errorResponse } from "@/lib/request";
import { toCents, formatCents } from "@/lib/money";

// GET /api/cart            — read cart with totals computed here (not in React)
// POST /api/cart           — add or update a cart line
// DELETE /api/cart?item_id — remove one cart line by its row id

export async function GET(req: NextRequest) {
  const customerId = userId(req);
  if (!customerId) return errorResponse("Log in to view your cart.", 401);

  const serviceRows = (await sql.query(
    `SELECT ci.id AS cart_item_id, ci.item_type, ci.item_id, ci.quantity,
            s.title, gs.available_time, gs.discounted_price AS unit_price,
            gs.is_free_session, s.location_type
     FROM cart_items ci
     INNER JOIN groomer_sessions gs ON gs.id = ci.item_id
     INNER JOIN services s ON s.id = gs.service_id
     WHERE ci.user_id = $1 AND ci.item_type = 'service'
     ORDER BY ci.id`,
    [customerId]
  )) as Array<Record<string, any>>;

  const productRows = (await sql.query(
    `SELECT ci.id AS cart_item_id, ci.item_type, ci.item_id, ci.quantity,
            p.title, p.price AS unit_price, p.delivery_mode
     FROM cart_items ci
     INNER JOIN products p ON p.id = ci.item_id
     WHERE ci.user_id = $1 AND ci.item_type = 'product'
     ORDER BY ci.id`,
    [customerId]
  )) as Array<Record<string, any>>;

  const items: Array<Record<string, any>> = [];
  let totalCents = 0;

  for (const row of serviceRows) {
    const lineTotal = toCents(row.unit_price);
    totalCents += lineTotal;
    items.push({
      cart_item_id: row.cart_item_id,
      item_type: "service",
      item_id: row.item_id,
      quantity: 1,
      title: row.title,
      detail: row.available_time,
      unit_price: row.unit_price,
      line_total: formatCents(lineTotal),
      is_free_session: row.is_free_session,
    });
  }

  for (const row of productRows) {
    const lineTotal = toCents(row.unit_price) * row.quantity;
    totalCents += lineTotal;
    items.push({
      cart_item_id: row.cart_item_id,
      item_type: "product",
      item_id: row.item_id,
      quantity: row.quantity,
      title: row.title,
      detail: row.delivery_mode,
      unit_price: row.unit_price,
      line_total: formatCents(lineTotal),
    });
  }

  return NextResponse.json({
    items,
    subtotal: formatCents(totalCents),
    total: formatCents(totalCents),
  });
}

export async function POST(req: NextRequest) {
  const customerId = userId(req);
  if (!customerId) return errorResponse("Log in to add to your cart.", 401);

  const body = await req.json().catch(() => null);
  if (!body || !["service", "product"].includes(body.item_type)) {
    return errorResponse("item_type must be 'service' or 'product'.", 400);
  }
  const itemId = Number(body.item_id);
  if (!Number.isInteger(itemId)) {
    return errorResponse("item_id must be a number.", 400);
  }

  if (body.item_type === "service") {
    const session = await sql.query(`SELECT id FROM groomer_sessions WHERE id = $1`, [itemId]);
    if (session.length === 0) return errorResponse("Session not found.", 400);
  } else {
    const product = await sql.query(`SELECT id FROM products WHERE id = $1`, [itemId]);
    if (product.length === 0) return errorResponse("Product not found.", 400);
  }

  const quantity =
    body.item_type === "service" ? 1 : Math.max(1, Number(body.quantity ?? 1));

  const existing = await sql.query(
    `SELECT id FROM cart_items WHERE user_id = $1 AND item_type = $2 AND item_id = $3`,
    [customerId, body.item_type, itemId]
  );
  if (existing.length > 0) {
    await sql.query(
      `UPDATE cart_items SET quantity = $1 WHERE id = $2`,
      [quantity, existing[0].id]
    );
  } else {
    await sql.query(
      `INSERT INTO cart_items (user_id, item_type, item_id, quantity) VALUES ($1, $2, $3, $4)`,
      [customerId, body.item_type, itemId, quantity]
    );
  }
  return GET(req);
}

export async function DELETE(req: NextRequest) {
  const customerId = userId(req);
  if (!customerId) return errorResponse("Log in to view your cart.", 401);

  const itemId = Number(req.nextUrl.searchParams.get("item_id"));
  if (!Number.isInteger(itemId)) {
    return errorResponse("Provide ?item_id=<cart row id>.", 400);
  }
  await sql.query(`DELETE FROM cart_items WHERE id = $1 AND user_id = $2`, [itemId, customerId]);
  return GET(req);
}