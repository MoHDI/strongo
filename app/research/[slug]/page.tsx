import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { readFile } from "fs/promises";
import path from "path";
import Markdown from "react-markdown";

const SLUGS = ["needs", "food-delivery", "roadmap"] as const;
type Slug = (typeof SLUGS)[number];

const TITLES: Record<Slug, string> = {
  needs: "Community needs",
  "food-delivery": "Food delivery, without the cut",
  roadmap: "Roadmap",
};

function isSlug(value: string): value is Slug {
  return (SLUGS as readonly string[]).includes(value);
}

export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const title = isSlug(params.slug)
    ? `${TITLES[params.slug]} — Strongo`
    : "Research — Strongo";
  return { title };
}

export default async function DocPage({
  params,
}: {
  params: { slug: string };
}) {
  if (!isSlug(params.slug)) {
    notFound();
  }

  const filePath = path.join(process.cwd(), "docs", `${params.slug}.md`);
  const content = await readFile(filePath, "utf8").catch(() => null);
  if (content === null) {
    notFound();
  }

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
          <Link href="/research" className="back-link">
            ← Research
          </Link>
          <Markdown>{content}</Markdown>
        </div>
      </main>
    </>
  );
}
