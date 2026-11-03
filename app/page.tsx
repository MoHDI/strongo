import Link from "next/link";

const DEMOS = [
  { href: "/delivery", name: "Order", note: "Ask in plain words, build a cart, place an order." },
  { href: "/menu-scan", name: "Menu scan", note: "Turn a menu photo into structured items." },
  { href: "/dispatch", name: "Dispatch", note: "Accept orders and move them to delivered." },
  { href: "/transparency", name: "Transparency", note: "See where every dollar of an order goes." },
  { href: "/labs", name: "Labs", note: "Garden, hubs, sims, maps, and pilots in progress." },
];

export default function Home() {
  return (
    <>
      <header className="site-header">
        <div className="wrap">
          <Link href="/" className="wordmark">
            Strongo
          </Link>
          <nav className="site-nav">
            <Link href="/delivery">Live demo</Link>
            <Link href="/research">Research</Link>
            <Link href="/research/roadmap">Roadmap</Link>
            <a href="https://github.com/MoHDI/strongo">GitHub</a>
          </nav>
        </div>
      </header>

      <main>
        <div className="wrap">
          <div className="hero">
            <div className="hero-copy">
              <p className="kicker">A community-run alternative</p>
              <h1>Neighbors feeding neighbors.</h1>
              <p className="lede">
                Strongo is a community-run resource for neighborhood needs. We
                start with food delivery owned by the community, not by an app
                taking 30% off the top, and grow from there.
              </p>
              <div className="hero-actions">
                <Link href="/delivery" className="btn">
                  Try the live demo
                </Link>
                <Link href="/research" className="text-link">
                  Read the research
                </Link>
              </div>
              <p className="hero-note">
                New here? The <Link href="/research/roadmap">roadmap</Link> shows
                where this goes after food.
              </p>
            </div>
            <aside className="order-card hero-receipt" aria-label="Example order receipt">
              <p className="receipt-title">Tonight&apos;s order</p>
              <div className="receipt-row">
                <span>Family meal from Rosa&apos;s Kitchen</span>
                <span>$32.00</span>
              </div>
              <div className="receipt-row">
                <span>To Rosa&apos;s Kitchen</span>
                <span>$32.00</span>
              </div>
              <div className="receipt-row">
                <span>To the driver (stipend + tip)</span>
                <span>$8.50</span>
              </div>
              <div className="receipt-row">
                <span>Strongo commission</span>
                <span>$0.00</span>
              </div>
              <div className="receipt-total">
                <span>Stays in the neighborhood</span>
                <span>$40.50</span>
              </div>
              <p className="receipt-note">
                Audited in the open on <Link href="/transparency">Transparency</Link>.
              </p>
            </aside>
          </div>
        </div>

        <div className="stats">
          <div className="wrap">
            <div>
              <span className="stat-num">15–30%</span>
              <span className="stat-label">
                of every order goes to delivery apps in commissions
              </span>
            </div>
            <div>
              <span className="stat-num">59%</span>
              <span className="stat-label">
                of neighbors cite food insecurity in needs surveys
              </span>
            </div>
            <div>
              <span className="stat-num">0%</span>
              <span className="stat-label">
                is Strongo&apos;s target take rate — surplus stays local
              </span>
            </div>
          </div>
        </div>

        <div className="wrap">
          <section className="block">
            <h2>Why start with food</h2>
            <p>
              Food is the need people feel most often, and delivery apps have
              made it expensive for everyone except themselves. Restaurants pay
              up to 30% per order, drivers net a few dollars an hour after
              costs, and neighbors pay marked-up menus. A community-run service
              can do the same coordination at cost.
            </p>
            <p>
              <Link href="/research/food-delivery">
                How community-run delivery works
              </Link>
            </p>
          </section>

          <section className="block">
            <h2>Hubs of support</h2>
            <p>
              One neighborhood, many services. Live demos work today;
              directory and simulated hubs show where each one is heading.
            </p>
            <ul className="need-rows">
              <li>
                <span className="need-name">
                  <Link href="/delivery">Food delivery</Link>
                </span>
                <span>
                  Order in plain words, join neighbor runs, drivers claim
                  work in the open.
                </span>
                <span className="need-status">Live demo</span>
              </li>
              <li>
                <span className="need-name">
                  <Link href="/pilot">Pilot map</Link>
                </span>
                <span>
                  Customer and driver views of the Portland pilot, with live
                  demand counts.
                </span>
                <span className="need-status">Live demo</span>
              </li>
              <li>
                <span className="need-name">
                  <Link href="/garden">Garden planner</Link>
                </span>
                <span>
                  Address to crop plan: zone, yield, hours, tools, and a
                  coach.
                </span>
                <span className="need-status">Live demo</span>
              </li>
              <li>
                <span className="need-name">
                  <Link href="/plotter">Garden plotter</Link>
                </span>
                <span>
                  Drag crops onto a sun-mapped bed and watch yield update.
                </span>
                <span className="need-status">Live demo</span>
              </li>
              <li>
                <span className="need-name">
                  <Link href="/hubs">Night board</Link>
                </span>
                <span>
                  Post a need any hour; volunteers claim it by name.
                </span>
                <span className="need-status">Live demo</span>
              </li>
              <li>
                <span className="need-name">
                  <Link href="/hubs">Tools + repairs</Link>
                </span>
                <span>
                  Tool sheds and fix-it nights, hosted by neighbors.
                </span>
                <span className="need-status">Directory</span>
              </li>
              <li>
                <span className="need-name">
                  <Link href="/hubs">Rides + yard work</Link>
                </span>
                <span>
                  Volunteer rides and Saturday yard crews, stipend-paid.
                </span>
                <span className="need-status">Directory</span>
              </li>
              <li>
                <span className="need-name">
                  <Link href="/hubs">Childcare + aid</Link>
                </span>
                <span>
                  Sitter co-ops and utility-aid navigation desks.
                </span>
                <span className="need-status">Directory</span>
              </li>
              <li>
                <span className="need-name">
                  <Link href="/simulate">Livestock + dog park</Link>
                </span>
                <span>
                  Rotating herds and joined backyards, with the math shown.
                </span>
                <span className="need-status">Simulated</span>
              </li>
              <li>
                <span className="need-name">
                  <Link href="/lab">Map lab</Link>
                </span>
                <span>
                  Overlay playground: demand heat, coverage zones, earnings.
                </span>
                <span className="need-status">Playground</span>
              </li>
            </ul>
            <p>
              <Link href="/research/needs">
                Why these needs — full research and sources
              </Link>
            </p>
          </section>

          <section className="block">
            <h2>How Strongo stays community-run</h2>
            <ol className="steps">
              <li>
                <strong>Neighbors coordinate.</strong> Ordering, dispatch, and
                scheduling run through open tools the community operates.
              </li>
              <li>
                <strong>Drivers keep their pay.</strong> Volunteer drivers earn
                stipends that cover costs and time — no algorithmic pay cuts.
              </li>
              <li>
                <strong>Surplus stays local.</strong> Anything left over funds
                free meals and the next service, decided in the open.
              </li>
            </ol>
          </section>

          <section className="block">
            <h2>Try the working demo</h2>
            <p>
              Four steps, one loop — plus the Labs playground. Start anywhere.
            </p>
            <ul className="demo-list">
              {DEMOS.map((d, i) => (
                <li key={d.href}>
                  <Link href={d.href}>
                    <strong>
                      <span className="demo-num">{String(i + 1).padStart(2, "0")}</span>
                      {d.name}
                    </strong>
                    <span>{d.note}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="block">
            <h2>Start with the docs</h2>
            <p>
              Everything is documented as it is built. These three pages are the
              current picture.
            </p>
            <div className="doc-links">
              <Link href="/research/needs">
                <strong>Community needs</strong>
                <span>
                  What assessments say neighbors need most, and how Strongo
                  maps to each need.
                </span>
              </Link>
              <Link href="/research/food-delivery">
                <strong>Food delivery, without the cut</strong>
                <span>
                  The fee problem, working co-op models, and the Strongo
                  approach.
                </span>
              </Link>
              <Link href="/research/roadmap">
                <strong>Roadmap</strong>
                <span>
                  Phases, priorities, success criteria, and what comes after
                  food.
                </span>
              </Link>
            </div>
          </section>
        </div>
      </main>

      <footer className="site-footer">
        <div className="wrap">
          <span>Strongo — built in the open for the neighborhood.</span>
          <a href="https://github.com/MoHDI/strongo">github.com/MoHDI/strongo</a>
        </div>
      </footer>
    </>
  );
}
