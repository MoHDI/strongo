// Dispatcher eval: 20 test orders against a LIVE server.
// Run: npm run dev (in another shell), then: npm run eval
// Override target: EVAL_BASE_URL=http://localhost:3001 npm run eval
// Writes results to eval/results.md. Measures budget adherence, real-menu
// matches, and server-reported latency. Exit 0 on success, 1 if the server
// is unreachable.

import { mkdir, writeFile } from "fs/promises";
import path from "path";

const BASE = process.env.EVAL_BASE_URL ?? "http://localhost:3000";

interface MenuItem {
  name: string;
  price: number;
}

interface Restaurant {
  id: string;
  menu: MenuItem[];
}

interface Suggestion {
  reply: string;
  source: "ai" | "local";
  restaurantId: string | null;
  items: Array<{ name: string; qty: number }>;
  model: string | null;
  latencyMs: number;
}

interface Case {
  prompt: string;
  budget: number | null;
}

const CASES: Case[] = [
  { prompt: "Feed my family of 4 for under $40", budget: 40 },
  { prompt: "Cheap tacos under $15", budget: 15 },
  { prompt: "Italian dinner for two under $30", budget: 30 },
  { prompt: "Chinese food under $25", budget: 25 },
  { prompt: "Lunch under $12", budget: 12 },
  { prompt: "Pizza night, keep it under $20", budget: 20 },
  { prompt: "Something light under $10", budget: 10 },
  { prompt: "Feed 6 people under $60", budget: 60 },
  { prompt: "Cafe lunch under $18", budget: 18 },
  { prompt: "Dumplings under $15", budget: 15 },
  { prompt: "Big family dinner, $100 budget", budget: 100 },
  { prompt: "Just a cold brew and a snack", budget: null },
  { prompt: "Vegetarian dinner under $25", budget: 25 },
  { prompt: "Vegan options under $20", budget: 20 },
  { prompt: "Gluten-free lunch under $18", budget: 18 },
  { prompt: "Healthy salad under $15", budget: 15 },
  { prompt: "Comida para 4 personas por menos de $40", budget: 40 },
  { prompt: "Quiero tacos mexicanos baratos", budget: null },
  { prompt: "Đồ ăn cho 4 người dưới $40", budget: 40 },
  { prompt: "Món Ý dưới $30", budget: 30 },
];

interface Row {
  n: number;
  prompt: string;
  source: string;
  budgetOk: boolean | null;
  menuOk: boolean;
  ms: number;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

async function main(): Promise<void> {
  const health = await fetch(`${BASE}/api/health`).catch(() => null);
  if (!health || !health.ok) {
    console.error(`Server unreachable at ${BASE} — start it with: npm run dev`);
    process.exit(1);
  }

  const menusRes = await fetch(`${BASE}/api/orders`);
  const menusData = (await menusRes.json()) as { restaurants: Restaurant[] };
  const priceOf = new Map<string, Map<string, number>>();
  for (const r of menusData.restaurants) {
    priceOf.set(r.id, new Map(r.menu.map((m) => [m.name, m.price])));
  }

  const rows: Row[] = [];
  for (const [i, c] of CASES.entries()) {
    const res = await fetch(`${BASE}/api/dispatch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: c.prompt }),
    });
    const s = (await res.json()) as Suggestion;
    const menu = c && s.restaurantId ? priceOf.get(s.restaurantId) : undefined;
    const menuOk =
      !!menu && s.items.length > 0 && s.items.every((it) => menu.has(it.name));
    let budgetOk: boolean | null = null;
    if (c.budget !== null) {
      const total = s.items.reduce(
        (sum, it) => sum + (menu?.get(it.name) ?? 0) * it.qty,
        0
      );
      budgetOk = total <= c.budget;
    }
    rows.push({
      n: i + 1,
      prompt: c.prompt,
      source: s.source,
      budgetOk,
      menuOk,
      ms: typeof s.latencyMs === "number" ? s.latencyMs : -1,
    });
    console.log(
      `${i + 1}/${CASES.length} ${s.source} budget=${budgetOk ?? "-"} menu=${menuOk} ${s.latencyMs}ms`
    );
  }

  const budgeted = rows.filter((r) => r.budgetOk !== null);
  const budgetPass = budgeted.filter((r) => r.budgetOk).length;
  const menuPass = rows.filter((r) => r.menuOk).length;
  const fullPass = rows.filter(
    (r) => r.menuOk && (r.budgetOk === null || r.budgetOk)
  ).length;
  const aiCount = rows.filter((r) => r.source === "ai").length;
  const med = median(rows.map((r) => r.ms));

  const lines = [
    "# Dispatcher eval results",
    "",
    `Run: ${new Date().toISOString()} against ${BASE} (${aiCount}/${rows.length} via AI).`,
    "",
    `- Full pass (menu match + budget): ${fullPass}/${rows.length} (${Math.round((fullPass / rows.length) * 100)}%)`,
    `- Budget adherence: ${budgetPass}/${budgeted.length}`,
    `- Real menu matches: ${menuPass}/${rows.length}`,
    `- Median server latency: ${med}ms`,
    "",
    "| # | Prompt | Source | Budget | Menu | ms |",
    "|---|--------|--------|--------|------|----|",
    ...rows.map(
      (r) =>
        `| ${r.n} | ${r.prompt} | ${r.source} | ${r.budgetOk === null ? "-" : r.budgetOk ? "pass" : "FAIL"} | ${r.menuOk ? "pass" : "FAIL"} | ${r.ms} |`
    ),
    "",
  ];

  const dir = path.join(process.cwd(), "eval");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "results.md"), lines.join("\n"));
  console.log(`Wrote eval/results.md — ${fullPass}/${rows.length} full pass, median ${med}ms`);
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
