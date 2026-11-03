"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface Order {
  id: string;
  restaurantName: string;
  items: Array<{ name: string; price: number; qty: number }>;
  total: number;
  address: string;
  status: "open" | "accepted" | "picked-up" | "delivered";
  driverId: string | null;
  driverName: string | null;
}

interface Driver {
  id: string;
  name: string;
}

const NEXT: Record<string, { status: "picked-up" | "delivered"; label: string }> = {
  accepted: { status: "picked-up", label: "Mark picked up" },
  "picked-up": { status: "delivered", label: "Mark delivered" },
};

export default function DispatchPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [me, setMe] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [runs, setRuns] = useState<
    Array<{
      restaurantId: string;
      restaurantName: string;
      orderCount: number;
      etaMinutes: number;
      window: string;
      combinedTotal: number;
      items: Array<{ name: string; qty: number }>;
    }>
  >([]);

  const refresh = useCallback(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => {
        setOrders(d.orders ?? []);
        setDrivers(d.drivers ?? []);
        setMe((prev) => prev || d.drivers?.[0]?.id || "");
      })
      .catch(() => setError("Could not load dispatch board."));
    fetch("/api/runs")
      .then((r) => r.json())
      .then((d) => setRuns(d.runs ?? []))
      .catch(() => setRuns([]));
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, [refresh]);

  async function patch(id: string, body: object) {
    setError(null);
    const res = await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    if (!res.ok) setError("Update failed.");
    refresh();
  }

  const open = orders.filter((o) => o.status === "open");
  const mine = orders.filter((o) => o.driverId === me && o.status !== "delivered");
  const done = orders.filter((o) => o.status === "delivered");

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
          <h1>Dispatch</h1>
          <p>
            Open deliveries, claimed in the open. Stipends are fixed and
            published — no algorithmic pay cuts.
          </p>
        </div>

        <div className="field">
          <label>Driving as</label>
          <div className="rest-pick">
            {drivers.map((d) => (
              <button
                key={d.id}
                aria-pressed={d.id === me}
                onClick={() => setMe(d.id)}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>

        <h2>Suggested runs ({runs.length})</h2>
        <p>
          One driver takes the whole batch — the kitchen cooks one ticket
          and the run makes one loop.
        </p>
        {runs.map((run) => (
          <div className="order-card" key={run.restaurantId}>
            <p style={{ marginTop: 0 }}>
              <strong>{run.restaurantName}</strong> · {run.orderCount} orders ·
              ${run.combinedTotal.toFixed(2)} · ~{run.etaMinutes} min ·{" "}
              {run.window}
            </p>
            <p>{run.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}</p>
            <div className="btn-row">
              <button
                className="btn"
                disabled={!me}
                onClick={async () => {
                  await fetch("/api/runs", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      restaurantId: run.restaurantId,
                      driverId: me,
                      status: "accepted",
                    }),
                  });
                  refresh();
                }}
              >
                Claim run ({run.orderCount} orders)
              </button>
            </div>
          </div>
        ))}

        <h2>Open deliveries ({open.length})</h2>
        {open.length === 0 && <p>No open orders. Place one from Order.</p>}
        {open.map((o) => (
          <div className="order-card" key={o.id}>
            <p style={{ marginTop: 0 }}>
              <strong>{o.id}</strong> · {o.restaurantName} → {o.address}
            </p>
            <p>
              {o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")} — $
              {o.total.toFixed(2)}
            </p>
            <div className="btn-row">
              <span className="status-pill status-open">open</span>
              <button
                className="btn"
                onClick={() => patch(o.id, { status: "accepted", driverId: me })}
                disabled={!me}
              >
                Accept delivery
              </button>
            </div>
          </div>
        ))}

        <h2>My active deliveries ({mine.length})</h2>
        {mine.map((o) => {
          const next = NEXT[o.status];
          return (
            <div className="order-card" key={o.id}>
              <p style={{ marginTop: 0 }}>
                <strong>{o.id}</strong> · {o.restaurantName} → {o.address}
              </p>
              <div className="btn-row">
                <span className={`status-pill status-${o.status}`}>{o.status}</span>
                {next && (
                  <button className="btn" onClick={() => patch(o.id, { status: next.status })}>
                    {next.label}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        <h2>Delivered ({done.length})</h2>
        {done.map((o) => (
          <div className="order-card" key={o.id}>
            <p style={{ margin: 0 }}>
              <strong>{o.id}</strong> · {o.restaurantName} → {o.address} · $
              {o.total.toFixed(2)} · by {o.driverName}{" "}
              <span className="status-pill status-delivered">delivered</span>
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
