"use client";

import Link from "next/link";
import { useState } from "react";

interface PlannedCrop {
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

interface PlanResult {
  plan: {
    crops: PlannedCrop[];
    totalYieldLow: number;
    totalYieldHigh: number;
    totalHoursPerWeek: number;
    frostLabel: string;
    notes: string[];
  };
  zone: number;
  zoneMethod: "manual" | "estimated";
  location: { label: string; lat: number; lng: number } | null;
  attribution: string;
}

function toolsFor(area: number, crops: PlannedCrop[]): string[] {
  const tools = [
    "Hand trowel + hand fork",
    "Hoe",
    "Garden rake",
    "Round shovel",
    "Watering can or hose",
  ];
  const ids = new Set(crops.map((c) => c.id));
  if (area >= 200) tools.push("Wheelbarrow");
  if (crops.some((c) => c.water === "high")) tools.push("Drip hose or soaker kit");
  if (ids.has("peas") || ids.has("cucumbers") || ids.has("beans")) {
    tools.push("Trellis or stakes + twine");
  }
  return tools;
}

export default function GardenPage() {
  const [address, setAddress] = useState("");
  const [zoneSel, setZoneSel] = useState("auto");
  const [area, setArea] = useState("200");
  const [sun, setSun] = useState<"full" | "part">("full");
  const [effort, setEffort] = useState<"low" | "medium" | "high">("medium");
  const [result, setResult] = useState<PlanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coachQ, setCoachQ] = useState("");
  const [coachReply, setCoachReply] = useState<string | null>(null);
  const [coachSource, setCoachSource] = useState<"ai" | "local" | null>(null);
  const [coaching, setCoaching] = useState(false);

