# AGENTS.md — Strongo repo conventions

These instructions apply to every contributor, human or agent. Follow them
so the project stays documented as it grows.

## Documentation workflow (the standing rule)

- **Docs first for research.** New findings go in `docs/` as Markdown
  before or with any code. Each doc ends with a Sources section linking
  every material claim.
- **In-site docs are automatic.** `app/research/[slug]/page.tsx` renders
  `docs/<slug>.md`. To add a doc: write the `.md` file, add the slug and
  title in `[slug]/page.tsx` (`SLUGS` + `TITLES`), and link it from
  `app/research/page.tsx` and the landing page if it matters.
- **Update the roadmap.** Behavior changes, new services, and reversals
  update `docs/roadmap.md`, including the decision log with date and
  reason.
- **Keep README accurate.** Commands, layout, and deploy steps must match
  reality after every change.

## Code conventions

- Next.js App Router, TypeScript strict, server components by default.
- Plain CSS in `app/globals.css`. No Tailwind, no component libraries.
  New styles follow the existing tokens (`--pine`, `--clay`, `--sand`).
- No new npm dependencies without a note in the change description saying
  why.
- Keep pages static-renderable (`generateStaticParams` for dynamic
  routes) so Vercel builds stay simple.

## Verification

- `npm run build` must pass before handing off.
- Fix every TypeScript error in files you touched; don't hand off a red
  build.
- Run the `SECURITY.md` agent checklist before handoff; never print,
  paste, or commit secrets.

## Source control

- Never commit or push unless the user explicitly asks for that exact
  write. Leave work uncommitted for review by default.
