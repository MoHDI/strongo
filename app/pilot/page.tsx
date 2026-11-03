"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PORTLAND_HUBS, PORTLAND_RESTAURANTS } from "@/lib/portland";

type View = "customer" | "driver";

interface OrderSummary {
  id: string;
  restaurantName: string;
  address: string;
  status: string;
  total: number;
}

interface NeedSummary {
  id: string;
  title: string;
  urgent: boolean;
  claimedBy: string | null;
}

const NAV = (
  <nav className="site-nav">
    <Link href="/delivery">Order</Link>
    <Link href="/menu-scan">Menu scan</Link>
    <Link href="/dispatch">Dispatch</Link>
    <Link href="/transparency">Transparency</Link>
    <Link href="/labs">Labs</Link>
  </nav>
);

export default function PilotPage() {
  const divRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<{ clearLayers: () => void } | null>(null);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>("customer");
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [needs, setNeeds] = useState<NeedSummary[]>([]);

  useEffect(() => {
    let cleanup: (() => void) | null = null;
    let cancelled = false;
    (async () => {
      if (!divRef.current) return;
      const L = (await import("leaflet")).default;
      if (cancelled || !divRef.current) return;
      const map = L.map(divRef.current).setView([45.543, -122.665], 12);
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
    (async () => {
      const ordersData = await fetch("/api/orders")
        .then((r) => r.json())
        .catch(() => null);
      const rawOrders: unknown[] = Array.isArray(ordersData?.orders)
        ? (ordersData.orders as unknown[])
        : [];
      setOrders(
        rawOrders.map((o) => {
          const r = o as Record<string, unknown>;
          return {
            id: typeof r.id === "string" ? r.id : "?",
            restaurantName:
              typeof r.restaurantName === "string" ? r.restaurantName : "Unknown",
            address: typeof r.address === "string" ? r.address : "",
            status: typeof r.status === "string" ? r.status : "?",
            total: typeof r.total === "number" ? r.total : 0,
          };
        })
      );
      const needsData = await fetch("/api/needs")
        .then((r) => r.json())
        .catch(() => null);
      const rawNeeds: unknown[] = Array.isArray(needsData?.needs)
        ? (needsData.needs as unknown[])
        : [];
      setNeeds(
        rawNeeds.map((n) => {
          const r = n as Record<string, unknown>;
          return {
            id: typeof r.id === "string" ? r.id : "?",
            title: typeof r.title === "string" ? r.title : "?",
            urgent: r.urgent === true,
            claimedBy: typeof r.claimedBy === "string" ? r.claimedBy : null,
          };
        })
      );
    })();
  }, []);

  const openOrders = orders.filter(
    (o) => o.status === "open" || o.status === "accepted"
  );
  const unclaimed = needs.filter((n) => !n.claimedBy);
  const urgent = unclaimed.filter((n) => n.urgent);

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
      if (view === "customer") {
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
      } else {
        for (const r of PORTLAND_RESTAURANTS) {
          const marker = L.circleMarker([r.lat, r.lng], {
            radius: 10,
            color: "#b0502a",
            fillColor: "#b0502a",
            fillOpacity: 0.9,
          });
          marker.bindPopup(
            `<strong>${r.name}</strong> (pickup)<br>${r.cuisine} · ${r.neighborhood}<br>${r.openNow ? "open now" : "closed"}`
          );
          layer.addLayer(marker);
        }
        for (const h of PORTLAND_HUBS) {
          const marker = L.circleMarker([h.lat, h.lng], {
            radius: 10,
            color: "#a03e3e",
            fillColor: "#a03e3e",
            fillOpacity: 0.9,
          });
          marker.bindPopup(
            `<strong>${h.name}</strong> (drop-off demand)<br>${h.services.join(" · ")}<br>${h.hoursLabel}`
          );
          layer.addLayer(marker);
        }
      }
    })();
  }, [ready, view]);

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
          <h1>Portland pilot map</h1>
          <p>
            Pearl District and Alberta Arts seeds (DEMO DATA):{" "}
            {PORTLAND_RESTAURANTS.length} restaurants, {PORTLAND_HUBS.length}{" "}
            community hubs. Live right now: {openOrders.length} open{" "}
            {openOrders.length === 1 ? "delivery" : "deliveries"},{" "}
            {unclaimed.length} unclaimed {unclaimed.length === 1 ? "need" : "needs"}
            {urgent.length > 0 && ` (${urgent.length} urgent)`}.
          </p>
        </div>

        <div className="field">
          <label>View as</label>
          <div className="rest-pick">
            <button
              aria-pressed={view === "customer"}
              onClick={() => setView("customer")}
            >
              Customer
            </button>
            <button
              aria-pressed={view === "driver"}
              onClick={() => setView("driver")}
            >
              Driver
            </button>
          </div>
        </div>

        <div className="map-shell" ref={divRef} />

        {view === "customer" ? (
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
            {"  "}
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
            Community hub
          </p>
        ) : (
          <p>
            <span
              style={{
                display: "inline-block",
                width: "0.8rem",
                height: "0.8rem",
                borderRadius: "50%",
                background: "#b0502a",
                marginRight: "0.4rem",
              }}
            />
            Pickup ({openOrders.length} open)
            {"  "}
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
            Drop-off demand ({unclaimed.length} unclaimed
            {urgent.length > 0 && `, ${urgent.length} urgent`})
          </p>
        )}

        {view === "customer" ? (
          <>
            <h2>Restaurants ({PORTLAND_RESTAURANTS.length})</h2>
            {PORTLAND_RESTAURANTS.map((r) => (
              <div className="order-card" key={r.id}>
                <p style={{ marginTop: 0 }}>
                  <strong>{r.name}</strong> — {r.cuisine} · {r.neighborhood}{" "}
                  <span
                    className={r.openNow ? "badge badge-ai" : "badge badge-local"}
                  >
                    {r.openNow ? "open now" : "closed"}
                  </span>
                </p>
                <p style={{ marginBottom: 0 }}>
                  <em>{r.hoursLabel}.</em>
                </p>
              </div>
            ))}
            <h2>Community hubs ({PORTLAND_HUBS.length})</h2>
            {PORTLAND_HUBS.map((h) => (
              <div className="order-card" key={h.id}>
                <p style={{ marginTop: 0 }}>
                  <strong>{h.name}</strong> — {h.services.join(" · ")} ·{" "}
                  {h.neighborhood}{" "}
                  <span
                    className={h.openNow ? "badge badge-ai" : "badge badge-local"}
                  >
                    {h.openNow ? "open now" : "closed"}
                  </span>
                </p>
                <p style={{ marginBottom: 0 }}>
                  {h.blurb} <em>{h.hoursLabel}.</em>
                </p>
              </div>
            ))}
          </>
        ) : (
          <>
            <h2>Open deliveries ({openOrders.length})</h2>
            {openOrders.length === 0 && (
              <p>No open deliveries right now — check back soon.</p>
            )}
            {openOrders.map((o) => (
              <div className="order-card" key={o.id}>
                <p style={{ margin: 0 }}>
                  <strong>{o.id}</strong> — {o.restaurantName} → {o.address}{" "}
                  <span className="status-pill status-accepted">{o.status}</span>{" "}
                  ${o.total.toFixed(2)}
                </p>
              </div>
            ))}
            <h2>Demand: unclaimed needs ({unclaimed.length})</h2>
            {unclaimed.length === 0 && <p>Nothing unclaimed — the board is clear.</p>}
            {[...unclaimed]
              .sort((a, b) => Number(b.urgent) - Number(a.urgent))
              .map((n) => (
                <div className="order-card" key={n.id}>
                  <p style={{ margin: 0 }}>
                    {n.urgent && <span className="badge badge-ai">urgent</span>}{" "}
                    <strong>{n.title}</strong>
                  </p>
                </div>
              ))}
          </>
        )}

        <p style={{ paddingBottom: "3rem" }}>
          <Link href="/">← Back to Strongo home</Link>
        </p>
      </main>
    </>
  );
}
