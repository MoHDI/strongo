import { NextResponse } from "next/server";
import { chatComplete, extractJson, hasKey, VISION_MODEL } from "@/lib/meta";
import { segmentImage } from "@/lib/sam";

const CATEGORIES = ["protein", "produce", "dairy", "grains", "other"] as const;
type Category = (typeof CATEGORIES)[number];

const STAPLES: Category[] = ["protein", "produce", "dairy", "grains"];

interface FridgeItem {
  name: string;
  category: Category;
  count: number;
}

function cleanItems(value: unknown): FridgeItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (i): i is { name: unknown; category: unknown; count: unknown } =>
        typeof i === "object" &&
        i !== null &&
        typeof (i as { name?: unknown }).name === "string" &&
        ((i as { name: string }).name as string).length > 0
    )
    .map((i) => {
      const raw = i as { name: string; category: unknown; count: unknown };
      const category: Category = (CATEGORIES as readonly string[]).includes(
        typeof raw.category === "string" ? raw.category : ""
      )
        ? (raw.category as Category)
        : "other";
      const count =
        typeof raw.count === "number" && Number.isFinite(raw.count)
          ? Math.max(1, Math.round(raw.count))
          : 1;
      return { name: raw.name.slice(0, 80), category, count };
    })
    .slice(0, 40);
}

// POST { image: dataUrl } → { items, lowOn, model, latencyMs }.
// Inventory only — the model is instructed never to judge food safety.
export async function POST(req: Request) {
  const started = Date.now();
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
          'You inventory a community fridge from a photo. Respond with JSON ONLY, no other text: {"items": [{"name": "item name", "category": "protein|produce|dairy|grains|other", "count": 1}]}. Count visible units roughly; merge duplicates into one entry with a count. Never assess food safety, spoilage, or expiry — inventory only. Skip illegible items.',
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Inventory this fridge." },
          { type: "image_url", image_url: { url: body.image } },
        ],
      },
    ],
    { model: VISION_MODEL, maxTokens: 1000 }
  );

  if (!result.ok) {
    console.error("fridge-scan AI error:", result.error);
    return NextResponse.json({ error: "Fridge AI unavailable — try again." }, { status: 502 });
  }

  const parsed = extractJson(result.text) as { items?: unknown } | null;
  const items = cleanItems(parsed?.items);
  const present = new Set(items.map((i) => i.category));
  const lowOn = STAPLES.filter((c) => !present.has(c));
  // SAM outlines are best-effort: missing boxes never fail the inventory.
  const outlines = await segmentImage(body.image, "food")
    .then((r) => (r.ok ? r.boxes : []))
    .catch(() => []);
  return NextResponse.json({
    items,
    lowOn,
    outlines,
    model: VISION_MODEL,
    latencyMs: Date.now() - started,
  });
}
