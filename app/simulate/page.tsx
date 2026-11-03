"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { simulateCorridor, simulateLivestock } from "@/lib/simulate";

function todayPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function SimulatePage() {
  const [goats, setGoats] = useState("8");
  const [dairy, setDairy] = useState("2");
  const [paddocks, setPaddocks] = useState("5");
  const [acres, setAcres] = useState("0.5");
  const [rest, setRest] = useState("28");
  const [start, setStart] = useState(() => todayPlus(7));

  const [yards, setYards] = useState("6");
  const [lotWidth, setLotWidth] = useState("50");
  const [runWidth, setRunWidth] = useState("20");

  const livestock = useMemo(
    () =>
      simulateLivestock({
        goats: Number(goats) || 0,
        dairyGoats: Number(dairy) || 0,
        paddocks: Number(paddocks) || 0,
        acresPerPaddock: Number(acres) || 0,
        restDays: Number(rest) || 0,
        startDate: start,
      }),
    [goats, dairy, paddocks, acres, rest, start]
  );

  const corridor = useMemo(
    () =>
      simulateCorridor({
        yards: Number(yards) || 0,
        lotWidthFt: Number(lotWidth) || 0,
        runWidthFt: Number(runWidth) || 0,
      }),
    [yards, lotWidth, runWidth]
  );

  const yardRects = Math.min(12, Math.max(2, Math.floor(Number(yards) || 2)));

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
            <Link href="/labs">Labs</Link>
          </nav>
        </div>
      </header>

      <main className="wrap">
        <div className="prose">
          <h1>What could a neighborhood do?</h1>
          <p>
            Two wild ideas, with the math shown. Estimates from standard rules
            of thumb — check them against your own streets before ordering
            goats.
          </p>
        </div>

        <h2>Rotating community livestock</h2>
        <p>
          Close one street segment at a time while the herd grazes it, then
          rotate — verges get cleared, gardens get manure, kids get goats.
        </p>

        <div className="field">
          <label htmlFor="goats">Goats in the herd</label>
          <input id="goats" className="input" style={{ maxWidth: "8rem" }} inputMode="numeric" value={goats} onChange={(e) => setGoats(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="dairy">Dairy goats (of the herd)</label>
          <input id="dairy" className="input" style={{ maxWidth: "8rem" }} inputMode="numeric" value={dairy} onChange={(e) => setDairy(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="paddocks">Street segments in rotation</label>
          <input id="paddocks" className="input" style={{ maxWidth: "8rem" }} inputMode="numeric" value={paddocks} onChange={(e) => setPaddocks(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="acres">Grazeable acres per segment</label>
          <input id="acres" className="input" style={{ maxWidth: "8rem" }} inputMode="decimal" value={acres} onChange={(e) => setAcres(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="rest">Rest days per segment</label>
          <input id="rest" className="input" style={{ maxWidth: "8rem" }} inputMode="numeric" value={rest} onChange={(e) => setRest(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="start">Rotation starts</label>
          <input id="start" className="input" style={{ maxWidth: "12rem" }} type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>

        <table className="money-table">
          <tbody>
            <tr>
              <td>Graze days per segment</td>
              <td>{livestock.grazeDaysEach}</td>
            </tr>
            <tr>
              <td>Full rotation</td>
              <td>{livestock.cycleDays} days</td>
            </tr>
            <tr>
              <td>Manure per rotation</td>
              <td>~{livestock.manureLbs.toLocaleString()} lbs</td>
            </tr>
            <tr>
              <td>Garden fed by that manure</td>
              <td>~{livestock.gardenSqftFed.toLocaleString()} sq ft</td>
            </tr>
            <tr>
              <td>Milk per rotation</td>
              <td>~{livestock.milkLbs.toLocaleString()} lbs</td>
            </tr>
            <tr className="total">
              <td>Forage check</td>
              <td>
                {livestock.overstocked
                  ? `OVERSTOCKED — needs ${livestock.forageNeedLbs.toLocaleString()} lbs, has ${livestock.forageHaveLbs.toLocaleString()}`
                  : `OK — needs ${livestock.forageNeedLbs.toLocaleString()} lbs, has ${livestock.forageHaveLbs.toLocaleString()}`}
              </td>
            </tr>
          </tbody>
        </table>

        {livestock.overstocked && (
          <div className="notice">
            <p style={{ margin: 0 }}>
              Too many goats for this land. Fewer goats, more acres, or more
              segments before this rotation is real.
            </p>
          </div>
        )}

        <h3>Closure schedule</h3>
        {livestock.schedule.map((b) => (
          <div className="order-card" key={b.paddock}>
            <p style={{ margin: 0 }}>
              <strong>Segment {b.paddock}</strong> closed {b.start} – {b.end} (
              {livestock.grazeDaysEach} days)
            </p>
          </div>
        ))}
        <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
          Math: 4 lbs dry matter per goat per day; ~1200 lbs per acre per
          cycle, take half; 4.5 lbs manure per goat per day; ~6 lbs milk per
          dairy goat per day.
        </p>

        <h2>Backyard dog-park corridor</h2>
        <p>
          Neighbors open gates between fenced backyards to form one shared
          run. Everyone keeps their yard; dogs get a park.
        </p>

        <div className="field">
          <label htmlFor="yards">Backyards joining</label>
          <input id="yards" className="input" style={{ maxWidth: "8rem" }} inputMode="numeric" value={yards} onChange={(e) => setYards(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="lotwidth">Average lot width (ft)</label>
          <input id="lotwidth" className="input" style={{ maxWidth: "8rem" }} inputMode="numeric" value={lotWidth} onChange={(e) => setLotWidth(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="runwidth">Shared run width (ft)</label>
          <input id="runwidth" className="input" style={{ maxWidth: "8rem" }} inputMode="numeric" value={runWidth} onChange={(e) => setRunWidth(e.target.value)} />
        </div>

        <svg
          viewBox={`0 0 ${yardRects * 50} 110`}
          style={{ maxWidth: "36rem", width: "100%", border: "1px solid var(--line)", borderRadius: "8px" }}
          role="img"
          aria-label="Schematic of joined backyards forming a corridor"
        >
          {Array.from({ length: yardRects }, (_, i) => (
            <g key={i}>
              <rect x={i * 50 + 2} y={5} width={46} height={60} fill="#f1ece1" stroke="#ddd6c6" />
              <rect x={i * 50 + 2} y={70} width={46} height={30} fill="#1e4d3a" opacity={0.75} />
              {i > 0 && <rect x={i * 50 - 2} y={70} width={4} height={30} fill="#b0502a" />}
            </g>
          ))}
        </svg>
        <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
          Green band: shared run. Clay ticks: gates between yards
          {Number(yards) > 12 ? ` (first 12 of ${yards} shown)` : ""}.
        </p>

        <table className="money-table">
          <tbody>
            <tr>
              <td>Corridor length</td>
              <td>{corridor.lengthFt.toLocaleString()} ft</td>
            </tr>
            <tr>
              <td>Run area</td>
              <td>{corridor.areaSqft.toLocaleString()} sq ft</td>
            </tr>
            <tr>
              <td>Dogs accommodated</td>
              <td>~{corridor.dogs}</td>
            </tr>
            <tr>
              <td>Gates needed</td>
              <td>{corridor.gates}</td>
            </tr>
            <tr className="total">
              <td>Build cost</td>
              <td>
                ${corridor.costLow.toLocaleString()}–${corridor.costHigh.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
        <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
          Math: ~500 sq ft per dog; one gate per shared fence plus ends;
          $120–200 per gate, $8–14 per foot of end fencing.
        </p>

        <p style={{ paddingBottom: "3rem" }}>
          <Link href="/">← Back to Strongo home</Link>
        </p>
      </main>
    </>
  );
}
