// Map Lab overlay helpers + deterministic SIMULATED demand generator.
//
// Everything here is local and deterministic: the same (seed, count) pair
// always yields the same points, so scenario presets are stable across
// reloads. Simulated points are labeled SIMULATED in the UI and never hit
// the network.

export const PILOT_CENTER: [number, number] = [45.543, -122.665];
export const PILOT_ZOOM = 12;

// Rough bounding box covering the Pearl District + Alberta Arts pilot area.
export const PILOT_BOUNDS = {
  minLat: 45.52,
  maxLat: 45.565,
  minLng: -122.69,
  maxLng: -122.64,
} as const;

export interface SimulatedDemandPoint {
  id: string;
  lat: number;
  lng: number;
  /** 0..1 relative intensity, drives fill opacity scaling. */
  intensity: number;
  /** Simulated order count at this point (1..5). */
  orders: number;
}

export interface LabDriver {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface LabServiceArea {
  id: string;
  name: string;
  points: Array<[number, number]>;
}

export interface LabDeliveryRun {
  id: string;
  label: string;
  points: Array<[number, number]>;
}

export interface LabLayerFlags {
  restaurants: boolean;
  hubs: boolean;
  demand: boolean;
  runs: boolean;
  areas: boolean;
  drivers: boolean;
}

export interface ScenarioPreset {
  name: string;
  seed: number;
  orderCount: number;
  heatRadius: number;
  heatOpacity: number;
  layers: LabLayerFlags;
}

/** Deterministic PRNG (mulberry32). Same seed => same sequence. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate `count` deterministic SIMULATED demand points for a seed.
 * Pure function: no Date.now / Math.random inside.
 */
export function generateSimulatedDemand(
  seed: number,
  count: number
): SimulatedDemandPoint[] {
  const n = Math.max(0, Math.floor(count));
  const rand = mulberry32(seed);
  const points: SimulatedDemandPoint[] = [];
  for (let i = 0; i < n; i++) {
    const lat =
      PILOT_BOUNDS.minLat +
      rand() * (PILOT_BOUNDS.maxLat - PILOT_BOUNDS.minLat);
    const lng =
      PILOT_BOUNDS.minLng +
      rand() * (PILOT_BOUNDS.maxLng - PILOT_BOUNDS.minLng);
    const intensity = 0.3 + rand() * 0.7;
    const orders = 1 + Math.floor(rand() * 4);
    points.push({
      id: `sim-${seed}-${i}`,
      lat: Math.round(lat * 10000) / 10000,
      lng: Math.round(lng * 10000) / 10000,
      intensity: Math.round(intensity * 100) / 100,
      orders,
    });
  }
  return points;
}

/** Static dev-driver markers for the lab overlay (fictional positions). */
export const LAB_DRIVERS: LabDriver[] = [
  { id: "lab-driver-1", name: "Driver Ada", lat: 45.527, lng: -122.68 },
  { id: "lab-driver-2", name: "Driver Ben", lat: 45.532, lng: -122.676 },
  { id: "lab-driver-3", name: "Driver Cal", lat: 45.558, lng: -122.651 },
  { id: "lab-driver-4", name: "Driver Dee", lat: 45.545, lng: -122.665 },
];

/** Service-area polygons: one per pilot neighborhood. */
export const LAB_SERVICE_AREAS: LabServiceArea[] = [
  {
    id: "area-pearl",
    name: "Pearl District service area",
    points: [
      [45.531, -122.686],
      [45.531, -122.674],
      [45.522, -122.674],
      [45.522, -122.686],
    ],
  },
  {
    id: "area-alberta",
    name: "Alberta Arts service area",
    points: [
      [45.563, -122.657],
      [45.563, -122.644],
      [45.555, -122.644],
      [45.555, -122.657],
    ],
  },
];

/** Delivery-run polylines between pilot restaurants and hubs (demo paths). */
export const LAB_DELIVERY_RUNS: LabDeliveryRun[] = [
  {
    id: "run-pearl-1",
    label: "Slash & Pearl → Pearl Community Fridge",
    points: [
      [45.5282, -122.6801],
      [45.5268, -122.6795],
      [45.5253, -122.679],
    ],
  },
  {
    id: "run-pearl-2",
    label: "Jade Dumpling Den → Jamison Porch Pickup",
    points: [
      [45.5261, -122.6823],
      [45.5275, -122.683],
      [45.5288, -122.6835],
    ],
  },
  {
    id: "run-alberta-1",
    label: "Alberta Pie Co. → Alberta Ride Circle",
    points: [
      [45.5592, -122.6505],
      [45.5599, -122.6498],
      [45.5605, -122.6492],
    ],
  },
];

export const ALL_LAYERS_ON: LabLayerFlags = {
  restaurants: true,
  hubs: true,
  demand: true,
  runs: true,
  areas: true,
  drivers: true,
};

/** Scenario presets: each sets every control value and regenerates demand. */
export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    name: "Dinner rush",
    seed: 7,
    orderCount: 40,
    heatRadius: 350,
    heatOpacity: 0.55,
    layers: { ...ALL_LAYERS_ON },
  },
  {
    name: "Quiet morning",
    seed: 21,
    orderCount: 8,
    heatRadius: 250,
    heatOpacity: 0.35,
    layers: { ...ALL_LAYERS_ON },
  },
  {
    name: "Rainy Friday",
    seed: 99,
    orderCount: 60,
    heatRadius: 500,
    heatOpacity: 0.65,
    layers: { ...ALL_LAYERS_ON },
  },
];
