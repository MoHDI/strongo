"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function MapPage() {
  const divRef = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cleanup: (() => void) | null = null;
    let cancelled = false;

    (async () => {
      const data = await fetch("/api/orders")
        .then((r) => r.json())
        .catch(() => null);
      if (cancelled || !data || !divRef.current) return;

      const L = (await import("leaflet")).default;
      if (cancelled || !divRef.current) return;

      const map = L.map(divRef.current).setView([30.268, -97.7452], 15);
      cleanup = () => map.remove();

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      let n = 0;
      for (const r of (data.restaurants ?? []) as Array<{
        name: string;
        cuisine: string;
        lat: number;
        lng: number;
      }>) {
        L.circleMarker([r.lat, r.lng], {
          radius: 9,
          color: "#1e4d3a",
          fillColor: "#1e4d3a",
          fillOpacity: 0.85,
        })
          .addTo(map)
          .bindPopup(`<strong>${r.name}</strong><br>${r.cuisine}`);
        n++;
      }
      for (const d of (data.drivers ?? []) as Array<{
        name: string;
        lat: number;
        lng: number;
      }>) {
        L.circleMarker([d.lat, d.lng], {
          radius: 7,
          color: "#b0502a",
          fillColor: "#b0502a",
          fillOpacity: 0.9,
        })
          .addTo(map)
          .bindPopup(`<strong>${d.name}</strong> (driver)`);
        n++;
      }
      setCount(n);
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <>
      <header className="site-header">
        <div className="wrap">
          <Link href="/" className="wordmark">
            Strongo
          </Link>
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
        </div>
      </header>

      <main className="wrap">
        <div className="prose">
          <h1>Maplewood pilot map</h1>
          <p>
            Partner restaurants and active drivers in the pilot neighborhood.
            {count !== null && ` Showing ${count} markers.`}
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
          {"  "}
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
        </p>

        <p style={{ paddingBottom: "3rem" }}>
          <Link href="/">← Back to Strongo home</Link>
        </p>
      </main>
    </>
  );
}
