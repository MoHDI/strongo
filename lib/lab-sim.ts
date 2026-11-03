// Lab game-feel + driver-economics sim helpers (SIMULATED data only).
//
// Pure deterministic functions: no Math.random, no Date.now inside.
// Randomness comes from an explicit `seed` argument (mulberry32 PRNG);
// time-varying behavior takes the hour as an argument (`hourlyMultiplier`).
// All money is in USD.

import { PILOT_BOUNDS, mulberry32 } from "./maplab";

// ---------------------------------------------------------------------------
// Driver earnings model
// ---------------------------------------------------------------------------

export interface EarningsInput {
  /** Scheduled hours per week. */
  hoursPerWeek: number;
  /** Deliveries completed per active hour. */
  deliveriesPerHour: number;
  /** Flat payout per delivery (before tip). */
  basePerDelivery: number;
  /** Average customer tip per delivery. */
  avgTip: number;
  /** Vehicle operating cost per mile (fuel/charge + wear). */
  costPerMile: number;
  /** Average miles driven per delivery. */
  milesPerDelivery: number;
}

export interface EarningsResult {
  /** Weekly pay before costs: hours * rate * (base + tip). */
  gross: number;
  /** Weekly vehicle costs: hours * rate * miles * costPerMile. */
  costs: number;
  /** Weekly take-home: gross - costs. */
  net: number;
  /** Take-home per scheduled hour: net / hoursPerWeek (0 when 0 hours). */
  netPerHour: number;
  /** Rough monthly take-home: net * 52 / 12. */
  monthly: number;
}

/** Vehicle presets: IRS-style per-mile operating costs. */
export const VEHICLE_COST_PER_MILE = {
  /** E-bike: tires, brake pads, battery amortization. */
  bike: 0.05,
  /** Sedan: fuel + insurance share + maintenance + depreciation. */
  car: 0.67,
} as const;

/**
 * Deterministic driver-earnings estimate. The math is deliberately linear
 * and fully shown below so the lab ledger can display every step:
 *
 *   deliveries  = hoursPerWeek * deliveriesPerHour
 *   gross       = deliveries * (basePerDelivery + avgTip)
 *   miles       = deliveries * milesPerDelivery
 *   costs       = miles * costPerMile
 *   net         = gross - costs
 *   netPerHour  = net / hoursPerWeek   (guarded: 0 hours => 0)
 *   monthly     = net * 52 / 12        (average weeks per month)
 */
export function estimateEarnings(input: EarningsInput): EarningsResult {
  const hours = Math.max(0, input.hoursPerWeek);
  const rate = Math.max(0, input.deliveriesPerHour);
  const perDelivery = input.basePerDelivery + input.avgTip;
  // Total deliveries worked in the week.
  const deliveries = hours * rate;
  // Customer-facing pay: every delivery pays base + tip.
  const gross = deliveries * perDelivery;
  // Miles driven, then vehicle operating cost for those miles.
  const miles = deliveries * Math.max(0, input.milesPerDelivery);
  const costs = miles * Math.max(0, input.costPerMile);
  // Take-home and its per-hour / per-month views.
  const net = gross - costs;
  const netPerHour = hours > 0 ? net / hours : 0;
  const monthly = (net * 52) / 12;
  return { gross, costs, net, netPerHour, monthly };
}

/**
 * Fair-share saturation: when `driverCount` drivers split `areaOrdersPerHr`
 * area orders per hour evenly, each driver can complete at most
 * areaOrdersPerHr / driverCount deliveries per hour. Returns the
 * achievable rate (never above the driver's own `baseRate`, never below 0).
 */
export function saturatedRate(
  baseRate: number,
  areaOrdersPerHr: number,
  driverCount: number
): number {
  const drivers = Math.max(1, Math.floor(driverCount));
  const fairShare = Math.max(0, areaOrdersPerHr) / drivers;
  return Math.max(0, Math.min(Math.max(0, baseRate), fairShare));
}

// ---------------------------------------------------------------------------
// Coverage planner (Voronoi-style exclusive zones over PILOT_BOUNDS)
// ---------------------------------------------------------------------------

export interface DriverHome {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface CoverageInput {
  driverHomes: DriverHome[];
  /** Grid is gridSize x gridSize cells covering PILOT_BOUNDS. */
  gridSize: number;
  /** Seed for deterministic per-cell demand. */
  seed: number;
  /** Cells within this many miles of 2+ homes are flagged shared. */
  bufferMiles: number;
}

export interface CoverageCell {
  row: number;
  col: number;
  /** Cell-center latitude / longitude. */
  lat: number;
  lng: number;
  /** Seeded weekly order demand for this cell (1..5). */
  demand: number;
  /** Id of the nearest driver home (exclusive zone owner). */
  ownerId: string;
  /** True when within bufferMiles of 2 or more homes. */
  shared: boolean;
}

export interface DriverCoverage {
  id: string;
  name: string;
  /** Number of grid cells owned. */
  cells: number;
  /** Sum of owned-cell demand. */
  demand: number;
  /** Share of total grid demand (0..1). */
  demandShare: number;
  /**
   * Load vs a perfectly even split: demandShare * homeCount * 100.
   * 100 = exactly fair, >100 = overloaded, <100 = underloaded.
   */
  loadPct: number;
}

export interface CoveragePlan {
  cells: CoverageCell[];
  drivers: DriverCoverage[];
  totalDemand: number;
  /** Balance score: min demandShare / max demandShare (0..1, 1 = even). */
  balanceScore: number;
  sharedCount: number;
}

/** Great-circle distance in miles (haversine). Pure function. */
export function haversineMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const earthMiles = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return 2 * earthMiles * Math.asin(Math.sqrt(a));
}

