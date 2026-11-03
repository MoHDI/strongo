// Yard-to-garden planner: pure functions over a static crop database.
// Zones, frost dates, yields, and hours are APPROXIMATIONS for planning.
// The UI labels them as estimates and links the official USDA map.

export interface Crop {
  id: string;
  name: string;
  season: "cool" | "warm";
  minZone: number;
  maxZone: number;
  maturityDays: number;
  sun: "full" | "part"; // "part" tolerates partial shade
  difficulty: 1 | 2 | 3;
  hoursPerWeekPer100Sqft: number;
  yieldLbsPer100Sqft: number;
  water: "low" | "medium" | "high";
  note: string;
  windowNote?: string; // overrides computed window (perennials, fall-planted)
}

export const CROPS: Crop[] = [
  { id: "lettuce", name: "Lettuce", season: "cool", minZone: 4, maxZone: 10, maturityDays: 45, sun: "part", difficulty: 1, hoursPerWeekPer100Sqft: 0.5, yieldLbsPer100Sqft: 30, water: "medium", note: "Cut-and-come-again; sow every 2 weeks." },
  { id: "spinach", name: "Spinach", season: "cool", minZone: 3, maxZone: 9, maturityDays: 40, sun: "part", difficulty: 1, hoursPerWeekPer100Sqft: 0.5, yieldLbsPer100Sqft: 25, water: "medium", note: "Bolts in heat; spring and fall crops." },
  { id: "kale", name: "Kale", season: "cool", minZone: 3, maxZone: 10, maturityDays: 55, sun: "part", difficulty: 1, hoursPerWeekPer100Sqft: 0.5, yieldLbsPer100Sqft: 50, water: "medium", note: "Survives light frosts; sweeter after cold." },
  { id: "peas", name: "Peas", season: "cool", minZone: 3, maxZone: 9, maturityDays: 60, sun: "full", difficulty: 1, hoursPerWeekPer100Sqft: 0.5, yieldLbsPer100Sqft: 25, water: "medium", note: "Fix nitrogen; give them a trellis." },
  { id: "carrots", name: "Carrots", season: "cool", minZone: 3, maxZone: 10, maturityDays: 70, sun: "full", difficulty: 2, hoursPerWeekPer100Sqft: 0.75, yieldLbsPer100Sqft: 60, water: "medium", note: "Needs loose, stone-free soil." },
  { id: "broccoli", name: "Broccoli", season: "cool", minZone: 3, maxZone: 10, maturityDays: 70, sun: "full", difficulty: 2, hoursPerWeekPer100Sqft: 0.75, yieldLbsPer100Sqft: 35, water: "medium", note: "Side shoots keep producing." },
  { id: "onions", name: "Onions", season: "cool", minZone: 3, maxZone: 10, maturityDays: 100, sun: "full", difficulty: 2, hoursPerWeekPer100Sqft: 0.75, yieldLbsPer100Sqft: 60, water: "medium", note: "Match variety to your latitude." },
  { id: "potatoes", name: "Potatoes", season: "cool", minZone: 3, maxZone: 10, maturityDays: 90, sun: "full", difficulty: 2, hoursPerWeekPer100Sqft: 1, yieldLbsPer100Sqft: 80, water: "medium", note: "Hill soil up as vines grow." },
  { id: "garlic", name: "Garlic", season: "cool", minZone: 3, maxZone: 9, maturityDays: 240, sun: "full", difficulty: 1, hoursPerWeekPer100Sqft: 0.25, yieldLbsPer100Sqft: 20, water: "low", note: "Plant in fall, harvest in summer.", windowNote: "Plant in fall, harvest early summer" },
  { id: "tomatoes", name: "Tomatoes", season: "warm", minZone: 4, maxZone: 11, maturityDays: 75, sun: "full", difficulty: 2, hoursPerWeekPer100Sqft: 1.5, yieldLbsPer100Sqft: 100, water: "high", note: "Highest payoff per square foot." },
  { id: "zucchini", name: "Zucchini", season: "warm", minZone: 4, maxZone: 11, maturityDays: 55, sun: "full", difficulty: 1, hoursPerWeekPer100Sqft: 1, yieldLbsPer100Sqft: 120, water: "high", note: "Two plants feed a block. You were warned." },
  { id: "beans", name: "Green beans", season: "warm", minZone: 4, maxZone: 11, maturityDays: 50, sun: "full", difficulty: 1, hoursPerWeekPer100Sqft: 0.75, yieldLbsPer100Sqft: 45, water: "medium", note: "Pick often and they keep coming." },
  { id: "cucumbers", name: "Cucumbers", season: "warm", minZone: 4, maxZone: 11, maturityDays: 55, sun: "full", difficulty: 2, hoursPerWeekPer100Sqft: 1, yieldLbsPer100Sqft: 70, water: "high", note: "Trellis to save space." },
  { id: "peppers", name: "Peppers", season: "warm", minZone: 5, maxZone: 11, maturityDays: 70, sun: "full", difficulty: 2, hoursPerWeekPer100Sqft: 1, yieldLbsPer100Sqft: 40, water: "medium", note: "Wait for warm nights to transplant." },
  { id: "basil", name: "Basil", season: "warm", minZone: 5, maxZone: 11, maturityDays: 65, sun: "full", difficulty: 1, hoursPerWeekPer100Sqft: 0.5, yieldLbsPer100Sqft: 12, water: "medium", note: "Plant beside the tomatoes." },
  { id: "eggplant", name: "Eggplant", season: "warm", minZone: 5, maxZone: 11, maturityDays: 75, sun: "full", difficulty: 3, hoursPerWeekPer100Sqft: 1.25, yieldLbsPer100Sqft: 45, water: "high", note: "Needs heat and patience." },
  { id: "sweet-potatoes", name: "Sweet potatoes", season: "warm", minZone: 7, maxZone: 11, maturityDays: 100, sun: "full", difficulty: 2, hoursPerWeekPer100Sqft: 0.75, yieldLbsPer100Sqft: 80, water: "low", note: "Loves heat; vines shade out weeds." },
  { id: "strawberries", name: "Strawberries", season: "cool", minZone: 4, maxZone: 10, maturityDays: 90, sun: "full", difficulty: 2, hoursPerWeekPer100Sqft: 1, yieldLbsPer100Sqft: 30, water: "medium", note: "Perennial; pays back for years.", windowNote: "Plant in spring; harvest from year two" },
];

