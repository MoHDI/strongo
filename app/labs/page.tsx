import Link from "next/link";

const LABS = [
  {
    href: "/garden",
    name: "Garden planner",
    note: "Address to crop plan: zone, yield, hours, tools, and a coach.",
  },
  {
    href: "/hubs",
    name: "Hubs + night board",
    note: "Service directory plus a 24/7 help board that never closes.",
  },
  {
    href: "/simulate",
    name: "Simulators",
    note: "Livestock rotations and dog corridors, with the math shown.",
  },
  {
    href: "/lab",
    name: "Map lab",
    note: "Overlay playground: demand heat, coverage zones, earnings.",
  },
  {
    href: "/plotter",
    name: "Garden plotter",
    note: "Drag crops onto a sun-mapped bed and watch yield update.",
  },
  {
    href: "/pilot",
    name: "Portland pilot",
    note: "Customer and driver views of a live pilot map.",
  },
];

export default function LabsPage() {
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
            <Link href="/labs">Labs</Link>
          </nav>
        </div>
      </header>

      <main className="wrap">
        <div className="prose">
          <h1>Labs</h1>
          <p>
            Experiments beyond the delivery loop. Each one explores a hub
            Strongo could grow into — try them, break them, tell us what
            should graduate.
          </p>
        </div>

        <div className="doc-links" style={{ paddingBottom: "2rem" }}>
          {LABS.map((lab) => (
            <Link key={lab.href} href={lab.href}>
              <strong>{lab.name}</strong>
              <span>{lab.note}</span>
            </Link>
          ))}
        </div>

        <p style={{ paddingBottom: "3rem" }}>
          <Link href="/">← Back to Strongo home</Link>
        </p>
      </main>
    </>
  );
}
