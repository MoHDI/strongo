import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Demo rate limiter: mutating API calls are capped per IP so nobody can
// spam the boards or drain the Meta API credits. In-memory per isolate —
// a real deployment would use Redis/Upstash.
const hits = new Map<string, number[]>();
const LIMIT = 30;
const WINDOW_MS = 60_000;

export function middleware(req: NextRequest) {
  if (req.method === "GET" || req.method === "HEAD") {
    return NextResponse.next();
  }
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (recent.length > LIMIT) {
    return NextResponse.json({ error: "slow down" }, { status: 429 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
