// Garden plotter: square-foot planning over the lib/garden.ts crop data.
// Pure helpers + constants; the page owns all interaction state.

import { CROPS, type Crop } from "./garden";

export type SunLevel = "full" | "part" | "shade";

export interface PlotCellState {
  cropId: string | null;
  sun: SunLevel;
}

/** Plants per square foot (square-foot gardening spacing). */
export const PLANTS_PER_SQFT: Record<string, number> = {
  lettuce: 4,
  spinach: 9,
  kale: 1,
  peas: 8,
  carrots: 16,
  broccoli: 1,
  onions: 9,
  potatoes: 1,
  garlic: 4,
  tomatoes: 1,
  zucchini: 1,
  beans: 9,
  cucumbers: 2,
  peppers: 1,
  basil: 4,
  eggplant: 1,
  "sweet-potatoes": 1,
  strawberries: 4,
};

export const CROP_COLORS: Record<string, string> = {
  lettuce: "#43a047",
  spinach: "#00897b",
  kale: "#1b5e20",
  peas: "#7cb342",
  carrots: "#ef6c00",
  broccoli: "#558b2f",
  onions: "#a1887f",
  potatoes: "#8d6e63",
  garlic: "#b8a94e",
  tomatoes: "#d32f2f",
  zucchini: "#33691e",
  beans: "#9ccc65",
  cucumbers: "#26a69a",
  peppers: "#e53935",
  basil: "#66bb6a",
  eggplant: "#6d4c7d",
  "sweet-potatoes": "#c97b2f",
  strawberries: "#e5486f",
};

export const CROP_CODES: Record<string, string> = {
  lettuce: "Lt",
  spinach: "Sp",
  kale: "Ka",
  peas: "Pe",
  carrots: "Ca",
  broccoli: "Br",
  onions: "On",
  potatoes: "Po",
  garlic: "Ga",
  tomatoes: "To",
  zucchini: "Zu",
  beans: "Be",
  cucumbers: "Cu",
  peppers: "Pp",
  basil: "Ba",
  eggplant: "Eg",
  "sweet-potatoes": "Sw",
  strawberries: "St",
};

export function cropById(id: string): Crop | null {
  return CROPS.find((c) => c.id === id) ?? null;
}

export function sunFits(crop: Crop, sun: SunLevel): "good" | "ok" | "bad" {
  if (crop.sun === "part") return sun === "shade" ? "ok" : "good";
  return sun === "full" ? "good" : sun === "part" ? "ok" : "bad";
}

export interface Totals {
  cells: number;
  planted: number;
  yieldLow: number;
  yieldHigh: number;
  hoursPerWeek: number;
  sunScore: number; // 0..100 across planted cells (good=1, ok=0.5, bad=0)
  badCount: number;
}

export function plotTotals(cells: PlotCellState[]): Totals {
  let yieldMid = 0;
  let hours = 0;
  let sunPoints = 0;
  let planted = 0;
  let badCount = 0;
  for (const cell of cells) {
    if (!cell.cropId) continue;
    const crop = cropById(cell.cropId);
    if (!crop) continue;
    planted++;
    yieldMid += crop.yieldLbsPer100Sqft / 100;
    hours += crop.hoursPerWeekPer100Sqft / 100;
    const fit = sunFits(crop, cell.sun);
    sunPoints += fit === "good" ? 1 : fit === "ok" ? 0.5 : 0;
    if (fit === "bad") badCount++;
  }
  return {
    cells: cells.length,
    planted,
    yieldLow: Math.round(yieldMid * 0.7 * 10) / 10,
    yieldHigh: Math.round(yieldMid * 1.3 * 10) / 10,
    hoursPerWeek: Math.round(hours * 10) / 10,
    sunScore: planted > 0 ? Math.round((sunPoints / planted) * 100) : 100,
    badCount,
  };
}

export interface Recommendation {
  crop: Crop;
  fitCells: number;
  totalCells: number;
  perSqftYield: number;
  reason: string;
}

/** Rank crops by plantable cells × yield, tempered by difficulty. */
export function recommend(cells: PlotCellState[], limit = 6): Recommendation[] {
  const total = Math.max(1, cells.length);
  return CROPS.map((crop) => {
    const fitCells = cells.filter((c) => sunFits(crop, c.sun) !== "bad").length;
    const perSqftYield = crop.yieldLbsPer100Sqft / 100;
    const score = (fitCells * perSqftYield) / crop.difficulty;
    return {
      crop,
      fitCells,
      totalCells: total,
      perSqftYield: Math.round(perSqftYield * 10) / 10,
      reason: `${fitCells}/${total} cells get enough sun · ~${(Math.round(perSqftYield * 10) / 10).toFixed(1)} lbs/sq ft`,
      score,
    };
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ crop, fitCells, totalCells, perSqftYield, reason }) => ({
      crop,
      fitCells,
      totalCells,
      perSqftYield,
      reason,
    }));
}

export type SunPattern = "full" | "fence" | "tree-west" | "house-east";

/** Row 0 is the north (back) edge; col 0 is the west edge. */
export function sunPreset(pattern: SunPattern, w: number, h: number): SunLevel[][] {
  const grid: SunLevel[][] = [];
  for (let r = 0; r < h; r++) {
    const row: SunLevel[] = [];
    for (let c = 0; c < w; c++) {
      let sun: SunLevel = "full";
      if (pattern === "fence" && r === 0) sun = "shade";
      else if (pattern === "fence" && r === 1) sun = "part";
      else if (pattern === "tree-west" && c === 0) sun = "shade";
      else if (pattern === "tree-west" && c === 1) sun = "part";
      else if (pattern === "house-east" && c === w - 1) sun = "part";
      row.push(sun);
    }
    grid.push(row);
  }
  return grid;
}
