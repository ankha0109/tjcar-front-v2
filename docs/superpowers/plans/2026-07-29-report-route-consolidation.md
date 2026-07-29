# Report Route Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the two report sub-pages from `/reports/*` to `/report/*` so the whole public report flow lives under one prefix.

**Architecture:** Pure route relocation. Two page files move with `git mv` and their contents are untouched; seven link sites and two prose comments are repointed at the new paths. The `/report` landing page, `src/services/reports.ts` (backend API paths) and `/dashboard/reports` are all left alone.

**Tech Stack:** Next.js 16 App Router, next-intl 4 (locale-prefixed routes), TypeScript, Tailwind v4.

**Spec:** `docs/superpowers/specs/2026-07-29-report-route-consolidation-design.md`

## Global Constraints

- **There is no test framework in this repo.** `package.json` has only `dev`, `build`, `start`, `lint`. Do NOT add Jest/Vitest/Playwright. The verification cycle for every task is: `npx tsc --noEmit`, a `rg` grep with a stated expected output, and (final task) a real browser pass. Treat the failing grep as the "failing test".
- All app routes live under `src/app/[locale]/`. Paths in this plan contain literal `[locale]` / `[uuid]` brackets — quote them in shell commands (`"src/app/[locale]/report"`), zsh will not glob them otherwise.
- Routing links use `Link` / `useRouter` from `@/i18n/navigation`, never `next/link` or `next/navigation`. No import in this plan changes; the locale prefix stays automatic.
- Every path written into a link is **locale-less** (`/report/check`, not `/mn/report/check`) — `@/i18n/navigation` adds the prefix.
- `src/services/reports.ts` is the backend API layer. Its `/reports…` strings are API endpoints, not frontend routes. **Never edit that file in this plan.**
- `/dashboard/reports` is a different, valid route. Leave every `/dashboard/reports` link untouched.
- Dev server runs on port **2500** (`npm run dev`).

---

### Task 1: Move the lookup page to `/report/check`

Relocates `/reports/check` and repoints the three places that navigate to it. After this task the plate/VIN lookup is reachable at `/report/check` and nothing links to the old path.

