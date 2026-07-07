---
name: verify
description: Launch and drive tjcar-front-v2 locally to verify UI changes end-to-end
---

# Verifying tjcar-front-v2 changes

## Launch

- The user usually already runs `npm run dev` on **port 2500** — probe `curl -s -o /dev/null -w "%{http_code}" http://localhost:2500/mn` first and reuse it (hot reload picks up your edits). Only start your own if 2500 is free.
- Backend: Laravel via Herd at `http://tjcar-api-v2.test/api` (see `.env.local`). Grab real ids from it, e.g. `GET /api/korea?per_page=2` → `data[].id`.

## Drive

- Pages are locale-prefixed: `http://localhost:2500/mn/korea/<id>`, `/mn/japan/<id>`.
- Japan detail ids: scrape `curl -s localhost:2500/mn/japan | grep -o 'href="/mn/japan/[^"]*"'`.
- Server-rendered HTML is greppable evidence, but beware: next-intl serializes whole message namespaces into `<script>` payloads — match rendered DOM (unescaped text), not `\"key\":\"...\"` JSON, before claiming a string renders.
- Screenshots: no Playwright in the repo; use headless system Chrome:
  `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --hide-scrollbars --screenshot=out.png --window-size=1440,2600 --virtual-time-budget=15000 <url>` (390×844 for mobile).

## Gotchas

- AJES image CDN resizes on the literal `&w=320`/`&h=50` suffix even with no `?` in the URL; a standards-correct `?w=320` is IGNORED (full-size served). Don't "fix" `withImageSize`.
- Encar CDN (`ci.encar.com`) has no size params at all — Korea galleries pass `sizeVariants={false}` to `CarGallery`.
- `/api/cars` is empty locally — `/cars/[id]` can't be driven with real data.
