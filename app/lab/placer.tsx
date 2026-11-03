"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PILOT_CENTER, PILOT_ZOOM } from "@/lib/maplab";
import { placeFacilities } from "@/lib/placer";

const TYPES = [
  { name: "Fridges", color: "#1e4d3a" },
  { name: "Tool sheds", color: "#6b5b3e" },
  { name: "Pickup points", color: "#5a78b0" },
] as const;

export function ResourcePlacer() {
  const divRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<{ clearLayers: () => void } | null>(null);
  const [ready, setReady] = useState(false);
  const [typeIdx, setTypeIdx] = useState(0);
  const [k, setK] = useState(3);
  const [demandCount, setDemandCount] = useState(120);
  const [seed, setSeed] = useState(7);
  const [withinMiles, setWithinMiles] = useState(1);

  const type = TYPES[typeIdx];
  const placement = useMemo(
    () => placeFacilities({ k, demandCount, seed, withinMiles }, type.name.slice(0, -1)),
    [k, demandCount, seed, withinMiles, type.name]
  );

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
      for (const p of placement.points) {
        layer.addLayer(
          L.circleMarker([p.lat, p.lng], {
            radius: 2,
            color: "#a03e3e",
            weight: 0,
            fillColor: "#a03e3e",
            fillOpacity: 0.5,
          })
        );
      }
      for (const f of placement.facilities) {
        const marker = L.circleMarker([f.lat, f.lng], {
          radius: 10,
          color: "#111",
          weight: 2,
          fillColor: type.color,
          fillOpacity: 1,
        });
        marker.bindPopup(
          `<strong>${f.name}</strong><br>${f.assigned} demand points · ${(f.demandShare * 100).toFixed(0)}% share`
        );
        layer.addLayer(marker);
        layer.addLayer(
          L.circle([f.lat, f.lng], {
            radius: withinMiles * 1609.34,
            color: type.color,
            weight: 1,
            dashArray: "4 4",
            fill: false,
          })
        );
      }
    })();
  }, [ready, placement, type.color, withinMiles]);

  return (
    <section className="order-card" aria-label="Resource placer">
      <p style={{ marginTop: 0 }}>
        <strong>Resource placer</strong>{" "}
        <span className="badge badge-ai">SIMULATED</span>
      </p>
      <p>
        K-means puts {k} {type.name.toLowerCase()} where they cover the most
        simulated demand. Drag the count up and watch the average distance
        fall.
      </p>
      <div className="map-shell" ref={divRef} style={{ minHeight: "320px" }} />
      <div className="field">
        <label>Resource type</label>
        <div className="rest-pick">
          {TYPES.map((t, i) => (
            <button key={t.name} aria-pressed={i === typeIdx} onClick={() => setTypeIdx(i)}>
              {t.name}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label htmlFor="place-k">Sites to place: {k}</label>
        <input
          id="place-k"
          className="input"
          type="range"
          min={1}
          max={8}
          step={1}
          value={k}
          onChange={(e) => setK(Number(e.target.value))}
        />
      </div>
      <div className="field">
        <label htmlFor="place-demand">Simulated demand points: {demandCount}</label>
        <input
          id="place-demand"
          className="input"
          type="range"
          min={20}
          max={300}
          step={10}
          value={demandCount}
          onChange={(e) => setDemandCount(Number(e.target.value))}
        />
      </div>
      <div className="field">
        <label htmlFor="place-within">Coverage radius: {withinMiles.toFixed(1)} mi</label>
        <input
          id="place-within"
          className="input"
          type="range"
          min={0.25}
          max={2}
          step={0.25}
          value={withinMiles}
          onChange={(e) => setWithinMiles(Number(e.target.value))}
        />
      </div>
      <table className="money-table">
        <tbody>
          <tr>
            <td>Avg distance to nearest site</td>
            <td>{placement.avgMiles.toFixed(2)} mi</td>
          </tr>
          <tr className="total">
            <td>Demand within {withinMiles.toFixed(1)} mi</td>
            <td>{(placement.coverage * 100).toFixed(0)}%</td>
          </tr>
        </tbody>
      </table>
      <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: 0 }}>
        Deterministic k-means over seeded demand — same inputs, same sites.
      </p>
    </section>
  );
}
