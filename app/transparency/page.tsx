"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Order {
  id: string;
  restaurantName: string;
  total: number;
  status: string;
  driverName: string | null;
}

const DELIVERY_FEE = 3; // flat stipend per delivery, 100% to the driver
const APP_CUT = 0.3; // what a typical delivery app takes from the restaurant

export default function TransparencyPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => setOrders([]));
  }, []);

  const foodTotal = orders.reduce((s, o) => s + o.total, 0);
  const stipends = orders.length * DELIVERY_FEE;
  const savedVsApps = foodTotal * APP_CUT;

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
          <h1>Where every dollar goes</h1>
          <p>
            Open books, updated with every order. Restaurants keep the full
            menu price, drivers keep the full delivery stipend, and Strongo
            takes nothing.
          </p>
        </div>

        <table className="money-table">
          <tbody>
            <tr>
              <td>Orders delivered</td>
              <td>{orders.length}</td>
            </tr>
            <tr>
              <td>Kept by restaurants (100%)</td>
              <td>${foodTotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Earned by drivers (${DELIVERY_FEE}/delivery)</td>
              <td>${stipends.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Taken by Strongo (0%)</td>
              <td>$0.00</td>
            </tr>
            <tr className="total">
              <td>Saved vs 30% delivery apps</td>
              <td>${savedVsApps.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <h2>Per-order breakdown</h2>
        {orders.length === 0 && (
          <p>No orders yet. Place one from Order and watch this page move.</p>
        )}
        {orders.map((o) => (
          <div className="order-card" key={o.id}>
            <p style={{ marginTop: 0 }}>
              <strong>{o.id}</strong> · {o.restaurantName} · ${o.total.toFixed(2)}
              {o.driverName ? ` · delivered by ${o.driverName}` : ` · ${o.status}`}
            </p>
            <table className="money-table">
              <tbody>
                <tr>
                  <td>To restaurant</td>
                  <td>${o.total.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>To driver</td>
                  <td>${DELIVERY_FEE.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>To Strongo</td>
                  <td>$0.00</td>
                </tr>
                <tr className="total">
                  <td>A 30% app would have taken</td>
                  <td>${(o.total * APP_CUT).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}

        <p style={{ paddingBottom: "3rem" }}>
          <Link href="/">← Back to Strongo home</Link>
        </p>
      </main>
    </>
  );
}
