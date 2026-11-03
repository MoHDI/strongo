import { NextResponse } from "next/server";
import {
  createOrder,
  driverById,
  drivers,
  listOrders,
  restaurantById,
  restaurants,
  updateOrder,
  type OrderStatus,
} from "@/lib/store";

const STATUSES: OrderStatus[] = ["open", "accepted", "picked-up", "delivered"];

export async function GET() {
  const orders = listOrders().map((o) => ({
    ...o,
    restaurantName: restaurantById(o.restaurantId)?.name ?? "Unknown",
    driverName: o.driverId ? (driverById(o.driverId)?.name ?? null) : null,
  }));
  return NextResponse.json({ orders, restaurants, drivers });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    restaurantId?: unknown;
    items?: unknown;
    address?: unknown;
  } | null;

  if (!body || typeof body.restaurantId !== "string" || !restaurantById(body.restaurantId)) {
    return NextResponse.json({ error: "unknown restaurant" }, { status: 400 });
  }
  if (
    !Array.isArray(body.items) ||
    body.items.length === 0 ||
    !body.items.every(
      (i) =>
        typeof i === "object" &&
        i !== null &&
        typeof (i as { name?: unknown }).name === "string" &&
        typeof (i as { price?: unknown }).price === "number" &&
        typeof (i as { qty?: unknown }).qty === "number"
    )
  ) {
    return NextResponse.json({ error: "invalid items" }, { status: 400 });
  }
  if (typeof body.address !== "string" || body.address.trim().length < 3) {
    return NextResponse.json({ error: "address required" }, { status: 400 });
  }

  const order = createOrder({
    restaurantId: body.restaurantId,
    items: body.items as { name: string; price: number; qty: number }[],
    address: body.address.trim(),
  });
  return NextResponse.json({ order }, { status: 201 });
}

export async function PATCH(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    id?: unknown;
    status?: unknown;
    driverId?: unknown;
  } | null;

  if (!body || typeof body.id !== "string") {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  if (body.status !== undefined && !STATUSES.includes(body.status as OrderStatus)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }
  if (
    body.driverId !== undefined &&
    body.driverId !== null &&
    (typeof body.driverId !== "string" || !driverById(body.driverId))
  ) {
    return NextResponse.json({ error: "unknown driver" }, { status: 400 });
  }

  const order = updateOrder(body.id, {
    status: body.status as OrderStatus | undefined,
    driverId: body.driverId as string | null | undefined,
  });
  if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ order });
}
