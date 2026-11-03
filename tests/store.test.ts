import { describe, expect, it } from "vitest";
import {
  createOrder,
  driverById,
  getOrder,
  listOrders,
  restaurantById,
  updateOrder,
} from "../lib/store";

describe("store", () => {
  it("creates orders with computed totals", () => {
    const order = createOrder({
      restaurantId: "verde",
      items: [
        { name: "Al pastor tacos (3)", price: 11, qty: 2 },
        { name: "Horchata", price: 4, qty: 1 },
      ],
      address: "123 Maple St",
    });
    expect(order.id).toMatch(/^order-\d+$/);
    expect(order.total).toBe(26);
    expect(order.status).toBe("open");
    expect(order.driverId).toBeNull();
  });

  it("lists created orders and fetches by id", () => {
    const order = createOrder({ restaurantId: "daily", items: [], address: "1 Test Way" });
    expect(order.total).toBe(0);
    expect(listOrders().some((o) => o.id === order.id)).toBe(true);
    expect(getOrder(order.id)?.address).toBe("1 Test Way");
    expect(getOrder("order-nope")).toBeNull();
  });

  it("updates status and driver, or null when missing", () => {
    const order = createOrder({ restaurantId: "daily", items: [], address: "2 Test Way" });
    const updated = updateOrder(order.id, { status: "accepted", driverId: "priya" });
    expect(updated?.status).toBe("accepted");
    expect(updated?.driverId).toBe("priya");
    expect(updateOrder("order-nope", { status: "accepted" })).toBeNull();
  });

  it("looks up restaurants and drivers", () => {
    expect(restaurantById("verde")?.name).toBe("Verde Taqueria");
    expect(restaurantById("nope")).toBeNull();
    expect(driverById("priya")?.name).toBe("Priya");
    expect(driverById("nope")).toBeNull();
  });
});
