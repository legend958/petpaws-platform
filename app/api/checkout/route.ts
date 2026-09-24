import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { userRole, userId, errorResponse } from "@/lib/request";
import { toCents, formatCents } from "@/lib/money";

// POST /api/checkout
// The client sends ONLY ids and quantities — never prices.
// All prices are re-read from the database and the total is computed here.

export async function POST(req: NextRequest) {
  const role = userRole(req);
  if (role === "guest" || role === null) {
    return errorResponse("You must be a registered customer to check out.", 401);
  }
  const customerId = userId(req);
  if (!customerId) {
    return errorResponse("x-user-id header is required.", 400);
  }

  const customer = await sql.query(
    `SELECT id, role, is_guest FROM users WHERE id = $1`,
    [customerId]
  );
  if (customer.length === 0) {
    return errorResponse("That user does not exist.", 401);
  }

  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.items) || body.items.length === 0) {
    return errorResponse("Provide at least one item: { items: [{ item_type, item_id, quantity? }] }.", 400);
  }
  const petId: number | null = body.pet_id ?? null;

  if (petId != null) {
    const pet = await sql.query(`SELECT id FROM pets WHERE id = $1 AND user_id = $2`, [petId, customerId]);
    if (pet.length === 0) {
      return errorResponse("That pet doesn't belong to this customer.", 400);
    }
  }

  const serviceItems: Array<{ item_id: number }> = [];
  const productItems: Array<{ item_id: number; quantity: number }> = [];
  for (const item of body.items) {
    const type = item.item_type;
    const itemId = Number(item.item_id);
    if (!Number.isInteger(itemId)) {
      return errorResponse("Each item needs a numeric item_id.", 400);
    }
    if (type === "service") {
      serviceItems.push({ item_id: itemId });
    } else if (type === "product") {
      const quantity = Number(item.quantity ?? 1);
      if (!Number.isInteger(quantity) || quantity < 1) {
        return errorResponse("Product quantity must be a positive integer.", 400);
      }
      productItems.push({ item_id: itemId, quantity });
    } else {
      return errorResponse("item_type must be 'service' or 'product'.", 400);
    }
  }

  if (serviceItems.length > 0 && !petId) {
    return errorResponse("A pet_id is required for service bookings.", 400);
  }

  // --- Validate every service item against the database -------------------
  const bookedSessions: Array<Record<string, any>> = [];
  const seenSessions = new Set<number>();
  let totalCents = 0;

  for (const item of serviceItems) {
    if (seenSessions.has(item.item_id)) {
      return errorResponse(`Session ${item.item_id} appears more than once.`, 400);
    }
    seenSessions.add(item.item_id);

    const session = (await sql.query(
      `SELECT gs.id, gs.discounted_price, gs.is_free_session, gs.status,
              s.title AS service_title, u.name AS groomer_name, gs.available_time
       FROM groomer_sessions gs
       INNER JOIN services s ON s.id = gs.service_id
       INNER JOIN users u ON u.id = gs.groomer_id
       WHERE gs.id = $1`,
      [item.item_id]
    )) as Array<Record<string, any>>;

    if (session.length === 0) {
      return errorResponse(`Session ${item.item_id} does not exist.`, 400);
    }
    if (session[0].status !== "Available") {
      return errorResponse(`Session ${item.item_id} is no longer available.`, 409);
    }
    if (session[0].is_free_session) {
      // Guaranteed by the role check above: guests can never check out.
      totalCents += 0;
    } else {
      totalCents += toCents(session[0].discounted_price);
    }
    bookedSessions.push(session[0]);
  }

  // --- Validate every product item against the database -------------------
  const purchasedProducts: Array<Record<string, any>> = [];
  const seenProducts = new Set<number>();
  for (const item of productItems) {
    if (seenProducts.has(item.item_id)) {
      return errorResponse(`Product ${item.item_id} appears more than once.`, 400);
    }
    seenProducts.add(item.item_id);

    const product = (await sql.query(
      `SELECT id, title, price, stock_quantity FROM products WHERE id = $1`,
      [item.item_id]
    )) as Array<Record<string, any>>;

    if (product.length === 0) {
      return errorResponse(`Product ${item.item_id} does not exist.`, 400);
    }
    if (product[0].stock_quantity < item.quantity) {
      return errorResponse(`Not enough stock for "${product[0].title}".`, 400);
    }
    const lineCents = toCents(product[0].price) * item.quantity;
    totalCents += lineCents;
    purchasedProducts.push({
      product_id: product[0].id,
      title: product[0].title,
      quantity: item.quantity,
      line_total: formatCents(lineCents),
    });
  }

  // --- Simulated payment gateway -------------------------------------------
  const paymentStatus = "Paid"; // In reality this would call a gateway.
  const totalAmount = formatCents(totalCents);

  // --- Write the order record ----------------------------------------------
  const order = await sql.query(
    `INSERT INTO orders (user_id, total_amount, payment_status)
     VALUES ($1, $2, $3)
     RETURNING id, total_amount, payment_status, created_at`,
    [customerId, totalAmount, paymentStatus]
  );

  // --- Create appointments and mark sessions as Booked ---------------------
  for (const session of bookedSessions) {
    await sql.query(
      `INSERT INTO appointments (user_id, session_id, pet_id) VALUES ($1, $2, $3)`,
      [customerId, session.id, petId]
    );
    await sql.query(`UPDATE groomer_sessions SET status = 'Booked' WHERE id = $1`, [session.id]);
  }

  // Best-effort: clear the shopper's cart now that the order exists.
  await sql.query(`DELETE FROM cart_items WHERE user_id = $1`, [customerId]);

  return NextResponse.json({
    order_id: order[0].id,
    total_amount: order[0].total_amount,
    payment_status: order[0].payment_status,
    booked_sessions: bookedSessions.map((s) => ({
      session_id: s.id,
      service_title: s.service_title,
      groomer_name: s.groomer_name,
      available_time: s.available_time,
      discounted_price: s.discounted_price,
      is_free_session: s.is_free_session,
    })),
    purchased_products: purchasedProducts,
  });
}