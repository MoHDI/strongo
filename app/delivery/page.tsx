"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface MenuItem {
  id: string;
  name: string;
  price: number;
}

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  menu: MenuItem[];
}

interface Suggestion {
  reply: string;
  source: "ai" | "local";
  restaurantId: string | null;
  items: Array<{ name: string; qty: number }>;
  driverId: string | null;
  model: string | null;
  latencyMs: number;
}

export default function DeliveryPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restId, setRestId] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [address, setAddress] = useState("");
  const [ask, setAsk] = useState("");
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [asking, setAsking] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState<{ id: string; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiLive, setAiLive] = useState<boolean | null>(null);
  const [runs, setRuns] = useState<
    Array<{
      restaurantId: string;
      restaurantName: string;
      orderCount: number;
      etaMinutes: number;
      window: string;
      driverName: string;
      vehicle: { type: string; capacity: number };
    }>
  >([]);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => {
        setRestaurants(d.restaurants ?? []);
        setRestId(d.restaurants?.[0]?.id ?? "");
      })
      .catch(() => setError("Could not load restaurants."));
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setAiLive(!!d.ai))
      .catch(() => setAiLive(false));
    const loadRuns = () =>
      fetch("/api/runs")
        .then((r) => r.json())
        .then((d) => setRuns(d.runs ?? []))
        .catch(() => setRuns([]));
    loadRuns();
    const timer = setInterval(loadRuns, 10000);
    return () => clearInterval(timer);
  }, []);

  const restaurant = restaurants.find((r) => r.id === restId) ?? null;
  const priceOf = (name: string) =>
    restaurant?.menu.find((m) => m.name === name)?.price ?? 0;
  const cartEntries = Object.entries(cart).filter(([, q]) => q > 0);
  const total = cartEntries.reduce((sum, [name, q]) => sum + priceOf(name) * q, 0);

  async function handleAsk() {
    if (!ask.trim()) return;
    setAsking(true);
    setError(null);
    try {
      const res = await fetch("/api/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: ask }),
      });
      setSuggestion((await res.json()) as Suggestion);
    } catch {
      setError("Dispatcher unreachable.");
    } finally {
      setAsking(false);
    }
  }

  function useSuggestion() {
    if (!suggestion?.restaurantId) return;
    setRestId(suggestion.restaurantId);
    const next: Record<string, number> = {};
    for (const item of suggestion.items) {
      next[item.name] = (next[item.name] ?? 0) + item.qty;
    }
    setCart(next);
  }

  function bump(name: string, delta: number) {
    setCart((prev) => ({ ...prev, [name]: Math.max(0, (prev[name] ?? 0) + delta) }));
  }

  async function placeOrder() {
    if (!restaurant || cartEntries.length === 0 || address.trim().length < 3) {
      setError("Pick at least one item and add a delivery address.");
      return;
    }
    setPlacing(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          items: cartEntries.map(([name, qty]) => ({ name, price: priceOf(name), qty })),
          address: address.trim(),
        }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { order: { id: string; total: number } };
      setPlaced({ id: data.order.id, total: data.order.total });
      setCart({});
    } catch {
      setError("Could not place the order.");
    } finally {
      setPlacing(false);
    }
  }

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
          <div className="demo-head">
            <h1>Order dinner</h1>
            {aiLive === null ? null : aiLive ? (
              <span className="badge badge-ai">AI dispatcher live</span>
            ) : (
              <span className="badge badge-local">Local mode — add MODEL_API_KEY for AI</span>
            )}
          </div>
          <p>
            Ask for what you want in plain words, or build the order yourself.
            Restaurants keep 100% of the menu price either way.
          </p>
        </div>

        <div className="field">
          <label htmlFor="ask">Ask the dispatcher</label>
          <input
            id="ask"
            className="input"
            value={ask}
            onChange={(e) => setAsk(e.target.value)}
            placeholder="Feed my family of 4 for under $40"
          />
          <div className="btn-row">
            <button className="btn" onClick={handleAsk} disabled={asking}>
              {asking ? "Thinking…" : "Suggest"}
            </button>
          </div>
        </div>

        {suggestion && (
          <div className="notice">
            <p style={{ marginTop: 0 }}>{suggestion.reply}</p>
            <div className="btn-row">
              <span
                className={
                  suggestion.source === "ai" ? "badge badge-ai" : "badge badge-local"
                }
              >
                {suggestion.source === "ai"
                  ? `${suggestion.model ?? "Muse Spark"} · ${suggestion.latencyMs}ms`
                  : `Local fallback · ${suggestion.latencyMs}ms`}
              </span>
              {suggestion.restaurantId && (
                <button className="btn" onClick={useSuggestion}>
                  Use this suggestion
                </button>
              )}
            </div>
          </div>
        )}

        {runs.length > 0 && (
          <div>
            <h2>Neighbors are ordering — join a run</h2>
            <p>
              Same restaurant, same driver, one trip. Ordering into a run
              keeps the batch together and the ETA honest.
            </p>
            {runs.map((run) => (
              <div className="order-card" key={run.restaurantId}>
                <p style={{ marginTop: 0 }}>
                  <strong>{run.restaurantName}</strong> · {run.orderCount}{" "}
                  neighbor{run.orderCount === 1 ? "" : "s"} · ~{run.etaMinutes}{" "}
                  min · {run.window}
                </p>
                <p>
                  Driver: {run.driverName} ({run.vehicle.type}, holds{" "}
                  {run.vehicle.capacity} orders)
                </p>
                <div className="btn-row">
                  <button
                    className="btn"
                    onClick={() => {
                      setRestId(run.restaurantId);
                      setCart({});
                    }}
                  >
                    Order into this run
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="field">
          <label>Restaurant</label>
          <div className="rest-pick">
            {restaurants.map((r) => (
              <button
                key={r.id}
                aria-pressed={r.id === restId}
                onClick={() => {
                  setRestId(r.id);
                  setCart({});
                }}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>

        {restaurant && (
          <div>
            {restaurant.menu.map((item) => (
              <div className="menu-row" key={item.id}>
                <span>
                  {item.name} — ${item.price}
                </span>
                <span className="qty">
                  <button onClick={() => bump(item.name, -1)} aria-label={`Remove ${item.name}`}>
                    −
                  </button>
                  <span>{cart[item.name] ?? 0}</span>
                  <button onClick={() => bump(item.name, 1)} aria-label={`Add ${item.name}`}>
                    +
                  </button>
                </span>
                <span>${((cart[item.name] ?? 0) * item.price).toFixed(0)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="cart-box">
          <strong>Total: ${total.toFixed(2)}</strong>
          <div className="field">
            <label htmlFor="address">Delivery address</label>
            <input
              id="address"
              className="input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Maple St, Apt 4"
            />
          </div>
          <div className="btn-row">
            <button className="btn" onClick={placeOrder} disabled={placing}>
              {placing ? "Placing…" : "Place order"}
            </button>
          </div>
        </div>

        {placed && (
          <div className="notice">
            <p style={{ margin: 0 }}>
              Order <strong>{placed.id}</strong> placed — ${placed.total.toFixed(2)}.
              Watch it move on <Link href="/dispatch">Dispatch</Link> and see
              where every dollar goes on <Link href="/transparency">Transparency</Link>.
            </p>
          </div>
        )}

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
