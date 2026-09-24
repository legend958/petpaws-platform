import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { errorResponse } from "@/lib/request";

// POST /api/ai-chat-booking
// Tiny rule-based "AI agent": parses natural language, then asks the DATABASE
// which session is genuinely available. The chat layer never decides
// availability itself — it must confirm with the backend.

const SERVICE_PATTERNS = [
  { category: "Dogs", title: "Full Grooming", keywords: ["full grooming", "grooming", "groom", "wash", "full"] },
  { category: "Dogs", title: "Nail Trim", keywords: ["nail"] },
  { category: "Cats", title: "Cat Grooming", keywords: ["cat grooming", "cat wash", "de-shed", "deshed", "shedding"] },
  { category: "Birds", title: "Bird Bath & Wing Care", keywords: ["bird bath", "wing", "bird care", "bird"] },
  { category: "Reptiles", title: "Reptile Habitat Refresh", keywords: ["reptile", "habitat", "tank", "terrarium", "gecko", "lizard"] },
];

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.message !== "string" || body.message.trim() === "") {
    return errorResponse('Send a message like: "I want a dog grooming session tomorrow".', 400);
  }
  const message = body.message.toLowerCase();

  const matched = SERVICE_PATTERNS.find((s) =>
    s.keywords.some((k) => message.includes(k))
  );

  if (!matched) {
    return NextResponse.json({
      intent: "unclear",
      reply:
        "I couldn't match that to a service. Try something like: \"I want a dog grooming session tomorrow\".",
    });
  }

  const sessions = (await sql.query(
    `SELECT gs.id AS session_id, gs.service_id, gs.available_time,
            gs.discounted_price, gs.is_free_session, gs.status,
            s.title AS service_title, c.name AS category,
            u.name AS groomer_name
     FROM groomer_sessions gs
     INNER JOIN services s ON s.id = gs.service_id
     INNER JOIN categories c ON c.id = s.category_id
     INNER JOIN users u ON u.id = gs.groomer_id
     WHERE c.name = $1 AND s.title = $2
       AND gs.status = 'Available' AND gs.available_time > NOW()
     ORDER BY gs.available_time
     LIMIT 10`,
    [matched.category, matched.title]
  )) as Array<Record<string, any>>;

  if (sessions.length === 0) {
    return NextResponse.json({
      intent: "none",
      category: matched.category,
      service_title: matched.title,
      reply: `Good news: ${matched.title} exists, but there are no available ${matched.category} sessions right now.`,
    });
  }

  const prefersFree = message.includes("free");
  const wantsTomorrow = message.includes("tomorrow");

  let chosen = sessions[0];
  if (wantsTomorrow) {
    const tomorrowStart = new Date();
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
    const candidate = sessions.find((s: any) => {
      const t = new Date(s.available_time).getTime();
      return t >= tomorrowStart.getTime() && t < tomorrowEnd.getTime();
    });
    if (candidate) chosen = candidate;
  } else if (prefersFree) {
    const free = sessions.find((s: any) => s.is_free_session);
    if (free) chosen = free;
  }

  return NextResponse.json({
    intent: "book",
    payload: {
      session_id: chosen.session_id,
      service_id: chosen.service_id,
      service_title: chosen.service_title,
      category: chosen.category,
      groomer_name: chosen.groomer_name,
      available_time: chosen.available_time,
      discounted_price: chosen.discounted_price,
      is_free_session: chosen.is_free_session,
      status: chosen.status,
    },
    reply: `I found a ${matched.title} with ${chosen.groomer_name} on ${chosen.available_time}. ${chosen.is_free_session ? "This session is FREE for registered users!" : "Ready to book?"} The frontend button sends this to /api/checkout.`,
  });
}