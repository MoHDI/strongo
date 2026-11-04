"use client";

import Link from "next/link";
import { useState } from "react";

interface FridgeItem {
  name: string;
  category: string;
  count: number;
}

export default function FridgePage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [lowOn, setLowOn] = useState<string[]>([]);
  const [meta, setMeta] = useState<{ model: string; latencyMs: number } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setPosted(false);
    setItems([]);
    setLowOn([]);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function scan() {
    if (!preview) return;
    setScanning(true);
    setError(null);
    setItems([]);
    setLowOn([]);
    try {
      const res = await fetch("/api/fridge-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: preview }),
      });
      const data = (await res.json()) as {
        items?: FridgeItem[];
        lowOn?: string[];
        model?: string;
        latencyMs?: number;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Scan failed.");
      setItems(data.items ?? []);
      setLowOn(data.lowOn ?? []);
      setMeta({ model: data.model ?? "Muse", latencyMs: data.latencyMs ?? 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed.");
    } finally {
      setScanning(false);
    }
  }

  async function postToBoard() {
    if (name.trim().length < 2 || location.trim().length < 2) {
      setError("Add your name and the fridge location first.");
      return;
    }
    setPosting(true);
    setError(null);
    try {
      const has =
        items.map((i) => `${i.count}× ${i.name}`).join(", ") || "nothing visible";
      const res = await fetch("/api/needs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Fridge restock at ${location.trim()}`,
          detail: `Has: ${has}. Low on: ${lowOn.length > 0 ? lowOn.join(", ") : "nothing"}.`,
          name: name.trim(),
          urgent: lowOn.length >= 2,
        }),
      });
      if (!res.ok) throw new Error("Could not post.");
      setPosted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not post.");
    } finally {
      setPosting(false);
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
            <Link href="/menu-scan">Menu scan</Link>
            <Link href="/dispatch">Dispatch</Link>
            <Link href="/transparency">Transparency</Link>
            <Link href="/fridge">Fridge</Link>
            <Link href="/labs">Labs</Link>
          </nav>
        </div>
      </header>

      <main className="wrap">
        <div className="prose">
          <h1>Fridge check</h1>
          <p>
            Photograph a community fridge to inventory it — items, rough
            counts, and which staples are running low. Inventory only: it
            never judges food safety.
          </p>
        </div>

        <div className="field">
          <label htmlFor="fridge-photo">Fridge photo</label>
          <input
            id="fridge-photo"
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
              alt="Fridge photo preview"
              style={{ maxWidth: "24rem", borderRadius: "8px" }}
            />
            <div className="btn-row">
              <button className="btn" onClick={scan} disabled={scanning}>
                {scanning ? "Reading fridge…" : "Scan fridge"}
              </button>
              {meta && items.length > 0 && (
                <span className="badge badge-ai">
                  {meta.model} · {meta.latencyMs}ms
                </span>
              )}
            </div>
          </div>
        )}

        {items.length > 0 && (
          <div className="order-card">
            <p style={{ marginTop: 0 }}>
              <strong>Inventory</strong>
            </p>
            <table className="money-table">
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td>
                      {item.name}{" "}
                      <span className="status-pill">{item.category}</span>
                    </td>
                    <td>×{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {lowOn.length > 0 && (
              <p>
                Low on:{" "}
                {lowOn.map((c) => (
                  <span key={c} className="badge badge-local" style={{ marginRight: "0.4rem" }}>
                    {c}
                  </span>
                ))}
              </p>
            )}

            <div className="field">
              <label htmlFor="fridge-name">Your name</label>
              <input
                id="fridge-name"
                className="input"
                style={{ maxWidth: "16rem" }}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rosa"
              />
            </div>
            <div className="field">
              <label htmlFor="fridge-location">Fridge location</label>
              <input
                id="fridge-location"
                className="input"
                style={{ maxWidth: "16rem" }}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Pearl Community Fridge"
              />
            </div>
            <div className="btn-row">
              <button className="btn" onClick={postToBoard} disabled={posting}>
                {posting ? "Posting…" : "Post to need board"}
              </button>
            </div>
          </div>
        )}

        {posted && (
          <div className="notice">
            <p style={{ margin: 0 }}>
              Posted. See it on the <Link href="/hubs">night board</Link>.
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
