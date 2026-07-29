# Report route consolidation — `/reports/*` → `/report/*`

**Date:** 2026-07-29
**Status:** approved, ready for implementation plan

## Problem

The public report service is split across two sibling route trees:

| Route | File | Purpose |
| --- | --- | --- |
| `/report` | `src/app/[locale]/report/page.tsx` | Marketing landing page (JSON-LD, linked from every nav surface) |
| `/reports/check` | `src/app/[locale]/reports/check/page.tsx` | Plate/VIN lookup + purchase (`noindex`) |
| `/reports/[uuid]` | `src/app/[locale]/reports/[uuid]/page.tsx` | QPay payment + PDF delivery (`noindex`) |

One user-facing flow spans two prefixes that differ only by a plural `s`, which is
confusing to read, breaks active-state matching in navigation, and leaves no obvious
home for future report pages.

## Decision: keep the singular `/report`

The generated report PDF prints a QR code pointing at
`https://tjcar.mn/report/view/{jp_report_id}`
(`resources/views/pdf/report.blade.php:205` and `:212` in the API repo, `tjcar-api-v2`).
That URL is baked into every PDF already issued and cannot be changed retroactively, so
the singular prefix is fixed by an external constraint.

Supporting reasons:

- `/report` is the SEO-facing landing URL and is already linked from `DesktopHeader`,
  `DesktopFooter`, `MobileDrawer`, `MobileBottomNav`, `BentoGrid`, `servicesData`,
  `serviceShowcaseData`, `CarSearchSection` and `ReportJsonLd`. Keeping it means none of
  those change.
- The two `/reports/*` pages shipped in commit `1771cc7` ("Reports ui screens") and are
  `noindex`, so moving them costs no search ranking.

Rejected alternative: standardise on `/reports` to match the API paths (`POST /reports`,
`GET /reports/{uuid}`) and `/dashboard/reports`. Rejected because the frontend URL has no
obligation to mirror API paths, it would change the indexed landing URL, it would touch
nine link sites plus the JSON-LD `url`, and it would still leave the QR's
`/report/view/...` stranded on a separate prefix.

## Target route tree

```
src/app/[locale]/report/
├── page.tsx            /report          landing        (unchanged)
├── check/page.tsx      /report/check    plate/VIN lookup (moved)
└── [uuid]/page.tsx     /report/[uuid]   QPay + PDF      (moved)
```

`src/app/[locale]/reports/` is deleted entirely.

`check` is a static segment, so Next.js resolves it ahead of `[uuid]` — no collision. A
future `/report/view/[id]` resolves the same way.

`/dashboard/reports` is untouched. It lives in the dashboard namespace, where the plural
is correct, and it is not part of the public flow.

## File moves

Content is unchanged — `git mv` only. Both pages keep their existing metadata,
`robots: { index: false, follow: false }`, `getDevice()` call and container classes.

| From | To |
| --- | --- |
| `src/app/[locale]/reports/check/page.tsx` | `src/app/[locale]/report/check/page.tsx` |
| `src/app/[locale]/reports/[uuid]/page.tsx` | `src/app/[locale]/report/[uuid]/page.tsx` |

## Link updates

Seven live link sites. Every one already routes through `@/i18n/navigation`, so the locale
prefix stays automatic and no import changes are needed.

| File | Line | Change |
| --- | --- | --- |
| `src/app/[locale]/dashboard/page.tsx` | 41 | `href: "/reports/check"` → `"/report/check"` |
| `src/components/report/ReportHero.tsx` | 125 | `pathname: "/reports/check"` → `"/report/check"` |
| `src/components/report/ReportLookup.tsx` | 93 | `router.replace(\`/reports/${id}\`)` → `\`/report/${id}\`` |
| `src/components/report/ReportLookup.tsx` | 114 | `router.push(\`/reports/${id}\`)` → `\`/report/${id}\`` |
| `src/components/report/ReportLookup.tsx` | 220 | callback URL `/reports/check?…` → `/report/check?…` |
| `src/components/report/ReportStatus.tsx` | 59 | callback URL `/reports/${uuid}` → `/report/${uuid}` |
| `src/components/report/ReportList.tsx` | 84 | `href={\`/reports/${uuid}\`}` → `\`/report/${uuid}\`` |

Two comments name the old route in prose and are corrected in the same pass:
`ReportHero.tsx:114` and `ReportLookup.tsx:40`.

`ReportCtaButton.tsx:26` also says `/reports`, but it refers to the backend API rather than
a frontend route, so it is left alone here.

## Explicitly unchanged

- **`src/services/reports.ts`** — every `/reports…` string there is a backend API path
  (`POST /reports/search`, `GET /reports/{uuid}`, `/reports/{uuid}/download`), not a
  frontend route. Untouched.
- **No redirects.** The old `/reports/*` pages are brand new and `noindex`; the tree is
  deleted outright rather than adding `next.config.ts` redirect rules.
- **`DesktopHeader.tsx:307`** keeps its exact `pathname === base` active-state check. That
  rule is shared by every header item, so loosening it for reports would change unrelated
  navigation behaviour. Desktop header behaviour on the sub-pages is unchanged from today.
- **`MobileBottomNav.tsx:118`** already matches `p.startsWith("/report/")`, so after the
  move the Report tab stays highlighted through the whole flow. No code change; this is a
  free improvement.

## Verification

1. `npx tsc --noEmit` — clean.
2. `npm run build` — the route list shows `/[locale]/report`, `/[locale]/report/check`,
   `/[locale]/report/[uuid]`, and no `/[locale]/reports/*`.
3. `rg -n "/reports/" src` — the only remaining hits are the API paths in
   `src/services/reports.ts` and the `/dashboard/reports` links.
4. Manual pass through the real flow: `/mn/report` → enter a plate in the hero →
   `/mn/report/check` → purchase → `/mn/report/{uuid}` renders the QPay panel.

## Out of scope

`/report/view/[jp_report_id]` — the public verification page the PDF QR code points at.
The backend endpoint exists (`GET /reports/public/{jpReportId}`) and the response type is
already declared in `src/types/report.ts`, but no frontend page renders it. Deliberately
deferred to its own piece of work; the route tree above leaves the slot free.
