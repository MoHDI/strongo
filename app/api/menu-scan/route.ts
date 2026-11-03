import { NextResponse } from "next/server";
import { chatComplete, extractJson, hasKey, VISION_MODEL } from "@/lib/meta";
import { addMenuItems, restaurantById } from "@/lib/store";

interface ScannedItem {
  name: string;
  price: number;
}

function cleanItems(value: unknown): ScannedItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (i): i is { name: unknown; price: unknown } =>
        typeof i === "object" &&
        i !== null &&
        typeof (i as { name?: unknown }).name === "string" &&
        ((i as { name: string }).name as string).length > 0 &&
        typeof (i as { price?: unknown }).price === "number"
    )
    .map((i) => ({
      name: (i as { name: string }).name.slice(0, 80),
      price: Math.max(0, Math.round(((i as { price: number }).price as number) * 100) / 100),
    }))
    .slice(0, 30);
}

// POST { image: dataUrl } → { items } transcribed from a menu photo.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { image?: unknown } | null;
  if (!body || typeof body.image !== "string" || !body.image.startsWith("data:image/")) {
    return NextResponse.json({ error: "image data URL required" }, { status: 400 });
  }
  if (body.image.length > 2_500_000) {
    return NextResponse.json({ error: "image too large" }, { status: 413 });
  }
  if (!hasKey()) {
    return NextResponse.json(
      { error: "AI not configured — add MODEL_API_KEY." },
      { status: 503 }
    );
  }

  const result = await chatComplete(
    [
      {
        role: "system",
        content:
          'Transcribe the restaurant menu in the photo. Respond with JSON ONLY, no other text: {"items": [{"name": "dish name", "price": 12.5}]}. Use numbers for prices, no currency symbols. Skip illegible lines.',
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Transcribe this menu." },
          { type: "image_url", image_url: { url: body.image } },
        ],
      },
    ],
    { model: VISION_MODEL, maxTokens: 1000 }
  );

  if (!result.ok) {
    console.error("menu-scan AI error:", result.error);
    return NextResponse.json({ error: "Menu AI unavailable — try again." }, { status: 502 });
  }

  const parsed = extractJson(result.text) as { items?: unknown } | null;
  return NextResponse.json({ items: cleanItems(parsed?.items) });
}

// PUT { restaurantId, items } → publishes scanned items to a demo menu.
export async function PUT(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    restaurantId?: unknown;
    items?: unknown;
  } | null;

  if (
    !body ||
    typeof body.restaurantId !== "string" ||
    !restaurantById(body.restaurantId)
  ) {
    return NextResponse.json({ error: "unknown restaurant" }, { status: 400 });
  }
  const items = cleanItems(body.items);
  if (items.length === 0) {
    return NextResponse.json({ error: "no valid items" }, { status: 400 });
  }

  const restaurant = addMenuItems(body.restaurantId, items);
  return NextResponse.json({ restaurant });
}
