# Security policy + agent checklist

Standard rules for every human and agent working on Strongo. This file IS
the security agent: run its checklist before every handoff.

## Secrets

- API keys live ONLY in `.env.local` (local dev) or the Vercel dashboard
  (hosted). Never in code, docs, chat logs, screenshots, or video.
- `.env.example` documents variable NAMES with empty values. It must never
  contain a real key.
- `.gitignore` blocks `.env` and `.env*.local`. Verify with
  `git check-ignore -v .env .env.local` before the first push from any
  new machine.
- `MODEL_API_KEY` is server-only: referenced only in `lib/meta.ts`,
  `lib/sam.ts`, and API routes. Never `NEXT_PUBLIC_*`, never in client
  components. (The string in `app/delivery/page.tsx` is a display label
  naming the variable, not a key reference.)
- If a key leaks: revoke it at dev.meta.ai immediately, then replace it.

## Agent checklist (run before every handoff)

1. `git status --short` shows no `.env` files. If one appears, stop and
   remove it from tracking before anything else.
2. Search the repo for `LLM_`, `sk-`, and `NEXT_PUBLIC` — expect zero
   hits.
3. `npm run build` is green; no new logging of request bodies or keys.
4. Mutating API routes stay behind `middleware.ts` rate limiting. AI
   routes spend credits — never remove their limits.
5. Error responses are generic; details go to `console.error` only.

## Threat model (demo)

- No auth by design: posting orders and needs is open like a physical
  bulletin board. Don't collect PII beyond names and addresses users
  type in.
- In-memory stores reset on deploy; nothing sensitive persists.
- Markdown rendering has no raw HTML; user text renders through React
  escaping; no `eval`, no shell, no SQL anywhere.
- Dependencies: `npm audit` reviewed before handoff; fix non-breaking
  advisories, record the rest.

## Reporting

Found a hole? Tell the repo owner directly and give them a day before
discussing it anywhere else.
