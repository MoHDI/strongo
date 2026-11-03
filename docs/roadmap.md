# Roadmap

*Living plan. Updated as research and pilots teach us more.*

## Where we are

Phase 0, nearly done: repo set up, landing page live locally, first
research published. Next: pick the pilot neighborhood and stand up the
simplest possible food coordination.

## Phases

### Phase 0 — Foundation (now)

- Landing page explaining Strongo in plain words.
- Research docs for needs, food delivery, and this roadmap, readable on
  the site and on GitHub.
- Repo conventions so every contribution documents itself (see
  `AGENTS.md`).

Done when: `npm run build` passes, the site deploys to Vercel, and a
neighbor can read all three research docs without help.

### Phase 1 — Food pilot (next)

- One neighborhood, a handful of restaurants or cooks, set delivery days.
- Simplest coordination that works: shared order form, visible dispatch,
  stipend-paid volunteer drivers.
- Free-meal fund and at least one care route (meal train or fridge
  restocking) running on the same rails.

Done when: 8 weeks of scheduled deliveries complete, books published, and
restaurants and drivers say they'd continue.

### Phase 2 — Tools + yard work

- Shared tool library with simple checkout tracking.
- Chore board for yard work and small repairs, with the same
  volunteer-plus-stipend model as drivers.

Done when: 25+ tools circulating and weekly chore matches happening.

### Phase 3 — Rides + utilities

- Volunteer ride coordination for groceries, appointments, and aid offices.
- Utility-aid navigation: plain-language guides plus help booking
  appointments and filling forms.

Done when: ride coverage published weekly and first aid applications
completed with Strongo help.

### Later — Sitter co-op, job board

Only after food, tools, and rides are steady. Childcare and employment
carry heavier trust and liability weight and should not rush.

## Priorities, in order

1. Food delivery pilot.
2. Tool library + chore board.
3. Ride coordination + utility-aid navigation.
4. Everything else.

## Non-goals

- Replacing existing community efforts — join fridges, buying clubs, and
  meal trains already running; don't compete with them.
- City-wide launch before one neighborhood works.
- Profit extraction. Surplus funds meals and services, forever.

## Decision log

- 2026-11-01: Next.js on Vercel for the site; docs as Markdown in
  `docs/`, rendered in-site. Chosen for one-app simplicity and free
  Vercel hosting.
- 2026-11-01: Food first, tools second, rides and utilities third. Driven
  by assessment frequency data and regulatory weight.
- 2026-11-01: Garden planner added as second demo app (hackathon). Static
  crop DB plus Nominatim geocoding; tool-library tie-in link ships now,
  the library itself stays Phase 2.
- 2026-11-01: Hubs map plus night board cover all remaining tracks
  (utilities, rides, repairs, childcare, aid) as directory services for
  the demo; livestock and dog-corridor simulators added with
  show-your-work math.
- 2026-11-02: Portland picked as named pilot city (Pearl + Alberta
  seeds); design overhaul and demo video plan landed from agent sprint.
