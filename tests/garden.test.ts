import { describe, expect, it } from "vitest";
import { buildPlan, estimateZone } from "../lib/garden";

const BASE = {
  areaSqft: 200,
  sun: "full" as const,
  effort: "medium" as const,
  zone: 8,
  southern: false,
  today: new Date(2026, 4, 1),
};

describe("estimateZone", () => {
  it("estimates Austin TX as zone 9", () => {
    expect(estimateZone(30.27)).toBe(9);
  });

  it("clamps to 3..11", () => {
    expect(estimateZone(0)).toBeLessThanOrEqual(11);
    expect(estimateZone(80)).toBeGreaterThanOrEqual(3);
  });
});

describe("buildPlan", () => {
  it("picks 6 crops with known totals for a zone-8 bed", () => {
    const plan = buildPlan(BASE);
    expect(plan.crops.map((c) => c.name)).toEqual([
      "Zucchini",
      "Kale",
      "Green beans",
      "Lettuce",
      "Spinach",
      "Peas",
    ]);
    expect(plan.totalYieldLow).toBe(69);
    expect(plan.totalYieldHigh).toBe(126);
    expect(plan.totalHoursPerWeek).toBe(1.3);
  });

  it("marks in-season crops as plant-now", () => {
    const plan = buildPlan(BASE);
    const zucchini = plan.crops.find((c) => c.id === "zucchini");
    expect(zucchini?.plantNow).toBe(true);
  });

  it("restricts part-shade plots to tolerant crops with a note", () => {
    const plan = buildPlan({ ...BASE, sun: "part" });
    expect(plan.crops.length).toBeGreaterThan(0);
    expect(plan.notes.length).toBeGreaterThan(0);
  });

  it("falls back to zone-8 frost dates for unknown zones", () => {
    const plan = buildPlan({ ...BASE, zone: 99 });
    expect(plan.crops).toEqual([]);
    expect(plan.frostLabel).toContain("Mar 20");
  });

  it("flips seasons for the southern hemisphere", () => {
    const plan = buildPlan({ ...BASE, southern: true });
    expect(plan.frostLabel).toContain("Sep 18");
  });
});
