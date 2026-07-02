// pm2 entrypoint for the Next.js standalone server.
//
// Next's standalone `server.js` does NOT load `.env` files itself — that only
// happens in `next start`. Under pm2 that means `process.env.API_URL` (and any
// other non-`NEXT_PUBLIC_*` server var from shared/.env.production) is
// `undefined` at runtime, so server-side fetches silently fall back to the
// build-time-baked NEXT_PUBLIC value (or "").
//
// loadEnvConfig restores `next start` parity: it reads .env / .env.production
// from this dir (where the deploy symlinks shared/.env.production) into
// process.env BEFORE the server boots. Editing shared/.env.production + a
// `pm2 reload` now takes effect without a rebuild.
//
// This file is copied into .next/standalone/ by the CI "Assemble standalone
// artifact" step, so __dirname is the standalone dir and ./server.js resolves.
require('@next/env').loadEnvConfig(__dirname, false);
require('./server.js');
