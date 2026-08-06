# Google Analytics 4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send a GA4 pageview on every page load and every client-side route change, driven by a build-time environment variable.

**Architecture:** One client component loads `gtag.js` via `next/script` and queues every gtag command onto `window.dataLayer` from React effects, so the order `js → config → page_view` is guaranteed. GA4's own automatic pageview is switched off (`send_page_view: false`) and replaced by an effect keyed on the pathname and search params. No npm dependency is added.

**Tech Stack:** Next.js 16.2.6 App Router, React 19.2.6, TypeScript, `next/script`.

**Spec:** `docs/superpowers/specs/2026-08-06-google-analytics-design.md`

> **Executed 2026-08-06, with one change.** Browser verification showed the
> component in Task 1 double-counting every client-side navigation, and it was
> replaced by a much smaller one. Read the "Outcome" section at the foot of this
> file before the tasks, and do NOT copy the component in Task 1 Step 1.

## Global Constraints

- **No test runner exists in this repo** (`package.json` scripts: `dev`, `build`, `start`, `lint`; no vitest/jest; zero test files). Do NOT add one. Every task verifies with `npx tsc --noEmit` + `npm run lint`, and Task 2 adds a manual browser pass.
- **`reactStrictMode: false`** (`next.config.ts:9`). Effects run ONCE on mount, so the manual test expects exactly one `page_view` per navigation — not two.
- **`.env*` is gitignored** (`.gitignore:34`). The env files are edited on disk but are never staged or committed, and the deploy host needs `NEXT_PUBLIC_GA_ID` set independently or the built bundle ships with GA compiled out.
- **Navigation imports:** the project rule is `@/i18n/navigation` for routing (CLAUDE.md). This feature is an explicit, commented exception — it needs `usePathname` from `next/navigation` because next-intl's version strips the locale prefix.
- **The working tree is dirty with unrelated WIP,** and `src/app/[locale]/layout.tsx` is one of the modified files (it carries the live-exchange-rates `RatesProvider` change). Never run a bare `git commit`; check `git status --short` before and after every commit.
- **Scope:** pageviews only. No custom events, no GTM, no Meta Pixel, no consent banner.
- **Commit style:** conventional commits (`feat:`, `fix:`, `docs:`).

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/components/analytics/GoogleAnalytics.tsx` | create | The whole feature: the `gtag.js` tag, the dataLayer shim, the init effect and the route-change pageview effect. |
| `src/app/[locale]/layout.tsx` | modify | Mount it inside `<body>`. Two lines. |
| `.env.local` | modify | Commented-out key documenting the local off-switch. |
| `.env.production` | modify | `NEXT_PUBLIC_GA_ID=G-NZPS67G2NB`. |

Task 1 builds the component in isolation; Task 2 mounts, configures and verifies it in a browser. A reviewer can reject the component's ordering guarantees without touching the wiring, which is where the split falls.

---

### Task 1: The GoogleAnalytics component

**Files:**
- Create: `src/components/analytics/GoogleAnalytics.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `export default function GoogleAnalytics(): JSX.Element | null` — takes no props, reads `process.env.NEXT_PUBLIC_GA_ID`, renders `null` when it is unset. Task 2 mounts it.

- [ ] **Step 1: Create the directory and the file**

`src/components/analytics/` does not exist yet. Create it with the file below.

```tsx
"use client";

import Script from "next/script";
// Deliberately `next/navigation`, not `@/i18n/navigation`: next-intl's
// `usePathname` strips the `/mn`, `/en`, `/ru` prefix, so switching language
// would leave it unchanged and that pageview would never fire.
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

declare global {
  interface Window {
    dataLayer?: IArguments[];
  }
}

type GtagCommand =
  | ["js", Date]
  | ["config", string, { send_page_view: boolean }]
  | ["event", "page_view", { page_location: string; page_title: string }];

/**
 * Queue a gtag command. `gtag.js` drains `window.dataLayer` once it loads, so
 * pushing before the script arrives is not merely safe — it is the whole
 * mechanism, and it is what keeps `config` ahead of the first `page_view`.
 *
 * The pushed value has to be the real `arguments` object: the tag routes an
 * entry as a gtag command only when it looks like one, and a plain array is
 * silently dropped. Hence a `function` rather than an arrow, and hence the
 * parameter list existing purely to type the call sites.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function gtag(...command: GtagCommand) {
  // eslint-disable-next-line prefer-rest-params
  (window.dataLayer = window.dataLayer ?? []).push(arguments);
}

function GaTracker({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Declared before the pageview effect on purpose — React runs a component's
  // effects in declaration order, which is what puts `config` into the queue
  // ahead of the first event. An event that reaches the tag before its config
  // is thrown away.
  useEffect(() => {
    gtag("js", new Date());
    gtag("config", gaId, { send_page_view: false });
  }, [gaId]);

  // With the automatic pageview off, every one comes from here — including the
  // first. `/japan` and `/japan/brands` keep their filters and paging in the
  // query string, so the search params belong in the key.
  useEffect(() => {
    gtag("event", "page_view", {
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}

/**
 * Google Analytics 4, pageviews only. An unset `NEXT_PUBLIC_GA_ID` compiles the
 * whole thing away — that is how local development stays out of the report.
 */
export default function GoogleAnalytics() {
  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      {/* `useSearchParams` opts its subtree out of static rendering, so it needs
          a boundary of its own — without one, `next build` fails on every
          statically rendered route. */}
      <Suspense fallback={null}>
        <GaTracker gaId={GA_ID} />
      </Suspense>
    </>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: exits 0, no output.

If it reports `Property 'dataLayer' does not exist on type 'Window'`, the `declare global` block was dropped or the file lost its imports (a `declare global` only works inside a module).

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: exits 0.

ESLint 9 warns about disable directives that turn out to be unnecessary ("Unused eslint-disable directive"). If either of the two directives in the file is reported that way, **delete that directive** — do not leave it in. If instead a rule fires that has no directive, add a targeted `// eslint-disable-next-line <rule>` on the line above it rather than widening any config.

