// In-memory demo store. Resets on redeploy — acceptable for the hackathon
// demo; a real deployment would back this with Postgres (see roadmap).

export type OrderStatus = "open" | "accepted" | "picked-up" | "delivered";

export interface MenuItem {
  id: string;
  name: string;
  price: number;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  lat: number;
  lng: number;
  menu: MenuItem[];
}

export interface Driver {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface OrderItem {
  name: string;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  restaurantId: string;
  items: OrderItem[];
  total: number;
  address: string;
  status: OrderStatus;
  driverId: string | null;
  createdAt: string;
}

// Fictional pilot neighborhood ("Maplewood") with plausible coordinates.
// Real restaurant data via OpenStreetMap/Overture is a post-hackathon step.
export const restaurants: Restaurant[] = [
  {
    id: "verde",
    name: "Verde Taqueria",
    cuisine: "Mexican",
    lat: 30.2691,
    lng: -97.7452,
    menu: [
      { id: "v1", name: "Chicken Caesar wrap", price: 12 },
      { id: "v2", name: "Al pastor tacos (3)", price: 11 },
      { id: "v3", name: "Elote bowl", price: 9 },
      { id: "v4", name: "Horchata", price: 4 },
    ],
  },
  {
    id: "nonna",
    name: "Nonna's Slice",
    cuisine: "Italian",
    lat: 30.2668,
    lng: -97.7491,
    menu: [
      { id: "n1", name: "Margherita pie", price: 16 },
      { id: "n2", name: "Pepperoni slice", price: 5 },
      { id: "n3", name: "Caesar salad", price: 10 },
      { id: "n4", name: "Garlic knots (6)", price: 7 },
    ],
  },
  {
    id: "golden",
    name: "Golden Wok",
    cuisine: "Chinese",
    lat: 30.2712,
    lng: -97.7418,
    menu: [
      { id: "g1", name: "Kung pao chicken", price: 14 },
      { id: "g2", name: "Vegetable lo mein", price: 12 },
      { id: "g3", name: "Soup dumplings (8)", price: 11 },
      { id: "g4", name: "Egg rolls (2)", price: 5 },
    ],
  },
  {
    id: "daily",
    name: "Daily Grind Cafe",
    cuisine: "Cafe",
    lat: 30.2651,
    lng: -97.7435,
    menu: [
      { id: "d1", name: "Turkey club", price: 13 },
      { id: "d2", name: "Tomato soup + toast", price: 9 },
      { id: "d3", name: "Cold brew", price: 5 },
      { id: "d4", name: "Banana bread", price: 4 },
    ],
  },
];

export const drivers: Driver[] = [
  { id: "priya", name: "Priya", lat: 30.2683, lng: -97.747 },
  { id: "marcus", name: "Marcus", lat: 30.2661, lng: -97.7442 },
];

const orders = new Map<string, Order>();
let seq = 1;

export function createOrder(input: {
  restaurantId: string;
  items: OrderItem[];
  address: string;
}): Order {
  const total = input.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const order: Order = {
    id: `order-${seq++}`,
    restaurantId: input.restaurantId,
    items: input.items,
    total,
    address: input.address,
    status: "open",
    driverId: null,
    createdAt: new Date().toISOString(),
  };
  orders.set(order.id, order);
  return order;
}

export function listOrders(): Order[] {
  return [...orders.values()].reverse();
}

export function getOrder(id: string): Order | null {
  return orders.get(id) ?? null;
}

export function updateOrder(
  id: string,
  patch: { status?: OrderStatus; driverId?: string | null }
): Order | null {
  const order = orders.get(id);
  if (!order) return null;
  if (patch.status) order.status = patch.status;
  if (patch.driverId !== undefined) order.driverId = patch.driverId;
  return order;
}

export function restaurantById(id: string): Restaurant | null {
  return restaurants.find((r) => r.id === id) ?? null;
}

export function driverById(id: string): Driver | null {
  return drivers.find((d) => d.id === id) ?? null;
}

let menuSeq = 1;

export function addMenuItems(
  restaurantId: string,
  items: Array<{ name: string; price: number }>
): Restaurant | null {
  const restaurant = restaurantById(restaurantId);
  if (!restaurant) return null;
  for (const item of items) {
    restaurant.menu.push({ id: `scan-${menuSeq++}`, name: item.name, price: item.price });
  }
  return restaurant;
}
