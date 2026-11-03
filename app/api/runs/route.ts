import { NextResponse } from "next/server";
import { VEHICLES, moveRun, suggestRuns } from "@/lib/runs";
import { driverById, restaurantById } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ runs: suggestRuns(), vehicles: VEHICLES });
}

export async function PATCH(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    restaurantId?: unknown;
    driverId?: unknown;
    status?: unknown;
  } | null;

  if (
    !body ||
    typeof body.restaurantId !== "string" ||
    !restaurantById(body.restaurantId)
  ) {
    return NextResponse.json({ error: "unknown restaurant" }, { status: 400 });
  }
  if (
    typeof body.driverId !== "string" ||
    !driverById(body.driverId)
  ) {
    return NextResponse.json({ error: "unknown driver" }, { status: 400 });
  }
  if (
    body.status !== "accepted" &&
    body.status !== "picked-up" &&
    body.status !== "delivered"
  ) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  const moved = moveRun(body.restaurantId, body.driverId, body.status);
  if (moved === 0) {
    return NextResponse.json({ error: "no orders in that run" }, { status: 409 });
  }
  return NextResponse.json({ moved });
}
