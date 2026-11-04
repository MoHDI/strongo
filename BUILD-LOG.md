# Strongo build log — Meta Global AI Developer Hackathon

Indie track, theme: Build for Your World. All entries dated; everything
below was built inside the hackathon window (Oct 26 – Nov 4, 2026).

- 2026-11-01: Linked repo to github.com/MoHDI/strongo. Scaffolded Next.js
  landing page plus research docs (needs, food delivery, roadmap).
  Production build green, reachability verified.
- 2026-11-01: Hackathon sprint starts. Locked scope: community delivery
  demo — order flow, AI dispatcher (Meta Model API, Muse Spark 1.3),
  driver dispatch, transparency dashboard, menu scan, neighborhood map.
- 2026-11-01: Built API layer (orders, dispatch with AI + local
  fallback, menu scan via Muse Wonder, health) and all five demo pages.
  Build green (17 routes); order → accept flow smoke-tested live.
- 2026-11-01: Garden planner built — crop engine, geocode-and-plan API,
  garden coach, plan page with tools and verified resource links.
- 2026-11-01: Hubs loop built — 12 seeded hubs, filterable map,
  24/7 need board API, livestock rotation and dog-corridor simulators.
- 2026-11-01: Security pass — `.env` ignored, secret sweep clean,
  rate-limiting middleware, security headers, SECURITY.md agent
  checklist; limiter verified live (30 pass, then 429).
- 2026-11-02: Agent sprint integrated — design overhaul (ledger look,
  receipt hero, demo index), Portland pilot map with customer/driver
  views, demo video plan; weights intel (impact 30 / Meta AI 25 /
  demo 25 / depth 20).
- 2026-11-02: Group runs shipped — join-a-run on Order, claim-a-run on
  Dispatch, vehicle profiles, transparent ETAs; batching validated
  against industry practice and studies.
- 2026-11-02: Map lab built by UI subagent — overlay playground with
  layer toggles, sliders, scenario presets; parent reviewed, wired
  navs, verified build.
- 2026-11-02: Lab experiments round 2 — earnings sim, Voronoi coverage
  planner, run animator; benchmarks grounded in 2025-26 pay data.
- 2026-11-02: Garden plotter shipped — square-foot grid, drag-and-drop
  planting, paintable sun, live yield/hours, recommendations, autosave.
- 2026-11-02: Landing reframed around hubs of support; resource placer
  (k-means) and live RLIS parcel picker added to the lab.
- 2026-11-02: AI visibility — model + latency badges on dispatcher and
  menu scan results; local fallback labeled with its own timing.
- 2026-11-02: Multilingual dispatcher — replies match customer language
  (keys stay English); Spanish + Vietnamese example chips on Order.
- 2026-11-02: Dispatcher eval — 20-case script with budget/menu checks,
  `npm run eval`, results in eval/results.md.
- 2026-11-02: Vitest suite — tests for garden, simulate, store, and
  extractJson; `npm test` green.
- 2026-11-02: CI — GitHub Actions runs npm ci, typecheck, test, build
  on Node 20 for pushes and PRs.
- 2026-11-02: Docker — multi-stage Node 20 image with standalone
  output, compose.yaml with .env.local, README quickstart.
- 2026-11-02: Nav focused — core loop (Order, Menu scan, Dispatch,
  Transparency) plus a Labs index; no routes deleted.
- 2026-11-02: Provenance footer on every page via root layout, linked
  to the build log; landing footer folded into it.
