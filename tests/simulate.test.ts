import { describe, expect, it } from "vitest";
import { simulateCorridor, simulateLivestock } from "../lib/simulate";

describe("simulateLivestock", () => {
  const INPUT = {
    goats: 8,
    dairyGoats: 2,
    paddocks: 5,
    acresPerPaddock: 0.5,
    restDays: 28,
    startDate: "2026-11-08",
  };

  it("builds a 35-day rotation with known outputs", () => {
    const r = simulateLivestock(INPUT);
    expect(r.grazeDaysEach).toBe(7);
    expect(r.cycleDays).toBe(35);
    expect(r.schedule).toHaveLength(5);
    expect(r.schedule[0]).toEqual({ paddock: 1, start: "Nov 8", end: "Nov 14" });
    expect(r.overstocked).toBe(false);
    expect(r.manureLbs).toBe(1260);
    expect(r.gardenSqftFed).toBe(630);
    expect(r.milkLbs).toBe(420);
  });

  it("flags overstocking when forage runs short", () => {
    const r = simulateLivestock({ ...INPUT, goats: 100, paddocks: 2, acresPerPaddock: 0.1 });
    expect(r.overstocked).toBe(true);
  });

  it("clamps tiny herds and paddock counts", () => {
    const r = simulateLivestock({ ...INPUT, goats: 0, paddocks: 1 });
    expect(r.schedule).toHaveLength(2);
    expect(r.manureLbs).toBeGreaterThan(0);
  });
});

describe("simulateCorridor", () => {
  it("computes area, dogs, gates, and cost", () => {
    const r = simulateCorridor({ yards: 6, lotWidthFt: 50, runWidthFt: 20 });
    expect(r.lengthFt).toBe(300);
    expect(r.areaSqft).toBe(6000);
    expect(r.dogs).toBe(12);
    expect(r.gates).toBe(7);
    expect(r.costLow).toBe(1160);
    expect(r.costHigh).toBe(1960);
  });

  it("requires at least 2 yards", () => {
    const r = simulateCorridor({ yards: 1, lotWidthFt: 50, runWidthFt: 20 });
    expect(r.lengthFt).toBe(100);
    expect(r.gates).toBe(3);
  });
});
