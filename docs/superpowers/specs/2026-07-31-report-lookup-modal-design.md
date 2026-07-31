# Report lookup as a modal on `/report`

**Date:** 2026-07-31
**Status:** approved, ready for implementation plan

## Problem

Two separate defects in the same flow.

**1. The home page's report widget is broken for plates.** The navy panel in
`CarSearchSection` (`src/components/home/CarSearchSection.tsx:625-654`) shows a single
input whose placeholder reads "VIN эсвэл улсын дугаар", but `onVinSubmit`
(`:268-272`) always pushes `/report?vin=<value>`, and `ReportHero`
(`src/components/report/ReportHero.tsx:96-104`) only ever reads `?vin=`. A customer who
types a licence plate lands on the hero with the plate loaded in VIN mode, where it fails
validation. There is also no way to express "this is a plate" from the home page at all.

**2. The lookup is a page navigation.** Even in the working VIN case the customer is only
*prefilled* on `/report` and has to press "Шалгах" a second time, which then navigates to
`/report/check`. Two clicks and two page loads to see one answer.

## Decision

The lookup result becomes a **modal on the `/report` landing page**. `/report/check` is
deleted and the whole flow collapses to a single entry point.

```
home navy panel  ──push /report?plate=…|vin=…──┐
                                               ├──▶  /report  ──▶ modal (lookup + buy)
hero form on /report  ──replaceState──────────-┘
```

Rejected alternative: keep `/report/check` and only fix the plate handling. Rejected
because it leaves the two-click path in place and keeps a second entry point that has to
be kept in sync.

`/report` is already dynamically rendered — `src/app/[locale]/layout.tsx:80` calls
`cookies()` — so adding a `getConfig()` call to the landing page costs no static
rendering. This was verified before choosing the design.

## 1. Shared search logic — `src/lib/reportSearch.ts` (new)

Moved verbatim out of `ReportHero.tsx:13-66`, which is currently its only home:

```ts
export type SearchMode = "plate" | "vin";
export type SearchError =
  | "required" | "tooShort" | "invalidChars" | "plateFormat" | null;

export function normalizeFor(mode: SearchMode, raw: string): string;
export function validate(mode: SearchMode, v: string): SearchError;
export function reportSearchQuery(
  mode: SearchMode, value: string,
): { plate: string } | { vin: string };
```

`normalizeFor` dispatches to the existing private `normalizePlate` / `normalizeChassis`.
Both keep their current behaviour, including the `LATIN_TO_CYRILLIC` homoglyph map that
lets an English keyboard produce `1234УБН` from `1234YBH`.

Consumers: `ReportHero` and `CarSearchSection`. Neither re-implements validation.

## 2. Delete `/report/check`

| File | Action |
| --- | --- |
| `src/app/[locale]/report/check/page.tsx` | deleted |
| `src/app/[locale]/report/page.tsx` | `await getConfig()`, pass `price={effectiveReportPrice(config)}` to `<ReportHero />` |
| `src/app/[locale]/dashboard/page.tsx:35` | `href: "/report/check"` → `"/report"` |

The `reportCheck` i18n namespace **stays** — the modal renders those exact strings, with
one adjustment. The modal needs a heading while the lookup is still running, which the
page never did; `metaTitle` already carries the right copy but is named for metadata the
modal does not have. So `metaTitle` is re-cut as `reportCheck.title`, and four keys go:

| Key | Fate |
| --- | --- |
| `metaTitle` | replaced by `title`, same copy, used as the modal's loading/redirect heading |
| `metaDescription` | removed — no page metadata left to describe |
| `noInputTitle` | removed — the modal only opens with a search term |
| `noInputBody` | removed — same |

No redirect rule is added. `/report/check` shipped recently, is `noindex`, and is not the
URL printed by the PDF QR code (that is `/report/view/{id}`, still unimplemented and out
of scope).

## 3. `ReportLookup` → `ReportLookupModal`

`src/components/report/ReportLookup.tsx` becomes `ReportLookupModal.tsx`. The new file is
added before the old one is deleted so that `/report/check` keeps compiling in between and
every commit type-checks. All behaviour that makes the component correct is preserved:

- the plate → chassis → report chain, including `plateChassisNo` reassembly;
- the `isExistingReport` short-circuit that redirects an already-owned VIN to
  `/report/{id}` instead of charging twice;
- the 422 "not found" branch rendering the API-authored HTML (`<br/>`) via
  `dangerouslySetInnerHTML`;
