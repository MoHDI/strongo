import Link from "next/link";

const DOCS = [
  {
    slug: "needs",
    title: "Community needs",
    summary:
      "What needs assessments say neighbors need most, and how Strongo maps a service to each need.",
  },
  {
    slug: "food-delivery",
    title: "Food delivery, without the cut",
    summary:
      "The fee problem, working co-op and mutual-aid models, and the Strongo approach.",
  },
  {
    slug: "roadmap",
    title: "Roadmap",
    summary:
      "Phases, priorities, success criteria, and what comes after food.",
  },
];

export default function ResearchIndex() {
  return (
    <>
      <header className="site-header">
        <div className="wrap">
          <Link href="/" className="wordmark">
            Strongo
          </Link>
          <nav className="site-nav">
            <Link href="/research">Research</Link>
            <Link href="/research/roadmap">Roadmap</Link>
            <a href="https://github.com/MoHDI/strongo">GitHub</a>
          </nav>
        </div>
      </header>

      <main className="wrap">
        <div className="prose">
          <Link href="/" className="back-link">
            ← Home
          </Link>
          <h1>Research</h1>
          <p>
            Everything Strongo builds starts here. These docs are the current
            picture of what communities need and how a community-run service
            can meet those needs. They live as Markdown in{" "}
            <code>docs/</code> and render here automatically.
          </p>
        </div>

        <div className="doc-links" style={{ paddingBottom: "4rem" }}>
          {DOCS.map((doc) => (
            <Link key={doc.slug} href={`/research/${doc.slug}`}>
              <strong>{doc.title}</strong>
              <span>{doc.summary}</span>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