  async function makePlan() {
    const areaNum = Number(area);
    if (!Number.isFinite(areaNum) || areaNum < 25 || areaNum > 10000) {
      setError("Yard area must be 25–10000 sq ft (a 10×20 ft plot is 200).");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/garden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: address.trim() || undefined,
          zone: zoneSel === "auto" ? undefined : Number(zoneSel),
          areaSqft: areaNum,
          sun,
          effort,
        }),
      });
      const data = (await res.json()) as PlanResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Planning failed.");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Planning failed.");
    } finally {
      setLoading(false);
    }
  }

  async function askCoach() {
    if (!coachQ.trim() || !result) return;
    setCoaching(true);
    try {
      const context = `Zone ${result.zone}, ${area} sq ft, ${sun} sun. Crops: ${result.plan.crops.map((c) => c.name).join(", ")}.`;
      const res = await fetch("/api/garden-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: coachQ, context }),
      });
      const data = (await res.json()) as { reply: string; source: "ai" | "local" };
      setCoachReply(data.reply);
      setCoachSource(data.source);
    } catch {
      setCoachReply("Coach unreachable — try again in a moment.");
      setCoachSource("local");
    } finally {
      setCoaching(false);
    }
  }

  return (
    <>
      <header className="site-header">
        <div className="wrap">
          <Link href="/" className="wordmark">
            Strongo
          </Link>
          <nav className="site-nav">
            <Link href="/delivery">Order</Link>
            <Link href="/menu-scan">Menu scan</Link>
            <Link href="/dispatch">Dispatch</Link>
            <Link href="/transparency">Transparency</Link>
            <Link href="/fridge">Fridge</Link>
            <Link href="/labs">Labs</Link>
          </nav>
        </div>
      </header>

      <main className="wrap">
        <div className="prose">
          <h1>Convert your yard to a garden</h1>
          <p>
            Enter your address and yard size. Strongo estimates your growing
            zone, picks crops that fit your sun and effort, and plans the
            time, yield, and tools — all figures are planning estimates, not
            promises.
          </p>
        </div>

        <div className="field">
          <label htmlFor="address">Street address</label>
          <input
            id="address"
            className="input"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Maple St, Austin, TX"
          />
        </div>

        <div className="field">
          <label htmlFor="zone">Growing zone (if you know it, skip the address lookup)</label>
          <select
            id="zone"
            className="input"
            style={{ maxWidth: "16rem" }}
            value={zoneSel}
            onChange={(e) => setZoneSel(e.target.value)}
          >
            <option value="auto">Auto from address</option>
            {[3, 4, 5, 6, 7, 8, 9, 10, 11].map((z) => (
              <option key={z} value={z}>
                Zone {z}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="area">Yard area for garden (sq ft)</label>
          <input
            id="area"
            className="input"
            style={{ maxWidth: "10rem" }}
            inputMode="numeric"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="200"
          />
        </div>

        <div className="field">
          <label>Sun</label>
          <div className="rest-pick">
            <button aria-pressed={sun === "full"} onClick={() => setSun("full")}>
              Full sun (6+ hrs)
            </button>
            <button aria-pressed={sun === "part"} onClick={() => setSun("part")}>
              Partial shade
            </button>
          </div>
        </div>

        <div className="field">
          <label>Effort</label>
          <div className="rest-pick">
            <button aria-pressed={effort === "low"} onClick={() => setEffort("low")}>
              Low — simplest crops
            </button>
            <button aria-pressed={effort === "medium"} onClick={() => setEffort("medium")}>
              Medium
            </button>
            <button aria-pressed={effort === "high"} onClick={() => setEffort("high")}>
              High — anything goes
            </button>
          </div>
        </div>

        <div className="btn-row">
          <button className="btn" onClick={makePlan} disabled={loading}>
            {loading ? "Planning…" : "Make my garden plan"}
          </button>
        </div>

        {error && (
          <div className="notice">
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        )}

        {result && (
          <div>
            <h2>Your plan</h2>
            <p>
              {result.location
                ? `Growing near ${result.location.label.split(",").slice(0, 2).join(",")}. `
                : ""}
              Zone {result.zone} ({result.zoneMethod === "estimated" ? "estimated — confirm below" : "as entered"}).{" "}
              {result.plan.frostLabel}.
            </p>

            {result.plan.notes.map((n, i) => (
              <div className="notice" key={i}>
                <p style={{ margin: 0 }}>{n}</p>
              </div>
            ))}

            {result.plan.crops.map((c) => (
              <div className="order-card" key={c.id}>
                <p style={{ marginTop: 0 }}>
                  <strong>{c.name}</strong>{" "}
                  {c.plantNow && <span className="badge badge-ai">plant now</span>}{" "}
                  <span className="status-pill">
                    {c.season} season · {c.shareSqft} sq ft
                  </span>
                </p>
                <p>
                  {c.note} Window: {c.window}.
                </p>
                <p style={{ marginBottom: 0 }}>
                  Est. yield {c.yieldLow}–{c.yieldHigh} lbs · ~{c.hoursPerWeek}{" "}
                  hrs/week · water: {c.water}
                </p>
              </div>
            ))}

            <div className="notice">
              <p style={{ margin: 0 }}>
                <strong>
                  Season totals: ~{result.plan.totalYieldLow}–{result.plan.totalYieldHigh} lbs
                  of food for ~{result.plan.totalHoursPerWeek} hrs/week.
                </strong>{" "}
                Yields assume decent soil and water; first-year gardens often
                come in lower.
              </p>
            </div>

            <h2>Tools you&apos;ll need</h2>
            <div className="order-card">
              <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                {toolsFor(Number(area), result.plan.crops).map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <p style={{ marginBottom: 0 }}>
                Don&apos;t buy all this — borrow it from the Strongo{" "}
                <Link href="/research/roadmap">tool library</Link> (Phase 2).
              </p>
            </div>

            <h2>Keep learning</h2>
            <div className="doc-links">
              <a href="https://planthardiness.ars.usda.gov/">
                <strong>Confirm your zone — USDA map</strong>
                <span>The official hardiness zone map; our zone is an estimate.</span>
              </a>
              <a href="https://nifa.usda.gov/land-grant-colleges-and-universities-partner-website-directory">
                <strong>Find your extension office</strong>
                <span>Free county-level growing advice from land-grant universities.</span>
              </a>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>{result.attribution}</p>

            <h2>Ask the garden coach</h2>
            <div className="field">
              <input
                className="input"
                value={coachQ}
                onChange={(e) => setCoachQ(e.target.value)}
                placeholder="How do I keep squirrels off my tomatoes?"
              />
              <div className="btn-row">
                <button className="btn" onClick={askCoach} disabled={coaching}>
                  {coaching ? "Thinking…" : "Ask"}
                </button>
                {coachSource && (
                  <span className={coachSource === "ai" ? "badge badge-ai" : "badge badge-local"}>
                    {coachSource === "ai" ? "Muse Spark" : "Local tips"}
                  </span>
                )}
              </div>
            </div>
            {coachReply && (
              <div className="notice">
                <p style={{ margin: 0 }}>{coachReply}</p>
              </div>
            )}
          </div>
        )}

        <p style={{ paddingBottom: "3rem" }}>
          <Link href="/">← Back to Strongo home</Link>
        </p>
      </main>
    </>
  );
}