**Files:**
- Move: `src/app/[locale]/reports/check/page.tsx` → `src/app/[locale]/report/check/page.tsx` (content unchanged)
- Modify: `src/app/[locale]/dashboard/page.tsx:41`
- Modify: `src/components/report/ReportHero.tsx:114,125`
- Modify: `src/components/report/ReportLookup.tsx:40,220`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: the route `/report/check`, accepting `?plate=<string>` and `?vin=<string>` search params (the page's `searchParams` type is `{ plate?: string; vin?: string }`). Task 3 navigates to it.

- [ ] **Step 1: Prove the old path is still referenced (the failing check)**

Run:
```bash
rg -n "/reports/check" src
```
Expected — exactly these 5 lines, all of which this task removes:
```
src/app/[locale]/dashboard/page.tsx:41:      href: "/reports/check",
src/components/report/ReportLookup.tsx:40: * Runs the plate → VIN → report chain behind /reports/check and turns it into
src/components/report/ReportLookup.tsx:220:              `/reports/check?${plate ? `plate=${plate}` : `vin=${vin}`}`,
src/components/report/ReportHero.tsx:114:   * /reports/check so the result is refreshable and shareable, and so the
src/components/report/ReportHero.tsx:125:      router.push({ pathname: "/reports/check", query });
```
The moved page file itself never spells its own route, so it does not appear here.

- [ ] **Step 2: Move the page directory**

```bash
git mv "src/app/[locale]/reports/check" "src/app/[locale]/report/check"
```

Do not edit the file's contents. It keeps its `generateMetadata`, its `robots: { index: false, follow: false }`, its `getConfig()` / `effectiveReportPrice()` call and its container classes (`mx-auto w-full max-w-7xl px-4 py-12 md:py-16 lg:px-6`).

- [ ] **Step 3: Repoint the dashboard quick-action**

In `src/app/[locale]/dashboard/page.tsx`, line 41:

```tsx
      href: "/reports/check",
```
becomes
```tsx
      href: "/report/check",
```

- [ ] **Step 4: Repoint the hero submit + its comment**

In `src/components/report/ReportHero.tsx`, the doc comment above `handleSubmit` (line 114):

```tsx
  /**
   * The hero only validates and hands off — the lookup itself runs on
   * /reports/check so the result is refreshable and shareable, and so the
   * plate → VIN → report chain has somewhere to show its intermediate states.
   */
```
becomes
```tsx
  /**
   * The hero only validates and hands off — the lookup itself runs on
   * /report/check so the result is refreshable and shareable, and so the
   * plate → VIN → report chain has somewhere to show its intermediate states.
   */
```

and the push on line 125:

```tsx
      router.push({ pathname: "/reports/check", query });
```
becomes
```tsx
      router.push({ pathname: "/report/check", query });
```

- [ ] **Step 5: Repoint the lookup's login callback + its comment**

In `src/components/report/ReportLookup.tsx`, the component doc comment (line 40):

```tsx
 * Runs the plate → VIN → report chain behind /reports/check and turns it into
```
becomes
```tsx
 * Runs the plate → VIN → report chain behind /report/check and turns it into
```

and the login callback URL (line 220):

```tsx
          <Link
            href={`/auth/login?callbackUrl=${encodeURIComponent(
              `/reports/check?${plate ? `plate=${plate}` : `vin=${vin}`}`,
            )}`}
          >
```
becomes
```tsx
          <Link
            href={`/auth/login?callbackUrl=${encodeURIComponent(
              `/report/check?${plate ? `plate=${plate}` : `vin=${vin}`}`,
            )}`}
          >
```

Leave line 44 (`` *  - `POST /reports/search` answers with EITHER a car… ``) alone — that names a backend endpoint.

- [ ] **Step 6: Verify the old path is gone and the code still compiles**

```bash
rg -n "/reports/check" src
```
Expected: **no output at all** (exit code 1).

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add "src/app/[locale]/report/check/page.tsx" "src/app/[locale]/dashboard/page.tsx" src/components/report/ReportHero.tsx src/components/report/ReportLookup.tsx
git commit -m "refactor(report): move the lookup page to /report/check"
```

Note: `git mv` already staged the deletion of the old path, so the commit contains a rename, not an add+delete pair. Confirm with `git show --stat HEAD` — it should read `src/app/[locale]/{reports => report}/check/page.tsx`.

---

### Task 2: Move the status page to `/report/[uuid]` and delete the old tree

Relocates `/reports/[uuid]`, repoints the four places that navigate to it, and removes the now-empty `reports` route directory.

**Files:**
- Move: `src/app/[locale]/reports/[uuid]/page.tsx` → `src/app/[locale]/report/[uuid]/page.tsx` (content unchanged)
- Delete: `src/app/[locale]/reports/` (directory, once empty)
- Modify: `src/components/report/ReportLookup.tsx:93,114`
- Modify: `src/components/report/ReportStatus.tsx:59`
- Modify: `src/components/report/ReportList.tsx:84`

**Interfaces:**
- Consumes: `/report/check` from Task 1 (only in that both live under `/report`; no code dependency).
- Produces: the route `/report/[uuid]`, where `uuid` is the report's `uuid` string. Its page params type is `{ locale: string; uuid: string }`. Task 3 navigates to it.

- [ ] **Step 1: Prove the old path is still referenced (the failing check)**

```bash
rg -n '/reports/\$\{' src --glob '!src/services/reports.ts'
```
Expected — 4 hits:
```
src/components/report/ReportStatus.tsx:59
src/components/report/ReportList.tsx:84
src/components/report/ReportLookup.tsx:93
src/components/report/ReportLookup.tsx:114
```
The `--glob` exclusion matters: `src/services/reports.ts:72` contains the same `` `/reports/${uuid}` `` shape but it is the backend API call and must not change.

- [ ] **Step 2: Move the page directory and drop the empty parent**

```bash
git mv "src/app/[locale]/reports/[uuid]" "src/app/[locale]/report/[uuid]"
rmdir "src/app/[locale]/reports"
```

`rmdir` fails loudly if anything is left behind — if it does, list the directory and move the stragglers rather than forcing `rm -rf`.

Do not edit the moved file. It keeps its `generateMetadata`, `robots: { index: false, follow: false }`, its `getDevice()` call (the QPay bank deep links are phone-only, so this must stay a device-cookie read, not a breakpoint) and its container classes.

- [ ] **Step 3: Repoint the two lookup navigations**

In `src/components/report/ReportLookup.tsx`, the already-owned redirect (line 93):

```tsx
      router.replace(`/reports/${lookup.data.reportId}`);
```
becomes
```tsx
      router.replace(`/report/${lookup.data.reportId}`);
```

and the purchase success handler (line 114):

```tsx
    onSuccess: ({ report_id }) => router.push(`/reports/${report_id}`),
```
becomes
```tsx
    onSuccess: ({ report_id }) => router.push(`/report/${report_id}`),
```

- [ ] **Step 4: Repoint the status page's login callback**

In `src/components/report/ReportStatus.tsx`, line 59:

```tsx
          href={`/auth/login?callbackUrl=${encodeURIComponent(`/reports/${uuid}`)}`}
```
becomes
```tsx
          href={`/auth/login?callbackUrl=${encodeURIComponent(`/report/${uuid}`)}`}
```

Leave line 79 (`href="/dashboard/reports"`) alone.

- [ ] **Step 5: Repoint the dashboard report list rows**

In `src/components/report/ReportList.tsx`, line 84:

```tsx
        href={`/reports/${report.uuid}`}
```
becomes
```tsx
        href={`/report/${report.uuid}`}
```

Leave line 50 (`cta={{ label: t("emptyCta"), href: "/report" }}`) alone — it already points at the landing page.

- [ ] **Step 6: Verify no frontend route still says `/reports`**

```bash
rg -n "/reports" src --glob '!src/services/reports.ts' --glob '!src/types/report.ts'
```
Expected — exactly these 11 lines, every one of them either an import, a `/dashboard/reports` link, a CDN URL, or a comment about the backend API:
```
src/hooks/useReportProgress.ts:5           import … from "@/services/reports"
src/app/[locale]/dashboard/page.tsx:21     // TODO: wire APIs for personal counts (bids/reports)
src/app/[locale]/dashboard/page.tsx:63     href="/dashboard/reports"
src/components/report/SampleReportModal.tsx:7   https://cdn.tjcar.mn/public/reports/…pdf
src/components/report/ReportStatus.tsx:9   import … from "@/services/reports"
src/components/report/ReportStatus.tsx:79  href="/dashboard/reports"
src/components/report/ReportList.tsx:9     import … from "@/services/reports"
src/components/report/ReportLookup.tsx:10  import … from "@/services/reports"
src/components/report/ReportLookup.tsx:44  POST /reports/search (backend endpoint)
src/components/report/ReportCtaButton.tsx:26  backend comment
src/components/dashboard/Sidebar.tsx:43    href: "/dashboard/reports"
```
Any hit outside this list is a missed link — fix it before moving on.

- [ ] **Step 7: Verify the route tree builds**

```bash
npx tsc --noEmit
npm run lint
npm run build
```
Expected: no type errors, no new lint errors, and the build's route table lists
`/[locale]/report`, `/[locale]/report/check`, `/[locale]/report/[uuid]` with **no** `/[locale]/reports/...` entry.

- [ ] **Step 8: Commit**

```bash
git add -A "src/app/[locale]/report" src/components/report/ReportLookup.tsx src/components/report/ReportStatus.tsx src/components/report/ReportList.tsx
git commit -m "refactor(report): move the status page to /report/[uuid] and drop the /reports tree"
```

Confirm the rename was recorded: `git show --stat HEAD` should read
`src/app/[locale]/{reports => report}/[uuid]/page.tsx`.

---

### Task 3: Walk the real flow in the browser

Static checks cannot prove that Next resolves `/report/check` ahead of `/report/[uuid]`, nor that the redirects between the three screens land. This task runs the flow for real.

**Files:** none — verification only.

**Interfaces:**
- Consumes: `/report/check` (Task 1) and `/report/[uuid]` (Task 2).
- Produces: nothing.

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```
Serves on `http://localhost:2500`. (The `verify` skill in this repo can drive the browser if a headless pass is preferred; a mobile-width screenshot needs CDP `setDeviceMetricsOverride`, not `--window-size`.)

- [ ] **Step 2: Landing page unchanged**

Open `http://localhost:2500/mn/report`. Expected: the landing page renders all its sections (hero, compare slider, features, PDF preview, steps, audience, FAQ) exactly as before — this page did not move.

- [ ] **Step 3: Hero hands off to the new lookup route**

Type a plate number into the hero form and submit. Expected: the URL becomes
`http://localhost:2500/mn/report/check?plate=<value>` and the lookup screen renders. This is the check that the static `check` segment wins over `[uuid]` — if Next had matched `[uuid]` instead, the status screen would render and poll for a report named "check".

- [ ] **Step 4: Purchase hands off to the new status route**

Complete a purchase (or, if no test payment is available, open a known report uuid directly at `http://localhost:2500/mn/report/<uuid>`). Expected: the QPay payment/delivery panel renders and polls.

- [ ] **Step 5: Dashboard list links land**

Open `http://localhost:2500/mn/dashboard/reports` and click a row. Expected: it navigates to `/mn/report/<uuid>`, not `/mn/reports/<uuid>`.

- [ ] **Step 6: Old paths are 404 (expected, by design)**

Open `http://localhost:2500/mn/reports/check`. Expected: 404. The spec deliberately adds no redirect — those pages shipped days ago and are `noindex`. If this turns out to matter in production, a `/:locale/reports/:path*` → `/:locale/report/:path*` rule in `next.config.ts` is the fix, but it is **not** part of this plan.

- [ ] **Step 7: Mobile bottom nav stays highlighted through the flow**

With the `tjcar-device` cookie set to phone (or on a real phone UA), walk `/mn/report` → `/mn/report/check`. Expected: the Report tab in `MobileBottomNav` stays active on both — its matcher is already `p === "/report" || p.startsWith("/report/")` ([MobileBottomNav.tsx:118](../../src/components/layout/mobile/MobileBottomNav.tsx)), so this now works for free. No code change; just confirm it.

The desktop header is expected NOT to highlight on the sub-pages — `DesktopHeader.tsx:307` uses an exact `pathname === base` match shared by every nav item, and the spec leaves that rule alone.

---

## Out of scope

`/report/view/[jp_report_id]` — the public verification page the generated PDF's QR code points at (`https://tjcar.mn/report/view/{jp_report_id}`, printed by `resources/views/pdf/report.blade.php:205` in the API repo). The backend endpoint exists (`GET /reports/public/{jpReportId}`) and `PublicReport` is already typed in `src/types/report.ts`, but no frontend page renders it. Deferred to its own piece of work — the route tree this plan lands leaves the slot free, since `view` is a static segment and resolves ahead of `[uuid]`.
