// Wild-idea simulators with honest math. All rules of thumb are cited in
// the UI as estimates; formulas are shown so anyone can check them.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmt(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function parseDay(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y || 2026, (m || 1) - 1, d || 1);
}

// --- Community livestock rotation ---
// Rules of thumb: a 120-lb goat eats ~4 lbs of dry matter per day; decent
// pasture holds ~1200 lbs DM per acre per grazing cycle; take half, leave
// half; rest paddocks ~28 days.

export interface LivestockInput {
  goats: number;
  dairyGoats: number;
  paddocks: number;
  acresPerPaddock: number;
  restDays: number;
  startDate: string; // YYYY-MM-DD
}

export interface GrazingBlock {
  paddock: number;
  start: string;
  end: string;
}

export interface LivestockResult {
  grazeDaysEach: number;
  cycleDays: number;
  schedule: GrazingBlock[];
  manureLbs: number;
  gardenSqftFed: number;
  milkLbs: number;
  overstocked: boolean;
  forageNeedLbs: number;
  forageHaveLbs: number;
}

export function simulateLivestock(input: LivestockInput): LivestockResult {
  const paddocks = Math.max(2, Math.floor(input.paddocks));
  const goats = Math.max(1, Math.floor(input.goats));
  const dairy = Math.max(0, Math.min(goats, Math.floor(input.dairyGoats)));
  const restDays = Math.max(7, Math.min(60, Math.floor(input.restDays)));
  const acres = Math.max(0.1, input.acresPerPaddock);

  const grazeDaysEach = Math.max(1, Math.round(restDays / (paddocks - 1)));
  const cycleDays = grazeDaysEach * paddocks;

  const schedule: GrazingBlock[] = [];
  const cursor = parseDay(input.startDate);
  for (let p = 1; p <= paddocks; p++) {
    const start = new Date(cursor);
    const end = new Date(cursor);
    end.setDate(end.getDate() + grazeDaysEach - 1);
    schedule.push({ paddock: p, start: fmt(start), end: fmt(end) });
    cursor.setDate(cursor.getDate() + grazeDaysEach);
  }

  const forageNeedLbs = goats * 4 * grazeDaysEach;
  const forageHaveLbs = acres * 1200 * 0.5; // take half, leave half
  const manureLbs = Math.round(goats * 4.5 * cycleDays);
  const milkLbs = Math.round(dairy * 6 * cycleDays);

  return {
    grazeDaysEach,
    cycleDays,
    schedule,
    manureLbs,
    gardenSqftFed: Math.round(manureLbs / 2), // ~2 lbs composted manure per sq ft
    milkLbs,
    overstocked: forageNeedLbs > forageHaveLbs,
    forageNeedLbs: Math.round(forageNeedLbs),
    forageHaveLbs: Math.round(forageHaveLbs),
  };
}

// --- Dog-park corridor ---
// Join fenced backyards into one shared run. Rule of thumb: ~500 sq ft of
// run space per medium dog for comfortable shared play.

export interface CorridorInput {
  yards: number;
  lotWidthFt: number;
  runWidthFt: number;
}

export interface CorridorResult {
  lengthFt: number;
  areaSqft: number;
  dogs: number;
  gates: number;
  costLow: number;
  costHigh: number;
}

export function simulateCorridor(input: CorridorInput): CorridorResult {
  const yards = Math.max(2, Math.floor(input.yards));
  const lotWidth = Math.max(20, input.lotWidthFt);
  const runWidth = Math.max(8, input.runWidthFt);

  const lengthFt = Math.round(yards * lotWidth);
  const areaSqft = Math.round(lengthFt * runWidth);
  const gates = yards + 1; // one per shared fence plus two ends... minus shared math: n+1
  const endFenceFt = runWidth * 2;
  const costLow = Math.round(gates * 120 + endFenceFt * 8);
  const costHigh = Math.round(gates * 200 + endFenceFt * 14);

  return {
    lengthFt,
    areaSqft,
    dogs: Math.max(1, Math.floor(areaSqft / 500)),
    gates,
    costLow,
    costHigh,
  };
}
