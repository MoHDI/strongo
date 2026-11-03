import { NextResponse } from "next/server";
import { hasKey } from "@/lib/meta";

// Reports whether AI is live. Never exposes the key itself.
export async function GET() {
  return NextResponse.json({ ok: true, ai: hasKey() });
}
