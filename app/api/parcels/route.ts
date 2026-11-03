import { NextResponse } from "next/server";
import { fetchLots } from "@/lib/parcels";

// GET /api/parcels?bbox=w,s,e,n — residential taxlots in a bounding box.
// Proxied server-side (RLIS has no CORS guarantee for browsers).
const cache = new Map<string, { at: number; lots: unknown }>();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parts = (url.searchParams.get("bbox") ?? "").split(",").map(Number);
  if (parts.length !== 4 || parts.some((v) => !Number.isFinite(v))) {
    return NextResponse.json({ error: "bbox=w,s,e,n required" }, { status: 400 });
  }
  const [w, s, e, n] = parts;
  if (w >= e || s >= n || e - w > 0.05 || n - s > 0.05) {
    return NextResponse.json({ error: "invalid or oversized bbox" }, { status: 400 });
  }
  const landuse = url.searchParams.get("landuse") ?? "SFR";
  if (!/^[A-Z]{2,4}$/.test(landuse)) {
    return NextResponse.json({ error: "invalid landuse" }, { status: 400 });
  }

  const key = `${w},${s},${e},${n},${landuse}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 5 * 60 * 1000) {
    return NextResponse.json({
      lots: hit.lots,
      cached: true,
      attribution: "Taxlots: Metro RLIS open data (county assessors, City of Portland).",
    });
  }

  try {
    const lots = await fetchLots(w, s, e, n, landuse);
    cache.set(key, { at: Date.now(), lots });
    return NextResponse.json({
      lots,
      cached: false,
      attribution: "Taxlots: Metro RLIS open data (county assessors, City of Portland).",
    });
  } catch {
    return NextResponse.json({ error: "parcel service unavailable" }, { status: 502 });
  }
}