- [ ] **Step 4: Verify the component is genuinely inert without the env var**

`.env.local` has no `NEXT_PUBLIC_GA_ID` yet, which is the state this step tests.

Run: `npm run build`
Expected: build succeeds. Then confirm the ID never reached the bundle:

```bash
grep -rl "googletagmanager" .next/static/chunks/ | head
```
Expected: no output. `GA_ID` is `undefined`, `if (!GA_ID) return null` is unreachable-past, and the `<Script>` is dead code.

- [ ] **Step 5: Commit**

The file is new and its path is clean of user WIP, so the path-limited form is safe here. Confirm that first:

```bash
git status --short src/components/analytics/
```
Expected: `?? src/components/analytics/` only.

```bash
git add src/components/analytics/GoogleAnalytics.tsx
git commit -m "feat(analytics): add the GA4 pageview component" -- src/components/analytics/GoogleAnalytics.tsx
git status --short | wc -l
```

The final count must be exactly one lower than it was before the commit. If it dropped by more, unrelated WIP was swept in: `git reset --soft HEAD~1`, then retry with the plumbing recipe in Task 2 Step 6.

---

### Task 2: Mount it, configure it, verify it in a browser

**Files:**
- Modify: `src/app/[locale]/layout.tsx` (import block ~line 17, and the `<body>` subtree ~line 125)
- Modify: `.env.local`
- Modify: `.env.production`

**Interfaces:**
- Consumes: `GoogleAnalytics` from `@/components/analytics/GoogleAnalytics` (Task 1) — default export, no props.
- Produces: nothing. This is the last task.

- [ ] **Step 1: Add the import**

`src/app/[locale]/layout.tsx` already imports its siblings in this block. Add the line after `AiChatWidget`:

```tsx
import AiChatWidget from "@/components/ai-chat/AiChatWidget";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import ScrollState from "@/components/layout/ScrollState";
```

- [ ] **Step 2: Mount the component**

In the same file, inside `<body>`, the tail of the tree currently reads:

```tsx
              <AiChatWidget />
              <ScrollState />
              <ScrollToTop />
            </AntdProvider>
```

Make it:

```tsx
              <AiChatWidget />
              <ScrollState />
              <ScrollToTop />
              <GoogleAnalytics />
            </AntdProvider>
```

The root `src/app/layout.tsx` is a pass-through with no `<body>`, so this locale layout is the only place the tag can go.

- [ ] **Step 3: Set the production ID**

Append to `.env.production`:

```
NEXT_PUBLIC_GA_ID=G-NZPS67G2NB
```

- [ ] **Step 4: Document the local off-switch**

Append to `.env.local`:

```
# Google Analytics 4. Left unset on purpose — with no value the tracker is
# compiled out, which keeps localhost traffic out of the report. Uncomment to
# test the integration itself.
# NEXT_PUBLIC_GA_ID=G-NZPS67G2NB
```

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit 0.

- [ ] **Step 6: Commit the mount**

**`src/app/[locale]/layout.tsx` is dirty with unrelated WIP** — the live-exchange-rates `RatesProvider` change (`git diff HEAD -- 'src/app/[locale]/layout.tsx'` shows four hunks that are not yours). `git commit -- <path>` takes the file's *working-tree* content, so the path-limited form would commit that WIP too.

Neither env file can be committed at all — `.gitignore:34` covers `.env*`.

Confirm the index is empty of the user's work first:

```bash
git diff --cached --name-only
```
Expected: no output.

Then stage only your own two lines. Write the patch to your session scratchpad directory (`$SCRATCH` below) — context lines must match the file exactly, including the WIP already present around them:

```bash
git diff -- 'src/app/[locale]/layout.tsx' > "$SCRATCH/layout.patch"
```

Edit that patch down to only the two hunks that add the `GoogleAnalytics` import and the `<GoogleAnalytics />` element, fix each hunk's line counts, then:

