"use client";

// Lab game-feel experiments (SIMULATED data only). Wired into app/lab/page.tsx
// by the parent — this module only exports the three experiment components.
// Styling reuses the existing app classes (order-card, field, input,
// rest-pick, btn, badge, money-table) plus inline styles; no new CSS.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  LAB_DELIVERY_RUNS,
  PILOT_BOUNDS,
  PILOT_CENTER,
  PILOT_ZOOM,
  generateSimulatedDemand,
} from "@/lib/maplab";
import {
  VEHICLE_COST_PER_MILE,
  estimateEarnings,
  hourlyMultiplier,
  planCoverage,
  saturatedRate,
} from "@/lib/lab-sim";

/** Parse a number input; blanks and junk become 0. */
function num(value: string): number {
  if (value.trim() === "") return 0;
  const v = Number(value);
  return Number.isFinite(v) ? v : 0;
}

function fmt(n: number): string {
  return `$${n.toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// <EarningsSim/> — driver earnings ledger + saturation fair-share row
// ---------------------------------------------------------------------------

export function EarningsSim() {
  const [hoursPerWeek, setHoursPerWeek] = useState(20);
  const [deliveriesPerHour, setDeliveriesPerHour] = useState(2.5);
  const [basePerDelivery, setBasePerDelivery] = useState(4);
  const [avgTip, setAvgTip] = useState(3);
  const [costPerMile, setCostPerMile] = useState<number>(
    VEHICLE_COST_PER_MILE.car
  );
  const [milesPerDelivery, setMilesPerDelivery] = useState(3);
  // Saturation row: area-wide orders split evenly across drivers on shift.
  const [areaOrdersPerHr, setAreaOrdersPerHr] = useState(30);
  const [driverCount, setDriverCount] = useState(10);

  const result = useMemo(
    () =>
      estimateEarnings({
        hoursPerWeek,
        deliveriesPerHour,
        basePerDelivery,
        avgTip,
        costPerMile,
        milesPerDelivery,
      }),
    [
      hoursPerWeek,
      deliveriesPerHour,
      basePerDelivery,
      avgTip,
      costPerMile,
      milesPerDelivery,
    ]
  );

  // Fair share caps each driver's achievable pace when the area is crowded.
  const saturated = useMemo(() => {
    const effectiveRate = saturatedRate(
      deliveriesPerHour,
      areaOrdersPerHr,
      driverCount
    );
    return {
      effectiveRate,
      result: estimateEarnings({
        hoursPerWeek,
        deliveriesPerHour: effectiveRate,
        basePerDelivery,
        avgTip,
        costPerMile,
        milesPerDelivery,
      }),
    };
  }, [
    areaOrdersPerHr,
    driverCount,
    hoursPerWeek,
    deliveriesPerHour,
    basePerDelivery,
    avgTip,
    costPerMile,
    milesPerDelivery,
  ]);

  const vehicle: "bike" | "car" | "custom" =
    costPerMile === VEHICLE_COST_PER_MILE.bike
      ? "bike"
      : costPerMile === VEHICLE_COST_PER_MILE.car
        ? "car"
        : "custom";

  return (
    <section className="order-card" aria-label="Driver earnings simulator">
      <p style={{ marginTop: 0 }}>
        <strong>Earnings sim</strong>{" "}
        <span className="badge badge-ai">SIMULATED</span>
      </p>
      <div className="rest-pick" role="group" aria-label="Vehicle preset">
        <button
          type="button"
          aria-pressed={vehicle === "bike"}
          onClick={() => setCostPerMile(VEHICLE_COST_PER_MILE.bike)}
        >
          Bike (${VEHICLE_COST_PER_MILE.bike.toFixed(2)}/mi)
        </button>
        <button
          type="button"
          aria-pressed={vehicle === "car"}
          onClick={() => setCostPerMile(VEHICLE_COST_PER_MILE.car)}
        >
          Car (${VEHICLE_COST_PER_MILE.car.toFixed(2)}/mi)
        </button>
      </div>
      <div className="field">
        <label htmlFor="earn-hours">Hours per week</label>
        <input
          id="earn-hours"
          className="input"
          style={{ maxWidth: "10rem" }}
          type="number"
          min={0}
          step={1}
          value={hoursPerWeek}
          onChange={(e) => setHoursPerWeek(num(e.target.value))}
        />
      </div>
      <div className="field">
        <label htmlFor="earn-rate">Deliveries per hour</label>
        <input
          id="earn-rate"
          className="input"
          style={{ maxWidth: "10rem" }}
          type="number"
          min={0}
          step={0.5}
          value={deliveriesPerHour}
          onChange={(e) => setDeliveriesPerHour(num(e.target.value))}
        />
      </div>
      <div className="field">
        <label htmlFor="earn-base">Base pay per delivery ($)</label>
        <input
          id="earn-base"
          className="input"
          style={{ maxWidth: "10rem" }}
          type="number"
          min={0}
          step={0.5}
          value={basePerDelivery}
          onChange={(e) => setBasePerDelivery(num(e.target.value))}
        />
      </div>
      <div className="field">
        <label htmlFor="earn-tip">Average tip per delivery ($)</label>
        <input
          id="earn-tip"
          className="input"
          style={{ maxWidth: "10rem" }}
          type="number"
          min={0}
          step={0.5}
          value={avgTip}
          onChange={(e) => setAvgTip(num(e.target.value))}
        />
      </div>
      <div className="field">
        <label htmlFor="earn-cost">Vehicle cost per mile ($)</label>
        <input
          id="earn-cost"
          className="input"
          style={{ maxWidth: "10rem" }}
          type="number"
          min={0}
          step={0.01}
          value={costPerMile}
          onChange={(e) => setCostPerMile(num(e.target.value))}
        />
      </div>
      <div className="field">
        <label htmlFor="earn-miles">Miles per delivery</label>
        <input
          id="earn-miles"
          className="input"
          style={{ maxWidth: "10rem" }}
          type="number"
          min={0}
          step={0.5}
          value={milesPerDelivery}
          onChange={(e) => setMilesPerDelivery(num(e.target.value))}
        />
      </div>
      <table className="money-table">
        <tbody>
          <tr>
            <td>Gross (weekly)</td>
            <td>{fmt(result.gross)}</td>
          </tr>
          <tr>
            <td>Costs (weekly)</td>
            <td>−{fmt(result.costs)}</td>
          </tr>
          <tr>
            <td>Net (weekly)</td>
            <td>{fmt(result.net)}</td>
          </tr>
          <tr>
            <td>Net per hour</td>
            <td>{fmt(result.netPerHour)}</td>
          </tr>
          <tr className="total">
            <td>Monthly (net × 52 / 12)</td>
            <td>{fmt(result.monthly)}</td>
          </tr>
        </tbody>
      </table>
      <p style={{ marginTop: "1rem" }}>
        <strong>Saturation</strong>{" "}
        <span className="badge badge-local">fair share</span>
      </p>
      <div className="field">
        <label htmlFor="earn-area">Area orders per hour</label>
        <input
          id="earn-area"
          className="input"
          style={{ maxWidth: "10rem" }}
          type="number"
          min={0}
          step={1}
          value={areaOrdersPerHr}
          onChange={(e) => setAreaOrdersPerHr(num(e.target.value))}
        />
      </div>
      <div className="field">
        <label htmlFor="earn-drivers">Drivers on shift</label>
        <input
          id="earn-drivers"
          className="input"
          style={{ maxWidth: "10rem" }}
          type="number"
          min={1}
          step={1}
          value={driverCount}
          onChange={(e) => setDriverCount(num(e.target.value))}
        />
      </div>
      <table className="money-table">
        <tbody>
          <tr>
            <td>Fair-share pace</td>
            <td>
              {saturated.effectiveRate.toFixed(2)} deliveries/hr (of{" "}
              {deliveriesPerHour.toFixed(2)} possible)
            </td>
          </tr>
          <tr className="total">
            <td>Saturated net per hour</td>
            <td>{fmt(saturated.result.netPerHour)}</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

// ---------------------------------------------------------------------------
// <CoverageMap/> — Voronoi-style exclusive driver zones over PILOT_BOUNDS
// ---------------------------------------------------------------------------

const ZONE_COLORS = ["#2a7f6f", "#5a78b0", "#b0502a"];
const SHARED_COLOR = "#7a4a8f";
const COVERAGE_GRID = 8;

interface HomeCoord {
  lat: number;
  lng: number;
}

const DEFAULT_HOMES: Array<HomeCoord & { name: string }> = [
  { name: "Driver Ada", lat: 45.527, lng: -122.68 },
  { name: "Driver Ben", lat: 45.532, lng: -122.676 },
  { name: "Driver Cal", lat: 45.558, lng: -122.651 },
];

export function CoverageMap() {
  const divRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<{ clearLayers: () => void } | null>(null);
  const [ready, setReady] = useState(false);
  const [homes, setHomes] = useState<HomeCoord[]>(DEFAULT_HOMES);
  const [bufferMiles, setBufferMiles] = useState(0.6);
  const [seed, setSeed] = useState(7);

  const plan = useMemo(
    () =>
      planCoverage({
        driverHomes: homes.map((h, i) => ({
          id: `home-${i}`,
          name: DEFAULT_HOMES[i].name,
          lat: h.lat,
          lng: h.lng,
        })),
        gridSize: COVERAGE_GRID,
        seed,
        bufferMiles,
      }),
    [homes, seed, bufferMiles]
  );

  function setHome(i: number, patch: Partial<HomeCoord>) {
    setHomes((prev) => prev.map((h, j) => (j === i ? { ...h, ...patch } : h)));
  }

  // Init: Leaflet dynamic-import pattern, same as app/lab/page.tsx.
  useEffect(() => {
    let cleanup: (() => void) | null = null;
    let cancelled = false;
    (async () => {
      if (!divRef.current) return;
      const L = (await import("leaflet")).default;
      if (cancelled || !divRef.current) return;
      const map = L.map(divRef.current).setView(PILOT_CENTER, PILOT_ZOOM);
      cleanup = () => map.remove();
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      setReady(true);
    })();
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  // Re-draw zones whenever the plan changes.
  useEffect(() => {
    if (!ready) return;
    (async () => {
      const L = (await import("leaflet")).default;
      const layer = layerRef.current as unknown as {
        clearLayers: () => void;
        addLayer: (l: unknown) => void;
      } | null;
      if (!layer) return;
      layer.clearLayers();
      const latSpan = PILOT_BOUNDS.maxLat - PILOT_BOUNDS.minLat;
      const lngSpan = PILOT_BOUNDS.maxLng - PILOT_BOUNDS.minLng;
      for (const cell of plan.cells) {
        const ownerIdx = plan.drivers.findIndex(
          (d) => d.id === cell.ownerId
        );
        const lat0 =
          PILOT_BOUNDS.minLat + (cell.row / COVERAGE_GRID) * latSpan;
        const lat1 =
          PILOT_BOUNDS.minLat + ((cell.row + 1) / COVERAGE_GRID) * latSpan;
        const lng0 =
          PILOT_BOUNDS.minLng + (cell.col / COVERAGE_GRID) * lngSpan;
        const lng1 =
          PILOT_BOUNDS.minLng + ((cell.col + 1) / COVERAGE_GRID) * lngSpan;
        // Leaflet has no hatch fill, so shared (contested) cells get a
        // distinct purple fill plus a dashed border instead.
        const color = cell.shared
          ? SHARED_COLOR
          : ZONE_COLORS[ownerIdx % ZONE_COLORS.length];
        const rect = L.rectangle(
          [
            [lat0, lng0],
            [lat1, lng1],
          ],
          {
            color,
            weight: cell.shared ? 2 : 1,
            dashArray: cell.shared ? "4 3" : undefined,
            fillColor: color,
            fillOpacity: cell.shared ? 0.35 : 0.22,
          }
        );
        rect.bindPopup(
          `<strong>${cell.shared ? "Shared buffer" : plan.drivers[ownerIdx]?.name ?? "Zone"}</strong><br>` +
            `Cell ${cell.row},${cell.col} · ${cell.demand} orders<br>` +
            `Owner: ${plan.drivers[ownerIdx]?.name ?? "?"}`
        );
        layer.addLayer(rect);
      }
      homes.forEach((h, i) => {
        const marker = L.circleMarker([h.lat, h.lng], {
          radius: 8,
          color: "#111",
          weight: 2,
          fillColor: ZONE_COLORS[i % ZONE_COLORS.length],
          fillOpacity: 1,
        });
        marker.bindPopup(`<strong>${DEFAULT_HOMES[i].name}</strong><br>Home zone center`);
        layer.addLayer(marker);
      });
    })();
  }, [ready, plan, homes]);

  return (
    <section className="order-card" aria-label="Coverage planner">
      <p style={{ marginTop: 0 }}>
        <strong>Coverage planner</strong>{" "}
        <span className="badge badge-ai">SIMULATED</span>
      </p>
      <div className="map-shell" ref={divRef} style={{ minHeight: "320px" }} />
      <p>
        {plan.drivers.map((d, i) => (
          <span key={d.id} style={{ marginRight: "1rem" }}>
            <span
              style={{
                display: "inline-block",
                width: "0.8rem",
                height: "0.8rem",
                background: ZONE_COLORS[i % ZONE_COLORS.length],
                opacity: 0.6,
                marginRight: "0.4rem",
                verticalAlign: "middle",
              }}
            />
            {d.name}
          </span>
        ))}
        <span>
          <span
            style={{
              display: "inline-block",
              width: "0.8rem",
              height: "0.8rem",
              background: SHARED_COLOR,
              border: "1px dashed #111",
              marginRight: "0.4rem",
              verticalAlign: "middle",
            }}
          />
          Shared buffer ({plan.sharedCount} cells)
        </span>
      </p>
      {homes.map((h, i) => (
        <div className="field" key={i}>
          <label>
            {DEFAULT_HOMES[i].name} home (lat, lng)
          </label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              className="input"
              style={{ maxWidth: "8rem" }}
              type="number"
              step={0.001}
              aria-label={`${DEFAULT_HOMES[i].name} latitude`}
              value={h.lat}
              onChange={(e) =>
                setHome(i, { lat: num(e.target.value) })
              }
            />
            <input
              className="input"
              style={{ maxWidth: "8rem" }}
              type="number"
              step={0.001}
              aria-label={`${DEFAULT_HOMES[i].name} longitude`}
              value={h.lng}
              onChange={(e) =>
                setHome(i, { lng: num(e.target.value) })
              }
            />
          </div>
        </div>
      ))}
      <div className="field">
        <label htmlFor="cov-buffer">
          Shared buffer radius: {bufferMiles.toFixed(1)} mi
        </label>
        <input
          id="cov-buffer"
          className="input"
          type="range"
          min={0}
          max={2}
          step={0.1}
          value={bufferMiles}
          onChange={(e) => setBufferMiles(num(e.target.value))}
        />
      </div>
      <div className="field">
        <label htmlFor="cov-seed">Demand seed (deterministic)</label>
        <input
          id="cov-seed"
          className="input"
          style={{ maxWidth: "10rem" }}
          type="number"
          value={seed}
          onChange={(e) => setSeed(Math.floor(num(e.target.value)))}
        />
      </div>
      <table className="money-table">
        <tbody>
          {plan.drivers.map((d) => (
            <tr key={d.id}>
              <td>
                {d.name} — {d.cells} cells
              </td>
              <td>
                {(d.demandShare * 100).toFixed(1)}% of demand · load{" "}
                {d.loadPct.toFixed(0)}%
              </td>
            </tr>
          ))}
          <tr className="total">
            <td>Balance score (min/max share)</td>
            <td>
              {plan.balanceScore.toFixed(2)}{" "}
              <span className="badge badge-local">
                {plan.balanceScore >= 0.8
                  ? "even"
                  : plan.balanceScore >= 0.5
                    ? "tilted"
                    : "lopsided"}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

// ---------------------------------------------------------------------------
// <RunAnimator/> — replay LAB_DELIVERY_RUNS with requestAnimationFrame dots
// ---------------------------------------------------------------------------

/** Seconds for one full route loop at 1x speed. */
const LOOP_SECONDS = 30;
/** Fixed seed for the animated demand overlay (SIMULATED). */
const RUN_DEMAND_SEED = 7;
const RUN_DEMAND_COUNT = 24;

interface DotHandle {
  setLatLng: (ll: [number, number]) => unknown;
}

interface ShadeHandle {
  setStyle: (style: { fillOpacity: number }) => unknown;
}

/**
 * Interpolate a position along a run polyline at progress t (0..1 loops).
 * Linear in lat/lng space — fine for short demo hops.
 */
function pointAlongRun(
  points: Array<[number, number]>,
  t: number
): [number, number] {
  if (points.length === 0) return [PILOT_CENTER[0], PILOT_CENTER[1]];
  if (points.length === 1) return points[0];
  const wrapped = ((t % 1) + 1) % 1;
  // Segment lengths and total.
  const segLens: number[] = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dLat = points[i + 1][0] - points[i][0];
    const dLng = points[i + 1][1] - points[i][1];
    const len = Math.sqrt(dLat * dLat + dLng * dLng);
    segLens.push(len);
    total += len;
  }
  if (total === 0) return points[0];
  let target = wrapped * total;
  for (let i = 0; i < segLens.length; i++) {
    if (target <= segLens[i] || i === segLens.length - 1) {
      const f = segLens[i] === 0 ? 0 : target / segLens[i];
      return [
        points[i][0] + (points[i + 1][0] - points[i][0]) * f,
        points[i][1] + (points[i + 1][1] - points[i][1]) * f,
      ];
    }
    target -= segLens[i];
  }
  return points[points.length - 1];
}

function hourLabel(h: number): string {
  if (h === 12) return "lunch peak";
  if (h >= 11 && h <= 13) return "lunch rush";
  if (h >= 17 && h <= 20) return "dinner rush";
  if (h >= 0 && h <= 5) return "overnight lull";
  return "off-peak";
}

export function RunAnimator() {
  const divRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<Array<{ dot: DotHandle; offset: number }>>([]);
  const shadesRef = useRef<Array<{ shade: ShadeHandle; base: number }>>([]);
  const rafRef = useRef<number>(0);
  // Mutable animation state read by the rAF loop (no re-subscribe needed).
  const animRef = useRef({ playing: true, speed: 1, t: 0, last: -1 });
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [hour, setHour] = useState(18);

  const demand = useMemo(
    () => generateSimulatedDemand(RUN_DEMAND_SEED, RUN_DEMAND_COUNT),
    []
  );
  const multiplier = hourlyMultiplier(hour);

  // Keep the loop's mutable snapshot in sync with controls.
  useEffect(() => {
    animRef.current.playing = playing;
    animRef.current.speed = speed;
  }, [playing, speed]);

  // Time-of-day rescales demand-circle opacity via the hourly multiplier.
  useEffect(() => {
    if (!ready) return;
    for (const { shade, base } of shadesRef.current) {
      shade.setStyle({ fillOpacity: Math.min(0.9, base * multiplier) });
    }
  }, [ready, hour, multiplier, demand]);

  // Init map + layers + dots + rAF loop once; full cleanup on unmount.
  useEffect(() => {
    let cleanup: (() => void) | null = null;
    let cancelled = false;
    (async () => {
      if (!divRef.current) return;
      const L = (await import("leaflet")).default;
      if (cancelled || !divRef.current) return;
      const map = L.map(divRef.current).setView(PILOT_CENTER, PILOT_ZOOM);
      cleanup = () => {
        cancelAnimationFrame(rafRef.current);
        map.remove();
      };
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      const layer = L.layerGroup().addTo(map);

      for (const run of LAB_DELIVERY_RUNS) {
        const line = L.polyline(run.points, {
          color: "#6b5b3e",
          weight: 3,
          opacity: 0.85,
        });
        line.bindPopup(`<strong>${run.label}</strong><br>Delivery run`);
        layer.addLayer(line);
      }

      // Demand overlay; base opacity per point, scaled by hour multiplier.
      shadesRef.current = [];
      for (const d of demand) {
        const base = 0.25 * d.intensity + 0.08;
        const circle = L.circle([d.lat, d.lng], {
          radius: 300,
          color: "#a03e3e",
          weight: 1,
          fillColor: "#a03e3e",
          fillOpacity: Math.min(0.9, base * hourlyMultiplier(18)),
        });
        circle.bindPopup(
          `<strong>SIMULATED demand</strong><br>${d.orders} simulated orders`
        );
        layer.addLayer(circle);
        shadesRef.current.push({ shade: circle, base });
      }

      // One dot per run; staggered starts so they don't bunch up.
      dotsRef.current = [];
      LAB_DELIVERY_RUNS.forEach((run, i) => {
        const dot = L.circleMarker(run.points[0], {
          radius: 7,
          color: "#111",
          weight: 2,
          fillColor: "#b0502a",
          fillOpacity: 1,
        });
        dot.bindPopup(`<strong>Courier</strong><br>${run.label}`);
        layer.addLayer(dot);
        dotsRef.current.push({ dot, offset: i / LAB_DELIVERY_RUNS.length });
      });

      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (reduced) {
        // No animation: park every dot mid-route and stop.
        LAB_DELIVERY_RUNS.forEach((run, i) => {
          dotsRef.current[i].dot.setLatLng(pointAlongRun(run.points, 0.5));
        });
        setPlaying(false);
        setReady(true);
        return;
      }

      const step = (now: number) => {
        const s = animRef.current;
        if (s.last < 0) s.last = now;
        const dt = Math.min(0.1, (now - s.last) / 1000);
        s.last = now;
        if (s.playing) {
          s.t = (s.t + (dt * s.speed) / LOOP_SECONDS) % 1;
          LAB_DELIVERY_RUNS.forEach((run, i) => {
            const entry = dotsRef.current[i];
            entry.dot.setLatLng(
              pointAlongRun(run.points, s.t + entry.offset)
            );
          });
        }
        rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
      setReady(true);
    })();
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [demand]);

  return (
    <section className="order-card" aria-label="Delivery run animator">
      <p style={{ marginTop: 0 }}>
        <strong>Run animator</strong>{" "}
        <span className="badge badge-ai">SIMULATED</span>
      </p>
      <div className="map-shell" ref={divRef} style={{ minHeight: "320px" }} />
      <div
        className="btn-row"
        style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}
      >
        <button
          type="button"
          className="btn"
          onClick={() => setPlaying((p) => !p)}
        >
          {playing ? "Pause" : "Play"}
        </button>
      </div>
      <div className="field">
        <label htmlFor="run-speed">Speed: {speed.toFixed(2)}x</label>
        <input
          id="run-speed"
          className="input"
          type="range"
          min={0.25}
          max={4}
          step={0.25}
          value={speed}
          onChange={(e) => setSpeed(num(e.target.value))}
        />
      </div>
      <div className="field">
        <label htmlFor="run-hour">
          Time of day: {hour}:00 ({hourLabel(hour)}, ×{multiplier.toFixed(2)}{" "}
          demand)
        </label>
        <input
          id="run-hour"
          className="input"
          type="range"
          min={0}
          max={23}
          step={1}
          value={hour}
          onChange={(e) => setHour(Math.floor(num(e.target.value)))}
        />
      </div>
      {!ready && <p>Loading map…</p>}
    </section>
  );
}
