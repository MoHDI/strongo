"use client";

import { useEffect, useRef, useState } from "react";
import type { Lot } from "@/lib/parcels";

// Alberta Arts pilot block (~0.6 × 0.5 mi). Small enough to stay fast.
const BBOX = { w: -122.648, s: 45.556, e: -122.638, n: 45.563 };
const CENTER: [number, number] = [45.5595, -122.643];

export function ParcelPicker() {
  const divRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<{ clearLayers: () => void } | null>(null);
  const [ready, setReady] = useState(false);
  const [lots, setLots] = useState<Lot[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cleanup: (() => void) | null = null;
    let cancelled = false;
    (async () => {
      if (!divRef.current) return;
      const L = (await import("leaflet")).default;
      if (cancelled || !divRef.current) return;
      const map = L.map(divRef.current).setView(CENTER, 16);
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
      for (const lot of lots) {
        const isSel = selected.includes(lot.id);
        for (const ring of lot.rings) {
          // Leaflet wants [lat, lng]; RLIS gives [lng, lat].
          const poly = L.polygon(
            ring.map(([lng, lat]) => [lat, lng] as [number, number]),
            {
              color: isSel ? "#1e4d3a" : "#5a78b0",
              weight: isSel ? 2 : 1,
              fillColor: isSel ? "#1e4d3a" : "#5a78b0",
              fillOpacity: isSel ? 0.45 : 0.08,
            }
          );
          poly.bindPopup(
            `<strong>${lot.address}</strong><br>${lot.areaSqft.toLocaleString()} sq ft · ${lot.acres} ac<br>${isSel ? "Selected — click to remove" : "Click to add to corridor"}`
          );
          poly.on("click", () => {
            setSelected((prev) =>
              prev.includes(lot.id) ? prev.filter((id) => id !== lot.id) : [...prev, lot.id]
            );
          });
          layer.addLayer(poly);
        }
      }
    })();
  }, [ready, lots, selected]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/parcels?bbox=${BBOX.w},${BBOX.s},${BBOX.e},${BBOX.n}`
      );
      const data = (await res.json()) as { lots?: Lot[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Load failed.");
      setLots(data.lots ?? []);
      setSelected([]);
      if ((data.lots ?? []).length === 0) setError("No residential lots in that block.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }

  const picked = lots.filter((l) => selected.includes(l.id));
  const totalSqft = picked.reduce((s, l) => s + l.areaSqft, 0);
  const dogs = Math.max(0, Math.floor(totalSqft / 500));
  const gates = picked.length > 0 ? picked.length + 1 : 0;

  return (
    <section className="order-card" aria-label="Parcel picker">
      <p style={{ marginTop: 0 }}>
        <strong>Parcel picker — real Portland lots</strong>{" "}
        <span className="badge badge-ai">RLIS LIVE</span>
      </p>
      <p>
        Actual residential taxlots for an Alberta Arts block, served live
        from Metro RLIS. Click lots to join backyards into a corridor.
      </p>
      <div className="map-shell" ref={divRef} style={{ minHeight: "320px" }} />
      <div className="btn-row">
        <button className="btn" onClick={load} disabled={loading}>
          {loading ? "Loading lots…" : lots.length > 0 ? "Reload lots" : "Load lots"}
        </button>
        {selected.length > 0 && (
          <button className="btn" onClick={() => setSelected([])}>
            Clear selection
          </button>
        )}
      </div>
      {error && (
        <div className="notice">
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      )}
      {picked.length > 0 && (
        <table className="money-table">
          <tbody>
            <tr>
              <td>Backyards joined</td>
              <td>{picked.length}</td>
            </tr>
            <tr>
              <td>Combined lot area</td>
              <td>
                {totalSqft.toLocaleString()} sq ft (
                {(totalSqft / 43560).toFixed(2)} ac)
              </td>
            </tr>
            <tr>
              <td>Dogs accommodated (~500 sq ft each)</td>
              <td>~{dogs}</td>
            </tr>
            <tr>
              <td>Gates needed</td>
              <td>{gates}</td>
            </tr>
            <tr className="total">
              <td>Build cost (est.)</td>
              <td>
                ${(gates * 120 + 320).toLocaleString()}–$
                {(gates * 200 + 560).toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      )}
      <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: 0 }}>
        Taxlots: Metro RLIS open data (county assessors, City of Portland)
        — no ownership info included. Lot area is the full parcel; the run
        would fence a strip of it.
      </p>
    </section>
  );
}
