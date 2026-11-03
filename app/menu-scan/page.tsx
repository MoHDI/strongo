"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface ScannedItem {
  name: string;
  price: number;
}

interface Restaurant {
  id: string;
  name: string;
}

export default function MenuScanPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restId, setRestId] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [scanning, setScanning] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => {
        setRestaurants(d.restaurants ?? []);
        setRestId(d.restaurants?.[0]?.id ?? "");
      })
      .catch(() => setRestaurants([]));
  }, []);

  function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setPublished(null);
    setItems([]);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function scan() {
    if (!preview) return;
    setScanning(true);
    setError(null);
    setItems([]);
    try {
      const res = await fetch("/api/menu-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: preview }),
      });
      const data = (await res.json()) as { items?: ScannedItem[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Scan failed.");
      setItems(data.items ?? []);
      if ((data.items ?? []).length === 0) {
        setError("No menu items found in that photo — try a clearer shot.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed.");
    } finally {
      setScanning(false);
    }
  }

  async function publish() {
    if (!restId || items.length === 0) return;
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch("/api/menu-scan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId: restId, items }),
      });
      const data = (await res.json()) as { restaurant?: { name: string }; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Publish failed.");
      setPublished(`${items.length} items published to ${data.restaurant?.name}.`);
      setItems([]);
      setPreview(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publish failed.");
    } finally {
      setPublishing(false);
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
          <h1>Menu scan</h1>
          <p>
            Restaurants join by photographing their paper menu. AI transcribes
            it into a digital menu — no tablets, no tech staff, no onboarding
            fees.
          </p>
        </div>

        <div className="field">
          <label htmlFor="menu-photo">Menu photo</label>
          <input
            id="menu-photo"
            type="file"
            accept="image/*"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </div>

        {preview && (
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Menu photo preview"
              style={{ maxWidth: "24rem", borderRadius: "8px" }}
            />
            <div className="btn-row">
              <button className="btn" onClick={scan} disabled={scanning}>
                {scanning ? "Reading menu…" : "Scan menu"}
              </button>
              <span className="badge badge-ai">Muse vision</span>
            </div>
          </div>
        )}

        {items.length > 0 && (
          <div>
            <h2>Review items</h2>
            {items.map((item, i) => (
              <div className="menu-row" key={i}>
                <input
                  className="input"
                  value={item.name}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((p, j) => (j === i ? { ...p, name: e.target.value } : p))
                    )
                  }
                />
                <input
                  className="input"
                  style={{ maxWidth: "6rem" }}
                  type="number"
                  min="0"
                  step="0.5"
                  value={item.price}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((p, j) =>
                        j === i ? { ...p, price: Number(e.target.value) } : p
                      )
                    )
                  }
                />
                <button
                  className="btn"
                  onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))}
                >
                  Remove
                </button>
              </div>
            ))}

            <div className="field">
              <label>Publish to</label>
              <div className="rest-pick">
                {restaurants.map((r) => (
                  <button
                    key={r.id}
                    aria-pressed={r.id === restId}
                    onClick={() => setRestId(r.id)}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="btn-row">
              <button className="btn" onClick={publish} disabled={publishing}>
                {publishing ? "Publishing…" : "Publish menu"}
              </button>
            </div>
          </div>
        )}

        {published && (
          <div className="notice">
            <p style={{ margin: 0 }}>
              {published} See it live on <Link href="/delivery">Order</Link>.
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
