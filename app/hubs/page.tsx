"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  HUBS,
  SERVICE_LABELS,
  isOpenNow,
  type HubService,
} from "@/lib/hubs";

const SERVICE_COLORS: Record<HubService, string> = {
  food: "#1e4d3a",
  meals: "#b0502a",
  tools: "#6b5b3e",
  pickup: "#5a78b0",
  driver: "#2a7f6f",
  yard: "#4d7c2a",
  repair: "#946b2d",
  rides: "#2f6f9f",
  garden: "#3e9e4d",
  childcare: "#c07f2a",
  aid: "#a03e3e",
};

interface Need {
  id: string;
  title: string;
  detail: string;
  name: string;
  urgent: boolean;
  claimedBy: string | null;
}

const NAV = (
  <nav className="site-nav">
    <Link href="/delivery">Order</Link>
    <Link href="/dispatch">Dispatch</Link>
    <Link href="/transparency">Transparency</Link>
    <Link href="/map">Map</Link>
    <Link href="/menu-scan">Menu scan</Link>
    <Link href="/garden">Garden</Link>
    <Link href="/hubs">Hubs</Link>
    <Link href="/simulate">Simulate</Link>
    <Link href="/pilot">Pilot</Link>
    <Link href="/lab">Lab</Link>
    <Link href="/plotter">Plotter</Link>
  </nav>
);

export default function HubsPage() {
  const divRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<{ clearLayers: () => void } | null>(null);
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState<"all" | HubService>("all");
  const [openOnly, setOpenOnly] = useState(false);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [name, setName] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [volunteer, setVolunteer] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cleanup: (() => void) | null = null;
    let cancelled = false;
    (async () => {
      if (!divRef.current) return;
      const L = (await import("leaflet")).default;
      if (cancelled || !divRef.current) return;
      const map = L.map(divRef.current).setView([30.268, -97.7455], 15);
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
      for (const hub of HUBS) {
        if (filter !== "all" && !hub.services.includes(filter)) continue;
        if (openOnly && !isOpenNow(hub)) continue;
        const color = SERVICE_COLORS[hub.services[0]];
        const marker = L.circleMarker([hub.lat, hub.lng], {
          radius: 9,
          color,
          fillColor: color,
          fillOpacity: 0.85,
        });
        marker.bindPopup(
          `<strong>${hub.name}</strong><br>${hub.services.map((s) => SERVICE_LABELS[s]).join(" · ")}<br>${hub.hours.label} — ${isOpenNow(hub) ? "open now" : "closed"}`
        );
        layer.addLayer(marker);
      }
    })();
  }, [ready, filter, openOnly]);

  async function refresh() {
    const data = await fetch("/api/needs")
      .then((r) => r.json())
      .catch(() => null);
    setNeeds(data?.needs ?? []);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function post() {
    setError(null);
    const res = await fetch("/api/needs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, detail, name, urgent }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Could not post.");
      return;
    }
    setTitle("");
    setDetail("");
    setUrgent(false);
    refresh();
  }

  async function claim(id: string) {
    if (volunteer.trim().length < 2) {
      setError("Enter your name above to claim a need.");
      return;
    }
    setError(null);
    const res = await fetch("/api/needs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, volunteer }),
    });
    if (!res.ok) setError("Already claimed — refresh to see the latest.");
    refresh();
  }

  const shown = HUBS.filter(
    (h) =>
      (filter === "all" || h.services.includes(filter)) && (!openOnly || isOpenNow(h))
  );
  const open = needs.filter((n) => !n.claimedBy);
  const claimed = needs.filter((n) => n.claimedBy);

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
          <h1>Community hubs</h1>
          <p>
            Every track in one map: food, tools, rides, yard work, repairs,
            childcare, and aid. Green-dot neighbors host sheds, porches, and
            fridges — including two that never close.
          </p>
        </div>

        <div className="map-shell" ref={divRef} />

        <div className="field">
          <label>Show</label>
          <div className="rest-pick">
            <button aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
              Everything
            </button>
            {(Object.keys(SERVICE_LABELS) as HubService[]).map((s) => (
              <button key={s} aria-pressed={filter === s} onClick={() => setFilter(s)}>
                {SERVICE_LABELS[s]}
              </button>
            ))}
          </div>
          <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              type="checkbox"
              checked={openOnly}
              onChange={(e) => setOpenOnly(e.target.checked)}
            />
            Open now only
          </label>
        </div>

        <h2>Directory ({shown.length})</h2>
        {shown.map((h) => (
          <div className="order-card" key={h.id}>
            <p style={{ marginTop: 0 }}>
              <strong>{h.name}</strong>{" "}
              <span className={isOpenNow(h) ? "badge badge-ai" : "badge badge-local"}>
                {isOpenNow(h) ? "open now" : "closed"}
              </span>
            </p>
            <p style={{ marginBottom: 0 }}>
              {h.blurb} <em>{h.hours.label}.</em>
            </p>
          </div>
        ))}

        <h2>Night board — help any time, day or night</h2>
        <p>
          Stores close; neighbors don&apos;t have to. Post a need below and any
          volunteer can claim it. Urgent posts jump to the top.
        </p>

        <div className="field">
          <label htmlFor="need-title">What do you need?</label>
          <input
            id="need-title"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ride to the clinic Tuesday"
          />
        </div>
        <div className="field">
          <label htmlFor="need-detail">Details</label>
          <input
            id="need-detail"
            className="input"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="Morning appointment, folding wheelchair"
          />
        </div>
        <div className="field">
          <label htmlFor="need-name">Your name</label>
          <input
            id="need-name"
            className="input"
            style={{ maxWidth: "16rem" }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Mrs. Okafor"
          />
        </div>
        <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            type="checkbox"
            checked={urgent}
            onChange={(e) => setUrgent(e.target.checked)}
          />
          Urgent — needed within 24 hours
        </label>
        <div className="btn-row">
          <button className="btn" onClick={post}>
            Post need
          </button>
          <button className="btn" onClick={refresh}>
            Refresh
          </button>
        </div>

        <div className="field">
          <label htmlFor="volunteer">Volunteering as (to claim needs)</label>
          <input
            id="volunteer"
            className="input"
            style={{ maxWidth: "16rem" }}
            value={volunteer}
            onChange={(e) => setVolunteer(e.target.value)}
            placeholder="Your name"
          />
        </div>

        <h3>Open ({open.length})</h3>
        {[...open].sort((a, b) => Number(b.urgent) - Number(a.urgent)).map((n) => (
          <div className="order-card" key={n.id}>
            <p style={{ marginTop: 0 }}>
              {n.urgent && <span className="badge badge-ai">urgent</span>} <strong>{n.title}</strong>
            </p>
            <p>
              {n.detail} — {n.name}
            </p>
            <div className="btn-row">
              <button className="btn" onClick={() => claim(n.id)}>
                Claim this
              </button>
            </div>
          </div>
        ))}

        <h3>Claimed ({claimed.length})</h3>
        {claimed.map((n) => (
          <div className="order-card" key={n.id}>
            <p style={{ margin: 0 }}>
              <strong>{n.title}</strong> — {n.name}, claimed by {n.claimedBy}{" "}
              <span className="status-pill status-delivered">claimed</span>
            </p>
          </div>
        ))}

        {error && (
          <div className="notice">
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        )}

        <p style={{ paddingBottom: "3rem" }}>
          <Link href="/">← Back to Strongo home</Link>
        </p>
      </main>
    </>
  );
}
