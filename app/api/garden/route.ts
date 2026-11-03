import { NextResponse } from "next/server";
import { buildPlan, estimateZone } from "@/lib/garden";

interface GeoResult {
  label: string;
  lat: number;
  lng: number;
}

// OpenStreetMap Nominatim, per its usage policy: single geocode per plan
// request, identifying User-Agent, attribution shown in the UI.
async function geocode(address: string): Promise<GeoResult | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(address)}&limit=1`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Strongo/0.1 (hackathon demo; https://github.com/MoHDI/strongo)",
    },
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
  if (!res || !res.ok) return null;
  const data = (await res.json().catch(() => null)) as Array<{
    display_name?: unknown;
    lat?: unknown;
    lon?: unknown;
  }> | null;
  const first = data?.[0];
  if (!first || typeof first.lat !== "string" || typeof first.lon !== "string") {
    return null;
  }
  const lat = Number(first.lat);
  const lng = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    label: typeof first.display_name === "string" ? first.display_name : address,
    lat,
    lng,
  };
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    address?: unknown;
    zone?: unknown;
    areaSqft?: unknown;
    sun?: unknown;
    effort?: unknown;
  } | null;

  if (
    !body ||
    typeof body.areaSqft !== "number" ||
    body.areaSqft < 25 ||
    body.areaSqft > 10000
  ) {
    return NextResponse.json({ error: "area 25–10000 sq ft required" }, { status: 400 });
  }
  if (body.sun !== "full" && body.sun !== "part") {
    return NextResponse.json({ error: "sun must be full or part" }, { status: 400 });
  }
  if (body.effort !== "low" && body.effort !== "medium" && body.effort !== "high") {
    return NextResponse.json({ error: "effort must be low, medium, or high" }, { status: 400 });
  }

  let zone: number;
  let zoneMethod: "manual" | "estimated";
  let location: GeoResult | null = null;

  if (typeof body.zone === "number" && Number.isInteger(body.zone)) {
    if (body.zone < 3 || body.zone > 11) {
      return NextResponse.json({ error: "zone must be 3–11" }, { status: 400 });
    }
    zone = body.zone;
    zoneMethod = "manual";
  } else if (typeof body.address === "string" && body.address.trim().length >= 3) {
    location = await geocode(body.address.trim());
    if (!location) {
      return NextResponse.json(
        { error: "Could not locate that address — pick your zone manually." },
        { status: 422 }
      );
    }
    zone = estimateZone(location.lat);
    zoneMethod = "estimated";
  } else {
    return NextResponse.json(
      { error: "address or manual zone required" },
      { status: 400 }
    );
  }

  const plan = buildPlan({
    areaSqft: Math.round(body.areaSqft),
    sun: body.sun,
    effort: body.effort,
    zone,
    southern: (location?.lat ?? 30) < 0,
  });

  return NextResponse.json({
    plan,
    zone,
    zoneMethod,
    location,
    attribution: "Geocoding © OpenStreetMap contributors (Nominatim).",
  });
}
