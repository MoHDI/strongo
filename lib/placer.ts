// Resource placer: k-means facility placement over SIMULATED demand.
// Answers "where should N fridges/tool sheds go?" Deterministic: same
// (seed, k, demand) always yields the same placement.

import { PILOT_BOUNDS, mulberry32 } from "./maplab";
import { haversineMiles } from "./lab-sim";

export interface FacilityInput {
  /** Number of facilities to place (1..8). */
  k: number;
  /** Simulated demand points to cover. */
  demandCount: number;
  /** Seed for deterministic demand. */
  seed: number;
  /** Coverage radius in miles for the coverage metric. */
  withinMiles: number;
}

export interface PlacedFacility {
  id: string;
  name: string;
  lat: number;
  lng: number;
  assigned: number;
  demandShare: number;
}

export interface Placement {
  facilities: PlacedFacility[];
  points: Array<{ lat: number; lng: number }>;
  /** Average miles from each demand point to its nearest facility. */
  avgMiles: number;
  /** Share of demand within `withinMiles` of a facility (0..1). */
  coverage: number;
}

function demandPoints(count: number, seed: number): Array<{ lat: number; lng: number }> {
  const rand = mulberry32(seed);
  const pts: Array<{ lat: number; lng: number }> = [];
  const n = Math.max(1, Math.floor(count));
  for (let i = 0; i < n; i++) {
    pts.push({
      lat: PILOT_BOUNDS.minLat + rand() * (PILOT_BOUNDS.maxLat - PILOT_BOUNDS.minLat),
      lng: PILOT_BOUNDS.minLng + rand() * (PILOT_BOUNDS.maxLng - PILOT_BOUNDS.minLng),
    });
  }
  return pts;
}

export function placeFacilities(input: FacilityInput, label = "Site"): Placement {
  const k = Math.min(8, Math.max(1, Math.floor(input.k)));
  const points = demandPoints(input.demandCount, input.seed);

  // Deterministic spread init: evenly spaced points across the sorted list.
  const sorted = [...points].sort((a, b) => a.lat - b.lat || a.lng - b.lng);
  let centers = Array.from({ length: k }, (_, i) => {
    const p = sorted[Math.floor(((i + 0.5) / k) * sorted.length)];
    return { lat: p.lat, lng: p.lng };
  });

  let assign = new Array<number>(points.length).fill(0);
  for (let iter = 0; iter < 25; iter++) {
    // Assign each point to its nearest center.
    assign = points.map((p) => {
      let best = 0;
      let bestD = Infinity;
      centers.forEach((c, i) => {
        const d = haversineMiles(p.lat, p.lng, c.lat, c.lng);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      return best;
    });
    // Move each center to its cluster mean (empty clusters keep old center).
    centers = centers.map((c, i) => {
      const owned = points.filter((_, j) => assign[j] === i);
      if (owned.length === 0) return c;
      return {
        lat: owned.reduce((s, p) => s + p.lat, 0) / owned.length,
        lng: owned.reduce((s, p) => s + p.lng, 0) / owned.length,
      };
    });
  }

  const facilities: PlacedFacility[] = centers.map((c, i) => {
    const assigned = assign.filter((a) => a === i).length;
    return {
      id: `site-${i}`,
      name: `${label} ${i + 1}`,
      lat: Math.round(c.lat * 10000) / 10000,
      lng: Math.round(c.lng * 10000) / 10000,
      assigned,
      demandShare: assigned / points.length,
    };
  });

  let totalD = 0;
  let covered = 0;
  points.forEach((p, j) => {
    const c = centers[assign[j]];
    const d = haversineMiles(p.lat, p.lng, c.lat, c.lng);
    totalD += d;
    if (d <= input.withinMiles) covered++;
  });

  return {
    facilities,
    points,
    avgMiles: Math.round((totalD / points.length) * 100) / 100,
    coverage: Math.round((covered / points.length) * 100) / 100,
  };
}
