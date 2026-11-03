# Strongo

Community-run services for neighborhood needs — starting with food
delivery owned by the community, not by an app taking 30%.

## Run it locally

Requirements: Node 20+ and npm.

```sh
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new).
3. Accept the defaults (Next.js preset, `npm run build`). No environment
   variables needed.

## Docker

```sh
cp .env.example .env.local   # add MODEL_API_KEY for AI features (optional)
docker compose up --build
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.
The image is multi-stage (Node 20) running the Next.js standalone server.

## Live demo (hackathon)

- `/delivery` — order flow with an AI dispatcher (plain-words ordering).
- `/dispatch` — driver view: accept and advance deliveries.
- `/transparency` — open books: where every dollar goes.
- `/map` — pilot-neighborhood map of restaurants and drivers.
- `/menu-scan` — photograph a paper menu, AI transcribes it.
- `/garden` — yard-to-garden planner: crops, effort, yield, tools.
- `/hubs` — community hubs map, directory, and 24/7 night board.
- `/simulate` — livestock rotation and dog-corridor simulators.
- `/pilot` — Portland pilot map with customer/driver views.
- `/lab` — map overlay playground with dev panel (simulated demand).
- `/plotter` — drag-and-drop garden bed planner with sun + yield.

## AI setup

Copy `.env.example` to `.env.local` and add a Meta Model API key from
[dev.meta.ai](https://dev.meta.ai) (`MODEL_API_KEY`). Without a key the
dispatcher runs a labeled local fallback; menu scan needs the key.
On Vercel, add `MODEL_API_KEY` as an environment variable.

## Layout

- `app/page.tsx` — landing page.
- `app/delivery/`, `app/dispatch/`, `app/transparency/`, `app/map/`,
  `app/menu-scan/`, `app/garden/`, `app/hubs/`, `app/simulate/`,
  `app/pilot/`, `app/lab/` — demo.
- `lib/portland.ts` — Portland pilot seeds (demo data).
- `lib/maplab.ts` — overlay helpers + simulated demand (lab).
- `lib/lab-sim.ts` + `app/lab/experiments.tsx` — earnings, coverage, animator.
- `lib/placer.ts` + `app/lab/placer.tsx` — resource placement optimizer.
- `lib/parcels.ts` + `app/lab/parcels.tsx` — live RLIS taxlot picker.
- `app/api/` — `orders`, `dispatch`, `menu-scan`, `garden`,
  `garden-coach`, `needs`, `runs`, `health` routes.
- `lib/store.ts` — in-memory demo store and seed data.
- `lib/garden.ts` — crop database and garden planner.
- `lib/hubs.ts` — hub directory and need board.
- `lib/simulate.ts` — livestock and corridor math.
- `lib/meta.ts` — Meta Model API client (Muse Spark 1.3, Muse Wonder).
- `app/research/` — research index plus one route per doc.
- `docs/` — research Markdown, the source of truth. Each `.md` file
  renders automatically at `/research/<name>`.
- `AGENTS.md` — repo conventions, including the documentation workflow.
- `BUILD-LOG.md` — dated hackathon build log.

## Docs

- [Community needs](docs/needs.md)
- [Food delivery, without the cut](docs/food-delivery.md)
- [Roadmap](docs/roadmap.md)

Read them on the site under Research, or right here on GitHub.
