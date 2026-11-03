"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { PORTLAND_HUBS, PORTLAND_RESTAURANTS } from "@/lib/portland";
import { CoverageMap, EarningsSim, RunAnimator } from "./experiments";
import { ResourcePlacer } from "./placer";
import { ParcelPicker } from "./parcels";
import {
  ALL_LAYERS_ON,
  LAB_DELIVERY_RUNS,
  LAB_DRIVERS,
  LAB_SERVICE_AREAS,
  PILOT_CENTER,
  PILOT_ZOOM,
  SCENARIO_PRESETS,
  generateSimulatedDemand,
} from "@/lib/maplab";

const NAV = (
  <nav className="site-nav">
    <Link href="/delivery">Order</Link>
    <Link href="/menu-scan">Menu scan</Link>
    <Link href="/dispatch">Dispatch</Link>
    <Link href="/transparency">Transparency</Link>
    <Link href="/labs">Labs</Link>
  </nav>
);

const DEFAULT_PRESET = SCENARIO_PRESETS[0];

export default function LabPage() {
  const divRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<{ clearLayers: () => void } | null>(null);
  const [ready, setReady] = useState(false);

  // Layer toggles.
  const [showRestaurants, setShowRestaurants] = useState(
    ALL_LAYERS_ON.restaurants
  );
  const [showHubs, setShowHubs] = useState(ALL_LAYERS_ON.hubs);
  const [showDemand, setShowDemand] = useState(ALL_LAYERS_ON.demand);
  const [showRuns, setShowRuns] = useState(ALL_LAYERS_ON.runs);
  const [showAreas, setShowAreas] = useState(ALL_LAYERS_ON.areas);
  const [showDrivers, setShowDrivers] = useState(ALL_LAYERS_ON.drivers);

  // Sliders + generator seed.
  const [heatRadius, setHeatRadius] = useState(DEFAULT_PRESET.heatRadius);
  const [heatOpacity, setHeatOpacity] = useState(DEFAULT_PRESET.heatOpacity);
  const [orderCount, setOrderCount] = useState(DEFAULT_PRESET.orderCount);
  const [seed, setSeed] = useState(DEFAULT_PRESET.seed);
  const [scenario, setScenario] = useState(DEFAULT_PRESET.name);

  // Live counts (same fetching pattern as the pilot page).
  const [openCount, setOpenCount] = useState<number | null>(null);
  const [unclaimedCount, setUnclaimedCount] = useState<number | null>(null);

  // Deterministic SIMULATED demand: same (seed, count) => same points.
  const demand = useMemo(
    () => generateSimulatedDemand(seed, orderCount),
    [seed, orderCount]
  );

  useEffect(() => {
    (async () => {
      const ordersData = await fetch("/api/orders")
        .then((r) => r.json())
        .catch(() => null);
      const rawOrders: unknown[] = Array.isArray(ordersData?.orders)
        ? (ordersData.orders as unknown[])
        : [];
      setOpenCount(
        rawOrders.filter((o) => {
          const s = (o as Record<string, unknown>).status;
          return s === "open" || s === "accepted";
        }).length
      );
      const needsData = await fetch("/api/needs")
        .then((r) => r.json())
        .catch(() => null);
      const rawNeeds: unknown[] = Array.isArray(needsData?.needs)
        ? (needsData.needs as unknown[])
        : [];
      setUnclaimedCount(
        rawNeeds.filter(
          (n) => (n as Record<string, unknown>).claimedBy == null
        ).length
      );
    })();
  }, []);

  // Init: Leaflet dynamic-import pattern copied from app/map/page.tsx.
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

  // Re-render overlays whenever any control changes (hubs-page pattern).
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

      if (showAreas) {
        for (const area of LAB_SERVICE_AREAS) {
          const poly = L.polygon(area.points, {
            color: "#2a7f6f",
            weight: 2,
            fillColor: "#2a7f6f",
            fillOpacity: 0.12,
          });
          poly.bindPopup(`<strong>${area.name}</strong><br>Service area`);
          layer.addLayer(poly);
        }
      }

      if (showRuns) {
        for (const run of LAB_DELIVERY_RUNS) {
          const line = L.polyline(run.points, {
            color: "#6b5b3e",
            weight: 3,
            opacity: 0.85,
          });
          line.bindPopup(`<strong>${run.label}</strong><br>Delivery run`);
          layer.addLayer(line);
        }
      }

      if (showDemand) {
        for (const d of demand) {
          const circle = L.circle([d.lat, d.lng], {
            radius: heatRadius,
            color: "#a03e3e",
            weight: 1,
            fillColor: "#a03e3e",
            fillOpacity: Math.min(0.9, heatOpacity * d.intensity + 0.1),
          });
          circle.bindPopup(
            `<strong>SIMULATED demand</strong><br>${d.orders} simulated orders<br>Intensity ${d.intensity}`
          );
          layer.addLayer(circle);
        }
      }

      if (showRestaurants) {
        for (const r of PORTLAND_RESTAURANTS) {
          const marker = L.circleMarker([r.lat, r.lng], {
            radius: 9,
            color: "#1e4d3a",
            fillColor: "#1e4d3a",
            fillOpacity: 0.85,
          });
          marker.bindPopup(
            `<strong>${r.name}</strong><br>${r.cuisine} · ${r.neighborhood}<br>${r.hoursLabel} — ${r.openNow ? "open now" : "closed"}`
          );
          layer.addLayer(marker);
        }
      }

      if (showHubs) {
        for (const h of PORTLAND_HUBS) {
          const marker = L.circleMarker([h.lat, h.lng], {
            radius: 8,
            color: "#5a78b0",
            fillColor: "#5a78b0",
            fillOpacity: 0.85,
          });
          marker.bindPopup(
            `<strong>${h.name}</strong><br>${h.services.join(" · ")}<br>${h.hoursLabel} — ${h.openNow ? "open now" : "closed"}`
          );
          layer.addLayer(marker);
        }
      }

      if (showDrivers) {
        for (const d of LAB_DRIVERS) {
          const marker = L.circleMarker([d.lat, d.lng], {
            radius: 7,
            color: "#b0502a",
            fillColor: "#b0502a",
            fillOpacity: 0.9,
          });
          marker.bindPopup(`<strong>${d.name}</strong> (dev driver)`);
          layer.addLayer(marker);
        }
      }
    })();
  }, [
    ready,
    showRestaurants,
    showHubs,
    showDemand,
    showRuns,
    showAreas,
    showDrivers,
    heatRadius,
    heatOpacity,
    demand,
  ]);

  function applyScenario(name: string) {
    const preset = SCENARIO_PRESETS.find((p) => p.name === name);
    if (!preset) return;
    setScenario(preset.name);
    setSeed(preset.seed);
    setOrderCount(preset.orderCount);
    setHeatRadius(preset.heatRadius);
    setHeatOpacity(preset.heatOpacity);
    setShowRestaurants(preset.layers.restaurants);
    setShowHubs(preset.layers.hubs);
    setShowDemand(preset.layers.demand);
    setShowRuns(preset.layers.runs);
    setShowAreas(preset.layers.areas);
    setShowDrivers(preset.layers.drivers);
  }

  function markCustom() {
    setScenario("Custom");
  }

  const visibleMarkers =
    (showRestaurants ? PORTLAND_RESTAURANTS.length : 0) +
    (showHubs ? PORTLAND_HUBS.length : 0) +
    (showDrivers ? LAB_DRIVERS.length : 0) +
    (showDemand ? demand.length : 0) +
    (showRuns ? LAB_DELIVERY_RUNS.length : 0) +
    (showAreas ? LAB_SERVICE_AREAS.length : 0);

  return (
    <>
      <header className="site-header">
        <div className="wrap">
          <Link href="/" className="wordmark">
            Strongo
          </Link>
          {NAV}
        </div>
      </header>

      <main className="wrap">
        <div className="prose">
          <h1>Map overlay lab</h1>
          <p>
            Portland pilot playground (DEMO DATA +{" "}
            <span className="badge badge-ai">SIMULATED</span> demand).{" "}
            {PORTLAND_RESTAURANTS.length} restaurants, {PORTLAND_HUBS.length}{" "}
            hubs
            {openCount !== null && unclaimedCount !== null
              ? ` — live now: ${openCount} open deliveries, ${unclaimedCount} unclaimed needs.`
              : " — loading live counts…"}
          </p>
        </div>

        <div className="map-shell" ref={divRef} />

        <p>
          <span
            style={{
              display: "inline-block",
              width: "0.8rem",
              height: "0.8rem",
              borderRadius: "50%",
              background: "#1e4d3a",
              marginRight: "0.4rem",
            }}
          />
          Restaurant
          <span
            style={{
              display: "inline-block",
              width: "0.8rem",
              height: "0.8rem",
              borderRadius: "50%",
              background: "#5a78b0",
              marginRight: "0.4rem",
              marginLeft: "1rem",
            }}
          />
          Hub
          <span
            style={{
              display: "inline-block",
              width: "0.8rem",
              height: "0.8rem",
              borderRadius: "50%",
              background: "#a03e3e",
              marginRight: "0.4rem",
              marginLeft: "1rem",
            }}
          />
          SIMULATED demand
          <span
            style={{
              display: "inline-block",
              width: "0.8rem",
              height: "0.8rem",
              borderRadius: "50%",
              background: "#b0502a",
              marginRight: "0.4rem",
              marginLeft: "1rem",
            }}
          />
          Driver
          <span
            style={{
              display: "inline-block",
              width: "1.2rem",
              height: "0.25rem",
              background: "#6b5b3e",
              marginRight: "0.4rem",
              marginLeft: "1rem",
              verticalAlign: "middle",
            }}
          />
          Delivery run
          <span
            style={{
              display: "inline-block",
              width: "0.8rem",
              height: "0.8rem",
              background: "#2a7f6f",
              opacity: 0.35,
              marginRight: "0.4rem",
              marginLeft: "1rem",
              verticalAlign: "middle",
            }}
          />
          Service area
        </p>

        <div className="order-card">
          <p style={{ marginTop: 0 }}>
            <strong>Scenarios</strong>{" "}
            <span className="badge badge-local">{scenario}</span>
          </p>
          <div className="rest-pick">
            {SCENARIO_PRESETS.map((p) => (
              <button
                key={p.name}
                aria-pressed={scenario === p.name}
                onClick={() => applyScenario(p.name)}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="order-card">
          <p style={{ marginTop: 0 }}>
            <strong>Layers</strong>
          </p>
          <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              type="checkbox"
              checked={showRestaurants}
              onChange={(e) => {
                setShowRestaurants(e.target.checked);
                markCustom();
              }}
            />
            Restaurants ({PORTLAND_RESTAURANTS.length})
          </label>
          <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              type="checkbox"
              checked={showHubs}
              onChange={(e) => {
                setShowHubs(e.target.checked);
                markCustom();
              }}
            />
            Hubs ({PORTLAND_HUBS.length})
          </label>
          <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              type="checkbox"
              checked={showDemand}
              onChange={(e) => {
                setShowDemand(e.target.checked);
                markCustom();
              }}
            />
            Demand heat circles (SIMULATED, {demand.length})
          </label>
          <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              type="checkbox"
              checked={showRuns}
              onChange={(e) => {
                setShowRuns(e.target.checked);
                markCustom();
              }}
            />
            Delivery-run polylines ({LAB_DELIVERY_RUNS.length})
          </label>
          <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              type="checkbox"
              checked={showAreas}
              onChange={(e) => {
                setShowAreas(e.target.checked);
                markCustom();
              }}
            />
            Service-area polygons ({LAB_SERVICE_AREAS.length})
          </label>
          <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              type="checkbox"
              checked={showDrivers}
              onChange={(e) => {
                setShowDrivers(e.target.checked);
                markCustom();
              }}
            />
            Driver markers ({LAB_DRIVERS.length})
          </label>
        </div>

        <div className="field">
          <label htmlFor="lab-radius">
            Heat radius: {heatRadius}m
          </label>
          <input
            id="lab-radius"
            className="input"
            type="range"
            min={100}
            max={800}
            step={25}
            value={heatRadius}
            onChange={(e) => {
              setHeatRadius(Number(e.target.value));
              markCustom();
            }}
          />
        </div>
        <div className="field">
          <label htmlFor="lab-opacity">
            Heat opacity: {heatOpacity.toFixed(2)}
          </label>
          <input
            id="lab-opacity"
            className="input"
            type="range"
            min={0.1}
            max={0.8}
            step={0.05}
            value={heatOpacity}
            onChange={(e) => {
              setHeatOpacity(Number(e.target.value));
              markCustom();
            }}
          />
        </div>
        <div className="field">
          <label htmlFor="lab-count">
            Simulated order count: {orderCount}
          </label>
          <input
            id="lab-count"
            className="input"
            type="range"
            min={0}
            max={80}
            step={1}
            value={orderCount}
            onChange={(e) => {
              setOrderCount(Number(e.target.value));
              markCustom();
            }}
          />
        </div>
        <div className="field">
          <label htmlFor="lab-seed">Demand seed (deterministic)</label>
          <input
            id="lab-seed"
            className="input"
            style={{ maxWidth: "10rem" }}
            type="number"
            value={seed}
            onChange={(e) => {
              setSeed(Number(e.target.value));
              markCustom();
            }}
          />
        </div>

        <div className="order-card">
          <p style={{ marginTop: 0 }}>
            <strong>Live readout</strong>{" "}
            <span className="badge badge-ai">SIMULATED</span>
          </p>
          <p style={{ marginBottom: 0 }}>
            Scenario: {scenario} · seed {seed} · {demand.length} simulated
            points · radius {heatRadius}m · opacity {heatOpacity.toFixed(2)} ·
            layers{" "}
            {[
              showRestaurants && "restaurants",
              showHubs && "hubs",
              showDemand && "demand",
              showRuns && "runs",
              showAreas && "areas",
              showDrivers && "drivers",
            ]
              .filter(Boolean)
              .join(", ") || "none"}{" "}
            · {visibleMarkers} overlays on map.
          </p>
        </div>

        <div className="prose">
          <h2>Experiments</h2>
          <p>
            Game-feel simulations: what drivers earn, how zones split the
            neighborhood without overlap, and couriers replaying live runs.
          </p>
        </div>

        <EarningsSim />

        <CoverageMap />

        <RunAnimator />

        <ResourcePlacer />

        <ParcelPicker />

        <p style={{ paddingBottom: "3rem" }}>
          <Link href="/">← Back to Strongo home</Link>
        </p>
      </main>
    </>
  );
}