export interface FrostDates {
  lastSpring: [number, number]; // [month, day]
  firstFall: [number, number];
}

// Approximate average frost dates by zone. Confirm locally.
export const FROST: Record<number, FrostDates> = {
  3: { lastSpring: [5, 15], firstFall: [9, 15] },
  4: { lastSpring: [5, 10], firstFall: [10, 1] },
  5: { lastSpring: [4, 30], firstFall: [10, 10] },
  6: { lastSpring: [4, 20], firstFall: [10, 20] },
  7: { lastSpring: [4, 10], firstFall: [10, 30] },
  8: { lastSpring: [3, 20], firstFall: [11, 15] },
  9: { lastSpring: [2, 20], firstFall: [12, 1] },
  10: { lastSpring: [1, 30], firstFall: [12, 15] },
  11: { lastSpring: [1, 15], firstFall: [12, 31] },
};

// Rough continental fit. Coastal and mountain areas differ by ±2 zones —
// the UI says so and offers a manual override.
export function estimateZone(lat: number): number {
  const zone = Math.round((62 - Math.abs(lat)) / 3.4);
  return Math.min(11, Math.max(3, zone));
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function fmt(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}

export interface PlanInput {
  areaSqft: number;
  sun: "full" | "part";
  effort: "low" | "medium" | "high";
  zone: number;
  southern: boolean;
  today?: Date;
}

export interface PlannedCrop {
  id: string;
  name: string;
  season: "cool" | "warm";
  shareSqft: number;
  yieldLow: number;
  yieldHigh: number;
  hoursPerWeek: number;
  water: "low" | "medium" | "high";
  note: string;
  window: string;
  plantNow: boolean;
  difficulty: number;
}

export interface GardenPlan {
  crops: PlannedCrop[];
  totalYieldLow: number;
  totalYieldHigh: number;
  totalHoursPerWeek: number;
  frostLabel: string;
  notes: string[];
}

const MAX_DIFFICULTY = { low: 1, medium: 2, high: 3 } as const;

export function buildPlan(input: PlanInput): GardenPlan {
  const today = input.today ?? new Date();
  const frost = FROST[input.zone] ?? FROST[8];
  const notes: string[] = [];

  const year = today.getFullYear();
  let spring = new Date(year, frost.lastSpring[0] - 1, frost.lastSpring[1]);
  let fall = new Date(year, frost.firstFall[0] - 1, frost.firstFall[1]);
  if (input.southern) {
    spring = addDays(spring, 182);
    fall = addDays(fall, 182);
  }

  const maxDiff = MAX_DIFFICULTY[input.effort];
  let pool = CROPS.filter(
    (c) =>
      input.zone >= c.minZone &&
      input.zone <= c.maxZone &&
      c.difficulty <= maxDiff &&
      (input.sun === "full" || c.sun === "part")
  );
  if (input.sun === "part") {
    notes.push("Partial shade: only shade-tolerant crops shown. Full-sun beds would add tomatoes, beans, and squash.");
  }
  if (pool.length < 3) {
    // Relax difficulty rather than return an empty plan.
    pool = CROPS.filter(
      (c) =>
        input.zone >= c.minZone &&
        input.zone <= c.maxZone &&
        (input.sun === "full" || c.sun === "part")
    );
    notes.push("Widened beyond your effort setting to fill the plan — easiest crops listed first.");
  }

  pool.sort((a, b) => a.difficulty - b.difficulty || b.yieldLbsPer100Sqft - a.yieldLbsPer100Sqft);
  const picked = pool.slice(0, 6);
  const share = Math.round(input.areaSqft / Math.max(1, picked.length));

  const nowDoy = dayOfYear(today);
  const crops: PlannedCrop[] = picked.map((c) => {
    const mid = (c.yieldLbsPer100Sqft * share) / 100;
    let window = c.windowNote ?? "";
    let plantNow = false;

    if (!c.windowNote) {
      const start = c.season === "cool" ? addDays(spring, -42) : spring;
      const end = addDays(fall, -(c.maturityDays + (c.season === "cool" ? 14 : 7)));
      if (end.getTime() > start.getTime()) {
        window = `${fmt(start)} – ${fmt(end)}`;
        const s = dayOfYear(start);
        const e = dayOfYear(end);
        plantNow = s <= e ? nowDoy >= s && nowDoy <= e : nowDoy >= s || nowDoy <= e;
      } else {
        window = "Season too short — start indoors";
      }
    } else if (c.id === "garlic") {
      // Northern fall planting; southern hemisphere flips by ~6 months.
      const m = today.getMonth();
      plantNow = input.southern ? m >= 2 && m <= 4 : m >= 8 && m <= 10;
    }

    return {
      id: c.id,
      name: c.name,
      season: c.season,
      shareSqft: share,
      yieldLow: Math.round(mid * 0.7),
      yieldHigh: Math.round(mid * 1.3),
      hoursPerWeek: Math.round(((c.hoursPerWeekPer100Sqft * share) / 100) * 10) / 10,
      water: c.water,
      note: c.note,
      window,
      plantNow,
      difficulty: c.difficulty,
    };
  });

  return {
    crops,
    totalYieldLow: crops.reduce((s, c) => s + c.yieldLow, 0),
    totalYieldHigh: crops.reduce((s, c) => s + c.yieldHigh, 0),
    totalHoursPerWeek: Math.round(crops.reduce((s, c) => s + c.hoursPerWeek, 0) * 10) / 10,
    frostLabel: `Last spring frost ~${fmt(spring)}, first fall frost ~${fmt(fall)}`,
    notes,
  };
}
