"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CROPS } from "@/lib/garden";
import {
  CROP_CODES,
  CROP_COLORS,
  PLANTS_PER_SQFT,
  cropById,
  plotTotals,
  recommend,
  sunFits,
  sunPreset,
  type PlotCellState,
  type SunLevel,
  type SunPattern,
} from "@/lib/plotter";

const STORAGE_KEY = "strongo-plot-v1";

type Tool = "plant" | "sun" | "erase";

const SUN_TINT: Record<SunLevel, string> = {
  full: "#fdf6e0",
  part: "#f1ece1",
  shade: "#e4e9ee",
};

function blankGrid(w: number, h: number, sun: SunLevel[][]): PlotCellState[][] {
  return sun.map((row) => row.map((s) => ({ cropId: null as string | null, sun: s })));
}

function resizeGrid(
  prev: PlotCellState[][],
  w: number,
  h: number,
  sun: SunLevel[][]
): PlotCellState[][] {
  return sun.map((row, r) =>
    row.map((s, c) => prev[r]?.[c] ?? { cropId: null as string | null, sun: s })
  );
}

export default function PlotterPage() {
  const [w, setW] = useState(8);
  const [h, setH] = useState(4);
  const [cells, setCells] = useState<PlotCellState[][]>(() =>
    blankGrid(8, 4, sunPreset("full", 8, 4))
  );
  const [tool, setTool] = useState<Tool>("plant");
  const [selected, setSelected] = useState("tomatoes");
  const [paintSun, setPaintSun] = useState<SunLevel>("shade");
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load saved plot once (client only — SSR renders defaults).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as {
          w: number;
          h: number;
          cells: PlotCellState[][];
        };
        if (
          saved &&
          Number.isFinite(saved.w) &&
          Number.isFinite(saved.h) &&
          Array.isArray(saved.cells)
        ) {
          const nw = Math.min(20, Math.max(2, Math.floor(saved.w)));
          const nh = Math.min(20, Math.max(2, Math.floor(saved.h)));
          setW(nw);
          setH(nh);
          setCells(saved.cells.slice(0, nh).map((row) => row.slice(0, nw)));
        }
      }
    } catch {
      // Corrupt save — keep defaults.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ w, h, cells }));
    } catch {
      // Storage full or blocked — plot still works for the session.
    }
  }, [w, h, cells, loaded]);

  const flat = useMemo(() => cells.flat(), [cells]);
  const totals = useMemo(() => plotTotals(flat), [flat]);
  const recs = useMemo(() => recommend(flat), [flat]);

  function applySize(nw: number, nh: number) {
    const cw = Math.min(20, Math.max(2, Math.floor(nw) || 2));
    const ch = Math.min(20, Math.max(2, Math.floor(nh) || 2));
    setW(cw);
    setH(ch);
    setCells((prev) => {
      const sun = prev.map((row) => row.map((c) => c.sun));
      while (sun.length < ch) sun.push(new Array(cw).fill("full") as SunLevel[]);
      return sun.slice(0, ch).map((row, r) => {
        while (row.length < cw) row.push("full");
        return row.slice(0, cw).map((s, c) => prev[r]?.[c] ?? { cropId: null, sun: s });
      });
    });
  }

  function applyPattern(pattern: SunPattern) {
    const sun = sunPreset(pattern, w, h);
    setCells((prev) => resizeGrid(prev, w, h, sun).map((row, r) =>
      row.map((cell, c) => ({ ...cell, sun: sun[r][c] }))
    ));
  }

  function plantAt(r: number, c: number, cropId: string | null) {
    setCells((prev) =>
      prev.map((row, ri) =>
        row.map((cell, ci) => (ri === r && ci === c ? { ...cell, cropId } : cell))
      )
    );
  }

  function paintSunAt(r: number, c: number) {
    setCells((prev) =>
      prev.map((row, ri) =>
        row.map((cell, ci) => (ri === r && ci === c ? { ...cell, sun: paintSun } : cell))
      )
    );
  }

  function clickCell(r: number, c: number) {
    if (tool === "sun") paintSunAt(r, c);
    else if (tool === "erase") plantAt(r, c, null);
    else plantAt(r, c, selected);
  }

  const selectedCrop = cropById(selected);

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
          <h1>Garden plotter</h1>
          <p>
            Sketch your bed, paint the sun, then drag crops onto squares.
            Each square is one square foot. Totals update live — and anything
            planted in too little sun waves a red flag.
          </p>
        </div>

        <div className="field">
          <label>
            Bed size (ft) — {w} × {h} = {w * h} sq ft
          </label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              className="input"
              style={{ maxWidth: "7rem" }}
              type="number"
              min={2}
              max={20}
              value={w}
              aria-label="Bed width in feet"
              onChange={(e) => applySize(Number(e.target.value), h)}
            />
            <input
              className="input"
              style={{ maxWidth: "7rem" }}
              type="number"
              min={2}
              max={20}
              value={h}
              aria-label="Bed depth in feet"
              onChange={(e) => applySize(w, Number(e.target.value))}
            />
          </div>
        </div>

        <div className="field">
          <label>Sun pattern</label>
          <div className="rest-pick">
            <button onClick={() => applyPattern("full")}>Full sun</button>
            <button onClick={() => applyPattern("fence")}>North fence</button>
            <button onClick={() => applyPattern("tree-west")}>Tree, west side</button>
            <button onClick={() => applyPattern("house-east")}>House, east side</button>
          </div>
        </div>

        <div className="field">
          <label>Tool</label>
          <div className="rest-pick">
            <button aria-pressed={tool === "plant"} onClick={() => setTool("plant")}>
              Plant
            </button>
            <button aria-pressed={tool === "sun"} onClick={() => setTool("sun")}>
              Paint sun
            </button>
            <button aria-pressed={tool === "erase"} onClick={() => setTool("erase")}>
              Erase
            </button>
            {tool === "sun" && (
              <>
                {(["full", "part", "shade"] as SunLevel[]).map((s) => (
                  <button
                    key={s}
                    aria-pressed={paintSun === s}
                    onClick={() => setPaintSun(s)}
                  >
                    {s}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        <div className="field">
          <label>
            Crops — drag onto the bed, or click one then click squares
            {selectedCrop && ` (selected: ${selectedCrop.name})`}
          </label>
          <div className="rest-pick">
            {CROPS.map((crop) => (
              <button
                key={crop.id}
                draggable
                aria-pressed={selected === crop.id}
                title={`${crop.name} — ${PLANTS_PER_SQFT[crop.id] ?? 1} per sq ft`}
                onClick={() => {
                  setSelected(crop.id);
                  setTool("plant");
                }}
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/crop", crop.id);
                  setSelected(crop.id);
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: "0.7rem",
                    height: "0.7rem",
                    borderRadius: "50%",
                    background: CROP_COLORS[crop.id],
                    marginRight: "0.4rem",
                    verticalAlign: "baseline",
                  }}
                />
                {crop.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: "auto", paddingBottom: "0.5rem" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${w}, 2.4rem)`,
              gap: "3px",
              width: "max-content",
            }}
          >
            {cells.map((row, r) =>
              row.map((cell, c) => {
                const crop = cell.cropId ? cropById(cell.cropId) : null;
                const fit = crop ? sunFits(crop, cell.sun) : null;
                const key = `${r},${c}`;
                const color = cell.cropId ? (CROP_COLORS[cell.cropId] ?? "#666") : null;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-label={
                      crop
                        ? `${crop.name}, ${cell.sun} sun${fit === "bad" ? ", needs more sun" : ""}`
                        : `Empty, ${cell.sun} sun`
                    }
                    title={
                      crop
                        ? `${crop.name} — ${PLANTS_PER_SQFT[cell.cropId ?? ""] ?? 1}/sq ft, ${cell.sun} sun`
                        : `${cell.sun} sun`
                    }
                    onClick={() => clickCell(r, c)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(key);
                    }}
                    onDragLeave={() => setDragOver((prev) => (prev === key ? null : prev))}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(null);
                      const id = e.dataTransfer.getData("text/crop") || selected;
                      if (cropById(id)) plantAt(r, c, id);
                    }}
                    style={{
                      width: "2.4rem",
                      height: "2.4rem",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      borderRadius: "6px",
                      border:
                        dragOver === key
                          ? "2px solid var(--pine)"
                          : fit === "bad"
                            ? "2px dashed #b3261e"
                            : "1px solid var(--line)",
                      background: color ? `${color}26` : SUN_TINT[cell.sun],
                      color: color ?? "var(--muted)",
                    }}
                  >
                    {cell.cropId ? (CROP_CODES[cell.cropId] ?? "?") : ""}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="order-card">
          <p style={{ marginTop: 0 }}>
            <strong>
              Plot totals — {totals.planted}/{totals.cells} squares planted
            </strong>
          </p>
          <table className="money-table">
            <tbody>
              <tr>
                <td>Season yield (est.)</td>
                <td>
                  {totals.yieldLow}–{totals.yieldHigh} lbs
                </td>
              </tr>
              <tr>
                <td>Work (est.)</td>
                <td>~{totals.hoursPerWeek} hrs/week</td>
              </tr>
              <tr>
                <td>Sun match</td>
                <td>{totals.sunScore}%</td>
              </tr>
              {totals.badCount > 0 && (
                <tr className="total">
                  <td>Need more sun</td>
                  <td>{totals.badCount} squares (red dashed)</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="btn-row">
            <button
              className="btn"
              onClick={() =>
                setCells((prev) => prev.map((row) => row.map((cell) => ({ ...cell, cropId: null }))))
              }
            >
              Clear plantings
            </button>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: 0 }}>
            Saved in this browser automatically. Yields assume decent soil
            and water; first-year beds often come in lower.
          </p>
        </div>

        <h2>Recommended for this plot</h2>
        <p>Ranked by plantable squares × yield, tempered by difficulty.</p>
        {recs.map(({ crop, reason }) => (
          <div className="order-card" key={crop.id}>
            <p style={{ margin: 0 }}>
              <strong>{crop.name}</strong> — {reason}{" "}
              <button
                className="btn"
                style={{ marginLeft: "0.5rem" }}
                onClick={() => {
                  setSelected(crop.id);
                  setTool("plant");
                }}
              >
                Plant this
              </button>
            </p>
          </div>
        ))}

        <p style={{ paddingBottom: "3rem" }}>
          <Link href="/garden">← Back to the garden planner</Link>
        </p>
      </main>
    </>
  );
}
