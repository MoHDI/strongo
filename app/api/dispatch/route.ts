import { NextResponse } from "next/server";
import { chatComplete, extractJson, TEXT_MODEL } from "@/lib/meta";
import { drivers, restaurants } from "@/lib/store";

interface Suggestion {
  reply: string;
  source: "ai" | "local";
  restaurantId: string | null;
  items: Array<{ name: string; qty: number }>;
  driverId: string | null;
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const r = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(s));
}

function nearestDriverId(lat: number, lng: number): string {
  let best = drivers[0].id;
  let bestKm = Infinity;
  for (const d of drivers) {
    const km = haversineKm(lat, lng, d.lat, d.lng);
    if (km < bestKm) {
      bestKm = km;
      best = d.id;
    }
  }
  return best;
}

// Deterministic fallback when no API key is set or the model call fails.
// Keeps the demo working offline; the response is labeled "local".
function localSuggest(message: string): Suggestion {
  const lower = message.toLowerCase();
  const restaurant =
    restaurants.find(
      (r) =>
        lower.includes(r.name.toLowerCase().split(" ")[0]) ||
        lower.includes(r.cuisine.toLowerCase())
    ) ?? restaurants[0];

  const budgetMatch = lower.match(/under\s*\$?\s*(\d+)|(\d+)\s*(bucks|dollars|\$)/);
  const budget = budgetMatch ? Number(budgetMatch[1] ?? budgetMatch[2]) : null;

  const items: Array<{ name: string; qty: number }> = [];
  let running = 0;
  for (const item of restaurant.menu) {
    if (budget !== null && running + item.price > budget) continue;
    items.push({ name: item.name, qty: 1 });
    running += item.price;
    if (items.length >= 3) break;
  }

  const driverId = nearestDriverId(restaurant.lat, restaurant.lng);
  const driver = drivers.find((d) => d.id === driverId);
  const reply =
    budget !== null
      ? `${restaurant.name} fits under $${budget}: ${items.map((i) => i.name).join(", ")} ($${running}). ${driver?.name} is closest for delivery.`
      : `How about ${restaurant.name}? ${items.map((i) => i.name).join(", ")} ($${running}). ${driver?.name} is closest for delivery.`;

  return { reply, source: "local", restaurantId: restaurant.id, items, driverId };
}

function contextBlock(): string {
  const lines = ["RESTAURANTS (id, name, cuisine, menu with prices):"];
  for (const r of restaurants) {
    lines.push(
      `- ${r.id}: ${r.name} (${r.cuisine}): ${r.menu.map((m) => `${m.name} $${m.price}`).join("; ")}`
    );
  }
  lines.push(`DRIVERS (id, name): ${drivers.map((d) => `${d.id} (${d.name})`).join(", ")}`);
  return lines.join("\n");
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { message?: unknown } | null;
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const started = Date.now();
  if (!message) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  const result = await chatComplete(
    [
      {
        role: "system",
        content: `You are Strongo's friendly community delivery dispatcher. Match the neighbor's request to one restaurant, suggest up to 3 menu items within any stated budget, and pick the closest driver. Respond with JSON ONLY, no other text: {"reply": "1-2 warm sentences", "restaurantId": "id or null", "items": [{"name": "exact menu name", "qty": 1}], "driverId": "id or null"}. Never invent restaurants, items, or drivers outside the lists below.\n\n${contextBlock()}`,
      },
      { role: "user", content: message },
    ],
    { model: TEXT_MODEL, maxTokens: 500 }
  );

  if (!result.ok) {
    return NextResponse.json({
      ...localSuggest(message),
      model: null,
      latencyMs: Date.now() - started,
    });
  }

  const parsed = extractJson(result.text) as {
    reply?: unknown;
    restaurantId?: unknown;
    items?: unknown;
    driverId?: unknown;
  } | null;

  const restaurantId =
    typeof parsed?.restaurantId === "string" &&
    restaurants.some((r) => r.id === parsed.restaurantId)
      ? (parsed.restaurantId as string)
      : null;
  const driverId =
    typeof parsed?.driverId === "string" && drivers.some((d) => d.id === parsed.driverId)
      ? (parsed.driverId as string)
      : null;
  const items = Array.isArray(parsed?.items)
    ? (parsed.items as Array<{ name?: unknown; qty?: unknown }>)
        .filter((i) => typeof i?.name === "string")
        .map((i) => ({ name: i.name as string, qty: typeof i.qty === "number" ? i.qty : 1 }))
        .slice(0, 5)
    : [];

  const reply =
    typeof parsed?.reply === "string" && parsed.reply.length > 0
      ? parsed.reply
      : result.text.slice(0, 400);

  return NextResponse.json({
    reply,
    source: "ai",
    restaurantId,
    items,
    driverId,
    model: TEXT_MODEL,
    latencyMs: Date.now() - started,
  });
}
