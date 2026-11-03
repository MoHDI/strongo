// Grouped delivery runs: neighbors ordering from the same restaurant share
// one driver run. Runs are DERIVED from open orders (no separate store), so
// joining a run just means ordering from that restaurant while it's open.

import {
  drivers,
  listOrders,
  restaurantById,
  updateOrder,
  type Order,
} from "./store";

export interface Vehicle {
  type: "bike" | "car" | "foot";
  capacity: number; // max orders per run
  area: string;
}

export const VEHICLES: Record<string, Vehicle> = {
  priya: { type: "bike", capacity: 3, area: "West side" },
  marcus: { type: "car", capacity: 6, area: "East side" },
};

const PREP_MINUTES: Record<string, number> = {
  verde: 15,
  nonna: 20,
  golden: 18,
  daily: 12,
};

export interface RunSuggestion {
  restaurantId: string;
  restaurantName: string;
  cuisine: string;
  orderIds: string[];
  orderCount: number;
  combinedTotal: number;
  items: Array<{ name: string; qty: number }>;
  driverId: string;
  driverName: string;
  vehicle: Vehicle;
  etaMinutes: number;
  window: string;
}

function windowLabel(fromMin: number, toMin: number): string {
  const at = (m: number) =>
    new Date(Date.now() + m * 60000).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  return `${at(fromMin)}–${at(toMin)}`;
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

export function suggestRuns(): RunSuggestion[] {
  const open = listOrders().filter((o) => o.status === "open");
  const byRest = new Map<string, Order[]>();
  for (const o of open) {
    if (!restaurantById(o.restaurantId)) continue;
    const list = byRest.get(o.restaurantId) ?? [];
    list.push(o);
    byRest.set(o.restaurantId, list);
  }

  return [...byRest.entries()].map(([rid, orders]) => {
    const restaurant = restaurantById(rid)!;
    const combined = new Map<string, number>();
    for (const o of orders) {
      for (const i of o.items) {
        combined.set(i.name, (combined.get(i.name) ?? 0) + i.qty);
      }
    }
    const driverId = nearestDriverId(restaurant.lat, restaurant.lng);
    const driver = drivers.find((d) => d.id === driverId)!;
    // Transparent estimate: kitchen prep + 8 min base delivery + 2 min per
    // extra stop. Shown as "~N min" everywhere.
    const etaMinutes = (PREP_MINUTES[rid] ?? 15) + 8 + 2 * (orders.length - 1);
    return {
      restaurantId: rid,
      restaurantName: restaurant.name,
      cuisine: restaurant.cuisine,
      orderIds: orders.map((o) => o.id),
      orderCount: orders.length,
      combinedTotal: orders.reduce((s, o) => s + o.total, 0),
      items: [...combined.entries()].map(([name, qty]) => ({ name, qty })),
      driverId,
      driverName: driver.name,
      vehicle: VEHICLES[driverId] ?? { type: "car", capacity: 4, area: "Central" },
      etaMinutes,
      window: windowLabel(30, 60),
    };
  });
}

const ADVANCE_FROM = {
  accepted: "open",
  "picked-up": "accepted",
  delivered: "picked-up",
} as const;

// Claim or advance every order in a restaurant's current run. Returns the
// number of orders moved.
export function moveRun(
  restaurantId: string,
  driverId: string,
  status: "accepted" | "picked-up" | "delivered"
): number {
  const from = ADVANCE_FROM[status];
  let moved = 0;
  for (const o of listOrders()) {
    if (o.restaurantId !== restaurantId || o.status !== from) continue;
    if (from !== "open" && o.driverId !== driverId) continue;
    updateOrder(o.id, { status, driverId });
    moved++;
  }
  return moved;
}