/**
 * Bin PILOT_BOUNDS into a gridSize x gridSize grid, assign each cell to its
 * nearest driver home (exclusive Voronoi-style zone), and sum seeded
 * per-cell demand (1..5 orders from mulberry32(seed), row-major order).
 * Cells within `bufferMiles` of 2+ homes are flagged `shared` (contested
 * overlap) but still count toward their single nearest owner's load.
 */
export function planCoverage(input: CoverageInput): CoveragePlan {
  const size = Math.max(1, Math.floor(input.gridSize));
  const homes = input.driverHomes;
  const rand = mulberry32(input.seed);
  const latSpan = PILOT_BOUNDS.maxLat - PILOT_BOUNDS.minLat;
  const lngSpan = PILOT_BOUNDS.maxLng - PILOT_BOUNDS.minLng;

  const cells: CoverageCell[] = [];
  // Guard: no homes => empty plan (avoids divide-by-zero below).
  if (homes.length === 0) {
    return { cells, drivers: [], totalDemand: 0, balanceScore: 1, sharedCount: 0 };
  }

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      // Cell center in lat/lng.
      const lat =
        PILOT_BOUNDS.minLat + ((row + 0.5) / size) * latSpan;
      const lng =
        PILOT_BOUNDS.minLng + ((col + 0.5) / size) * lngSpan;
      // Seeded demand for this cell: 1..5 orders.
      const demand = 1 + Math.floor(rand() * 5);
      // Distances to every home; nearest wins the cell.
      const dists = homes.map((h) =>
        haversineMiles(lat, lng, h.lat, h.lng)
      );
      let ownerIdx = 0;
      for (let i = 1; i < dists.length; i++) {
        if (dists[i] < dists[ownerIdx]) ownerIdx = i;
      }
      // Shared when 2+ homes sit within the buffer radius.
      const nearby = dists.filter((d) => d <= input.bufferMiles).length;
      cells.push({
        row,
        col,
        lat: Math.round(lat * 10000) / 10000,
        lng: Math.round(lng * 10000) / 10000,
        demand,
        ownerId: homes[ownerIdx].id,
        shared: nearby >= 2,
      });
    }
  }

  const totalDemand = cells.reduce((sum, c) => sum + c.demand, 0);
  const drivers: DriverCoverage[] = homes.map((h) => {
    const owned = cells.filter((c) => c.ownerId === h.id);
    const demand = owned.reduce((sum, c) => sum + c.demand, 0);
    const demandShare = totalDemand > 0 ? demand / totalDemand : 0;
    return {
      id: h.id,
      name: h.name,
      cells: owned.length,
      demand,
      demandShare,
      // Fair share is 1/homes.length; load 100 = exactly fair.
      loadPct: demandShare * homes.length * 100,
    };
  });

  // Balance: worst-off share divided by best-off share (1 = perfectly even).
  const shares = drivers.map((d) => d.demandShare);
  const maxShare = Math.max(...shares);
  const minShare = Math.min(...shares);
  const balanceScore = maxShare > 0 ? minShare / maxShare : 1;

  return {
    cells,
    drivers,
    totalDemand,
    sharedCount: cells.filter((c) => c.shared).length,
    balanceScore: Math.round(balanceScore * 100) / 100,
  };
}

// ---------------------------------------------------------------------------
// Hourly demand multipliers (0..23)
// ---------------------------------------------------------------------------

/** Gaussian bump centered at `at` with spread `width` (in hours). */
function bump(h: number, at: number, width: number): number {
  const d = h - at;
  return Math.exp(-(d * d) / (2 * width * width));
}

/**
 * Relative demand multiplier for an hour of day (0..23, floored).
 * Lunch bump around 12:00 and a taller dinner bump around 18:30 sit on a
 * quiet overnight base; out-of-range hours clamp to 0..23. Deterministic.
 */
export function hourlyMultiplier(h: number): number {
  const hour = Math.min(23, Math.max(0, Math.floor(h)));
  // Overnight base + lunch peak + dinner peak (taller and wider).
  const m = 0.55 + 0.75 * bump(hour, 12, 1.5) + 1.15 * bump(hour, 18.5, 1.75);
  return Math.round(m * 100) / 100;
}