```bash
git apply --cached "$SCRATCH/layout.patch"
git diff --cached
```
Expected: exactly two added lines, both mentioning `GoogleAnalytics`, and nothing about `RatesProvider` or `getConfig`.

```bash
git commit -m "feat(analytics): mount GA4 in the locale layout"
git status --short | wc -l
```

The count must be unchanged from before the commit — `layout.tsx` stays modified, because the WIP hunks are still uncommitted in it.

If editing the patch proves fiddly, **stop and leave the mount uncommitted.** A two-line change sitting in an already-dirty file alongside 23 other modified files is the normal state of this repo, and it is strictly better than a commit that swallows someone's in-progress work. Say so in the handoff.

- [ ] **Step 7: Manual browser verification — GA off**

This step and the next use the project's `verify` skill to launch and drive the app.

With `NEXT_PUBLIC_GA_ID` still commented out in `.env.local`, run `npm run dev` and open `http://localhost:2500/mn`.

Expected in the network panel: **no** request to `googletagmanager.com`. In the console, `window.dataLayer` is `undefined`.

- [ ] **Step 8: Manual browser verification — GA on**

Uncomment `NEXT_PUBLIC_GA_ID` in `.env.local`, restart the dev server (env changes need a restart), and reload `http://localhost:2500/mn`.

Filter the network panel by `google`. Expected on first load:

1. One request to `https://www.googletagmanager.com/gtag/js?id=G-NZPS67G2NB`.
2. One request to `.../g/collect?...` whose query string contains `en=page_view` and `dl=http%3A%2F%2Flocalhost%3A2500%2Fmn`.

Exactly one `collect` — two would mean `send_page_view: false` did not take, which would point at the `config` command being queued after the event.

Then walk the app and count one further `collect` per step, each with the right `dl`:

| Action | Expected `dl` |
|---|---|
| Click through to `/mn/japan` | `…/mn/japan` |
| Change any auction filter | `…/mn/japan?<filters>` — a new pageview, query string included |
| Open a lot detail page | `…/mn/japan/<id>` |
| Browser Back | `…/mn/japan?<filters>` |
| Switch the language to English | `…/en/…` |

The last row is the one that fails if `usePathname` was imported from `@/i18n/navigation` instead of `next/navigation` — the prefix-stripped pathname does not change on a language switch, so no pageview fires.

- [ ] **Step 9: Re-disable GA locally**

Comment `NEXT_PUBLIC_GA_ID` back out in `.env.local` so ordinary development does not report itself. Re-run Step 7 to confirm the requests are gone.

- [ ] **Step 10: Production build check**

Run: `npm run build`
Expected: succeeds. In particular no `useSearchParams() should be wrapped in a suspense boundary` error — if that appears, the `<Suspense>` in Task 1 Step 1 was dropped.

---

## Outcome

All tasks ran. Commits: `4f1c723` (component), `7be8666` (mount), `a88ea55`
(the correction below).

**Task 1 Step 4 was dropped.** It grepped the built bundle for
`googletagmanager` before anything imported the component — an unimported module
is never compiled in, so the check could only ever pass. The real version of it
ran in Task 2, after the mount: `NEXT_PUBLIC_GA_ID= npm run build` left zero
hits across 69 chunks, and the normal build shipped `G-NZPS67G2NB`.

**The component was rewritten.** A CDP driver walked six navigations
(`/mn` → `/mn/japan` → `?page=2` → a lot detail → Back → language switch to
`/en`) against a production build on port 2501, recording every
`googletagmanager.com` request. It counted **ten** hits for six navigations.

`window.dataLayer` held exactly one `page_view` per navigation, so the effect
was not double-firing — the extra hits had no dataLayer entry at all. They came
from gtag.js: GA4 Enhanced Measurement's history-event listener, which
`send_page_view: false` does not disable. It suppresses only the first pageview.

Given the choice between suppressing gtag's tracker (a GA console setting,
invisible from the repo) and dropping ours, the manual tracking went. That
removed `useSearchParams`, its `<Suspense>` boundary, the `gtag` shim, both
effects, the two eslint-disable directives and the `"use client"` directive —
the file is now a server component holding the standard gtag snippet. The same
walk sends six hits for six navigations.

Consequently the plan's Global Constraint about `usePathname` importing from
`next/navigation` is moot: the shipped component has no hooks.

**Verified in the browser, not inferred:** GA off (dev, port 2500) serves no
`googletagmanager` reference at all; GA on (production build, port 2501) sends
one `page_view` per navigation including the client-side language switch.

## Handoff notes

- `NEXT_PUBLIC_GA_ID` must be set in the deploy environment as well. `.env.production` is gitignored, so a deploy that does not carry the variable builds a bundle with GA compiled out and reports nothing — silently.
- GA4 shows nothing in Realtime for up to a minute after the first hit, and standard reports lag by hours. Realtime is the one to check.
- Ad blockers drop `googletagmanager.com` outright, so the numbers undercount by design.