- passing the searched `chassis` (not JPStat's `car.vin`) to `createReport`.

Changes:

| Aspect | Before | After |
| --- | --- | --- |
| Shell | `<Panel>` `<section>` on a page | antd `<Modal>` body, `centered`, `destroyOnHidden`, `width="min(560px, 94vw)"`, `footer={null}` |
| Props | `{ price, plate?, vin? }` | `{ open, price, plate?, vin?, onClose }` |
| Login callback | `/report/check?plate=…` | `/report?plate=…` |
| "No input" state | rendered when neither param present | removed — the modal only opens with a value |
| "Try again" links | `<Link href="/report">` | plain button calling `onClose` |

`destroyOnHidden` matters: it unmounts the `useQuery` subtree on close, so reopening with
a different plate/VIN starts clean rather than flashing the previous car.

Purchase success still `router.push`es to `/report/{report_id}`, and the `owned` branch
still `router.replace`s there.

## 4. `ReportHero` — modal instead of redirect

```
submit → validate(mode, value)
       → on success: syncUrl({plate|vin}) via history.replaceState
       → setModalOpen(true)

mount  → read plate|vin from window.location.search
       → set mode + value, open the modal

close  → history.replaceState back to a bare pathname
```

`window.history.replaceState` is used rather than `router.replace` for the same reason the
existing `?vin=` effect reads `window.location` directly: `useSearchParams` would force a
Suspense/CSR bailout, and a `router.replace` would round-trip the server component for a
purely client-side state change. The current pathname (which already carries the locale
prefix) is reused as-is, so no locale handling is needed.

This one mechanism covers three entry paths at once: arriving from the home panel,
returning from `/auth/login?callbackUrl=/report?vin=…`, and refreshing or sharing the URL.

The existing `?vin=`-only prefill effect (`ReportHero.tsx:96-104`) is replaced by this
logic. `isPending`/`useTransition` is dropped — nothing navigates any more.

## 5. `CarSearchSection` navy panel

```
┌──────────────────────────┐
│ Осол аваар шалгах        │
│ blurb + 3 chips          │
│ ┌──────────┬───────────┐ │
│ │Улсын дуг.│    VIN    │ │  Segmented
│ └──────────┴───────────┘ │
│ [ 1234УБН              ] │  Input (mode-dependent placeholder)
│ [       Шалгах         ] │  Button
└──────────────────────────┘
```

- antd `Form` + `vinForm` are removed in favour of `useState` for mode/value/error, so
  switching mode can clear the value the way `ReportHero.switchMode` does.
- Input `onChange` runs `normalizeFor(mode, …)`; submit runs `validate` and renders the
  error under the input in red with `role="alert"`.
- Submit pushes `{ pathname: "/report", query: reportSearchQuery(mode, value) }` through
  `@/i18n/navigation`'s `useRouter`, so the locale prefix stays automatic.
- The `Segmented` sits on the `#05122e` panel and needs explicit styling —
  `bg-white/10` track, light labels, white selected thumb — since antd's default renders
  for a light background.

## 6. i18n

New keys, added to `messages/{mn,en,ru}.json`:

| Key | mn | en | ru |
| --- | --- | --- | --- |
| `homeSearch.vin.modePlate` | Улсын дугаар | Plate | Гос. номер |
| `homeSearch.vin.modeVin` | VIN | VIN | VIN |

Short labels are deliberate: the panel is `lg:col-span-3` of a `max-w-7xl` grid minus
`p-6`, i.e. roughly 290px of content width, and
`reportLanding.hero.form.modeVin` ("Арлын дугаар (VIN)") wraps there.

Reused rather than duplicated — `CarSearchSection` adds
`useTranslations("reportLanding.hero.form")` for `platePlaceholder`, `placeholder` and the
four `errors.*` strings. The file already pulls from five namespaces, so this matches its
existing style and avoids copying twelve strings across three locales.

Removed: `homeSearch.vin.placeholder` and `homeSearch.vin.required` in all three locales —
both become unused once the placeholder is mode-dependent and validation moves to the
shared `validate`.

## Verification

1. `npx tsc --noEmit` — clean.
2. `npm run lint` — clean.
3. `rg -n "report/check" src` — no hits.
4. Browser pass via the `verify` skill, on `/mn`:
   - plate `1234УБН` in the navy panel → lands on `/mn/report?plate=1234УБН` with the
     modal open on the result;
   - VIN mode with a known chassis → same, `?vin=`;
   - `1234ABC` (Latin) in plate mode → normalises to Cyrillic and passes;
   - `12ABC` in plate mode → `plateFormat` error, no navigation;
   - hero form on `/report` → modal opens, URL gains the param, closing removes it;
   - refresh with the param present → modal reopens;
   - logged out → "Нэвтэрч худалдаж авах" → login → returns to `/report?vin=…` with the
     modal open.

## Out of scope

- `/report/view/[jp_report_id]` — the public verification page the PDF QR points at. Still
  unimplemented, unchanged by this work.
- The commented-out badge block at `CarSearchSection.tsx:602-605` and its now-unused
  `ShieldIcon` import. Left exactly as found.
- Any change to `POST /plates/search` or `POST /reports/search` on the backend.

## Follow-ups found during implementation

Reviewed, deliberately not fixed here, and worth their own work. All three sit on the
purchase path, where the backend has no duplicate guard — `src/services/reports.ts:55-59`
records that a retry creates a second unpaid report and a second QPay invoice.

1. **`TryAgain` is not gated on `purchase.isPending`.** The modal's three dismiss vectors
   (Esc, close icon, mask) are gated, so `handleClose` — and its `purchase.reset()` —
   cannot fire mid-purchase. The two `TryAgain` buttons are not, and rely instead on
   `renderView()` never showing them while the found-panel is active. That holds unless a
   background refetch of `report-lookup` fails: `AntdProvider.tsx:55` disables
   `refetchOnWindowFocus` but leaves `refetchOnReconnect` at TanStack's default `true`, and
   TanStack flips `status` to `error` on any failed fetch, including one over data it
   already has. So a purchase pending past the 60s `staleTime`, plus a reconnect, plus that
   refetch failing, exposes an ungated `TryAgain` that re-arms the Buy button.
2. **No client-side timeout or `AbortController` on `POST /reports`.** A genuinely hung
   request leaves the modal deliberately unclosable with no upper bound and no affordance
   telling the customer why; the only escape is a browser-level reload.
3. **A logged-out search can still be replayed to a logged-in render across a hard
   reload.** The in-memory fix (session identity in the query key) covers the client-side
   login round-trip, which is the path this work introduced. It does not cover a customer
   who already owns a VIN, searches it logged out on a fresh device, and logs in: the
   duplicate check lives behind auth on `POST /reports/search`, and `POST /reports` has
   none of its own. The durable fix belongs in the API.
