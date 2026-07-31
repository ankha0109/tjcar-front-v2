# Report Lookup Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the home page's report panel accept a licence plate as well as a VIN, and show the lookup result in a modal on `/report` instead of navigating to a second page.

**Architecture:** The plate/chassis normalise + validate helpers move out of `ReportHero` into `src/lib/reportSearch.ts` so both entry points share them. `ReportLookup` becomes `ReportLookupModal`, mounted by `ReportHero` and driven by `?plate=` / `?vin=` on the landing URL, which the hero writes with `history.replaceState`. `/report/check` is deleted; the home panel pushes to `/report` instead.

**Tech Stack:** Next.js 16 App Router, next-intl 4 (locale-prefixed routes), antd v6, TanStack Query v5, next-auth, TypeScript, Tailwind v4.

**Spec:** `docs/superpowers/specs/2026-07-31-report-lookup-modal-design.md`

## Global Constraints

- **There is no test framework in this repo.** `package.json` has only `dev`, `build`, `start`, `lint`. Do NOT add Jest/Vitest/Playwright. The verification cycle for every task is: a `rg` grep with a stated expected output (this is the "failing test"), then `npx tsc --noEmit`, then `npm run lint`. The final task is a real browser pass.
- Routing links use `Link` / `useRouter` from `@/i18n/navigation`, never `next/link` or `next/navigation`. Every path written into a link is **locale-less** (`/report`, not `/mn/report`) — the locale prefix is added automatically.
- Any new translation key must be added to **all three** of `messages/mn.json`, `messages/en.json`, `messages/ru.json`.
- Paths contain literal `[locale]` brackets — quote them in shell commands (`"src/app/[locale]/report"`); zsh will not glob them otherwise.
- `src/services/reports.ts` is the backend API layer. Its `/reports…` strings are API endpoints, not frontend routes. **Never edit that file in this plan.**
- Do not touch `src/components/report/ReportStatus.tsx`, `ReportList.tsx`, or `src/app/[locale]/report/[uuid]/page.tsx`. They are a different part of the flow.
- Leave the commented-out badge block at `CarSearchSection.tsx:602-605` and its `ShieldIcon` import exactly as found.
- **The hero form keeps `id="report-check"` and `scroll-mt-24`.** `ReportCtaButton.tsx:76` scrolls to `#report-check` and `ReportFinalCta.tsx:39` targets it — three CTAs on the landing page stop working if that id moves or disappears. (The id predates the route and has nothing to do with `/report/check`.)
- Dev server runs on port **2500** (`npm run dev`); the user usually already has it up.

---

### Task 1: Extract the shared search helpers

Moves plate/chassis normalisation and validation out of `ReportHero` into a module the home page can import too. Pure refactor — `/report` behaves identically after this task.

**Files:**
- Create: `src/lib/reportSearch.ts`
- Modify: `src/components/report/ReportHero.tsx:1-66` (imports + delete the moved code)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `src/lib/reportSearch.ts` exporting `type SearchMode = "plate" | "vin"`, `type SearchError = "required" | "tooShort" | "invalidChars" | "plateFormat" | null`, `normalizeFor(mode: SearchMode, raw: string): string`, `validate(mode: SearchMode, v: string): SearchError`, and `reportSearchQuery(mode: SearchMode, value: string): { plate: string } | { vin: string }`. Tasks 3 and 5 import all five.

- [ ] **Step 1: Prove the logic is trapped inside the component (the failing check)**

```bash
rg -n "normalizePlate|normalizeChassis|LATIN_TO_CYRILLIC" src
```

Expected: hits only in `src/components/report/ReportHero.tsx`, and `src/lib/reportSearch.ts` does not exist.

- [ ] **Step 2: Create `src/lib/reportSearch.ts`**

The character classes below contain literal Unicode hyphen variants (U+2010…U+2015, U+2212, U+FF0D). Copy them byte-for-byte from `ReportHero.tsx:26-56` rather than retyping them.

```ts
/**
 * Licence-plate / chassis-number input handling for the report lookup.
 *
 * Shared by the `/report` hero form and the home page's report panel so both
 * entry points normalise and validate identically — a plate typed on the home
 * page has to reach `/report` in exactly the form the hero would have produced,
 * because the hero turns it straight into a lookup.
 */

export type SearchMode = "plate" | "vin";

export type SearchError =
  | "required"
  | "tooShort"
  | "invalidChars"
  | "plateFormat"
  | null;

/** Uppercase, strip whitespace, normalise unicode hyphen variants to "-". */
function normalizeChassis(raw: string) {
  return raw
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[‐-―−－]/g, "-");
}

/* Plates are Cyrillic; map the Latin homoglyphs an English keyboard
   produces (A→А, Y/U→У, …) so "1234YBH" still validates. */
const LATIN_TO_CYRILLIC: Record<string, string> = {
  A: "А",
  B: "В",
  C: "С",
  E: "Е",
  H: "Н",
  I: "И",
  K: "К",
  M: "М",
  O: "О",
  P: "Р",
  T: "Т",
  X: "Х",
  Y: "У",
  U: "У",
};

function normalizePlate(raw: string) {
  return raw
    .toUpperCase()
    .replace(/[\s‐-―−－-]/g, "")
    .replace(/[A-Z]/g, (ch) => LATIN_TO_CYRILLIC[ch] ?? ch);
}

/** Clean raw keystrokes for the active mode. Safe to run on every change. */
export function normalizeFor(mode: SearchMode, raw: string) {
  return mode === "plate" ? normalizePlate(raw) : normalizeChassis(raw);
}

export function validate(mode: SearchMode, v: string): SearchError {
  if (!v) return "required";
  if (mode === "plate") {
    return /^\d{4}[А-ЯЁӨҮ]{3}$/u.test(v) ? null : "plateFormat";
  }
  if (!/^[A-Z0-9-]+$/.test(v)) return "invalidChars";
  if (v.length < 6) return "tooShort";
  return null;
}

/**
 * The query `/report` reads back. Exactly one key is present — the modal
 * branches on which one it got, and a plate takes an extra Autobox hop.
 */
export function reportSearchQuery(
  mode: SearchMode,
  value: string,
): { plate: string } | { vin: string } {
  return mode === "plate" ? { plate: value } : { vin: value };
}
```

- [ ] **Step 3: Point `ReportHero` at the new module**

In `src/components/report/ReportHero.tsx`, delete lines 13-15 (`type SearchMode`, `type SearchError`), 24-30 (`normalizeChassis`), 32-56 (`LATIN_TO_CYRILLIC`, `normalizePlate`) and 58-66 (`validate`). Add the import alongside the existing `cn` import:

```tsx
import {
  normalizeFor,
  validate,
  type SearchError,
  type SearchMode,
} from "@/lib/reportSearch";
```

Then replace the two call sites that used the deleted private functions. In the mount effect (`:102-103`):

```tsx
    setMode("vin");
    setValue(normalizeFor("vin", vin));
```

and in the `Input`'s `onChange` (`:229-236`):

```tsx
                  onChange={(e) => {
                    setValue(normalizeFor(mode, e.target.value));
                    if (error) setError(null);
                  }}
```

Leave everything else in the file alone — Task 3 rewrites the rest.

- [ ] **Step 4: Verify the move**

```bash
rg -n "normalizePlate|normalizeChassis|LATIN_TO_CYRILLIC" src
```

Expected: hits **only** in `src/lib/reportSearch.ts`.

```bash
npx tsc --noEmit && npm run lint
```

Expected: both clean.

- [ ] **Step 5: Commit**

```bash
git add src/lib/reportSearch.ts src/components/report/ReportHero.tsx
git commit -m "refactor(report): extract plate/VIN normalise + validate into src/lib/reportSearch"
```

---

### Task 2: Add `ReportLookupModal`

Creates the modal version of the lookup panel as a **new** file. Nothing renders it yet, so `/report/check` keeps working off the old `ReportLookup` until Task 4 removes it. Splitting it this way keeps `tsc` green at every commit.

**Files:**
- Create: `src/components/report/ReportLookupModal.tsx`
- Modify: `messages/mn.json`, `messages/en.json`, `messages/ru.json` (add `reportCheck.title`)

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: `ReportLookupModal`, default export, props `{ open: boolean; price: number; plate?: string; vin?: string; onClose: () => void }`. Task 3 mounts it.

- [ ] **Step 1: Prove the modal does not exist yet (the failing check)**

```bash
rg -n "ReportLookupModal" src
```

Expected: no matches.

- [ ] **Step 2: Add the `reportCheck.title` key to all three locales**

The modal needs a heading while the lookup is still running, before it knows whether the car was found. `reportCheck.metaTitle` already carries exactly the right copy but is named for page metadata the modal does not have, so add a properly-named sibling now; Task 4 deletes `metaTitle` once the page that used it is gone.

Insert immediately after the `"metaDescription"` line inside the `reportCheck` object:

- `messages/mn.json` → `"title": "Машины түүх шалгах",`
- `messages/en.json` → `"title": "Check vehicle history",`
- `messages/ru.json` → `"title": "Проверка истории автомобиля",`

- [ ] **Step 3: Create `src/components/report/ReportLookupModal.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Button, Modal, Skeleton } from "antd";
import { Link, useRouter } from "@/i18n/navigation";
import { ApiError } from "@/services/Api";
import { createReport, searchPlate, searchVin } from "@/services/reports";
import {
  isExistingReport,
  plateChassisNo,
  type VinSearchResult,
} from "@/types/report";

type Props = {
  open: boolean;
  /** Effective price in MNT, resolved server-side from GET /config. */
  price: number;
  /** Exactly one of these arrives from the form that opened the modal. */
  plate?: string;
  vin?: string;
  onClose: () => void;
};

type LookupOutcome =
  | {
      kind: "found";
      car: VinSearchResult;
      /**
       * The exact string the search was run with. The purchase must reuse it
       * rather than JPStat's `car.vin`: the backend re-queries JPStat with the
       * stored `vin` when it builds the PDF, and matches duplicates against it.
       */
      chassis: string;
      plateNo?: string;
    }
  | { kind: "owned"; reportId: string };

/**
 * Runs the plate → VIN → report chain for the `/report` hero and turns it into
 * a buy decision — in a modal, so the landing page stays where it is.
 *
 * Two backend behaviours shape this component:
 *  - `POST /reports/search` answers with EITHER a car OR `{ exists: true }` for
 *    a VIN this customer already bought. The second branch must short-circuit
 *    the purchase or they pay twice for the same report.
 *  - Its 422 "not found" message is authored as HTML (`<br/>` tags) by the API,
 *    so it is rendered as markup rather than plain text.
 */
export default function ReportLookupModal({
  open,
  price,
  plate,
  vin,
  onClose,
}: Props) {
  const t = useTranslations("reportCheck");
  const router = useRouter();
  const { status: authStatus } = useSession();

  const lookup = useQuery<LookupOutcome>({
    queryKey: ["report-lookup", plate ?? "", vin ?? ""],
    // Gated on `open` too: the component stays mounted while closed so the
    // modal can animate out, and a closed modal must not fire a request.
    enabled: open && Boolean(plate || vin),
    retry: false,
    staleTime: 60_000,
    queryFn: async () => {
      let chassis = vin;
      let plateNo: string | undefined;

      // Plate entry resolves to a chassis number first; Autobox is the only
      // thing that knows the mapping, and the report itself is always keyed by
      // that number. `plateChassisNo` reassembles the dashed form JPStat wants.
      if (!chassis && plate) {
        const car = await searchPlate(plate);
        const chassisNo = plateChassisNo(car);
        if (!chassisNo) {
          throw new ApiError(422, t("errors.plateNoVin"));
        }
        chassis = chassisNo;
        plateNo = car.car_plate;
      }

      if (!chassis) throw new ApiError(422, t("errors.missingInput"));

      const res = await searchVin(chassis);

      if (isExistingReport(res)) {
        return { kind: "owned", reportId: res.report_id };
      }

      return { kind: "found", car: res.data, chassis, plateNo };
    },
  });

  // Already purchased → straight to the report, no second charge. `replace` so
  // Back does not bounce the customer into the buy screen again.
  useEffect(() => {
    if (lookup.data?.kind === "owned") {
      router.replace(`/report/${lookup.data.reportId}`);
    }
  }, [lookup.data, router]);

  // The API authors this message as HTML; derived, not stored, so it can never
  // lag a render behind the query that produced it.
  const notFoundHtml =
    lookup.error instanceof ApiError && lookup.error.status === 422
      ? lookup.error.message
      : null;

  const purchase = useMutation({
    mutationFn: async () => {
      if (lookup.data?.kind !== "found") throw new Error("no car");
      const { car, chassis, plateNo } = lookup.data;
      return createReport({
        vin: chassis,
        car_data: { ...car },
        ...(plateNo ? { plate_no: plateNo } : {}),
      });
    },
    onSuccess: ({ report_id }) => router.push(`/report/${report_id}`),
  });

  /**
   * Where login sends the customer back to. The value is encoded for the query
   * string and the whole path encoded again for `callbackUrl`, so a Cyrillic
   * plate survives the auth round-trip as plain ASCII.
   */
  const returnTo = plate
    ? `/report?plate=${encodeURIComponent(plate)}`
    : `/report?vin=${encodeURIComponent(vin ?? "")}`;

  /**
   * Heading and body are decided in one pass, so the modal header can never
   * disagree with the panel underneath it.
   */
  function renderView(): {
    title: string;
    tone?: "error";
    body: React.ReactNode;
  } {
    // "owned" holds the skeleton up while the redirect effect above fires.
    if (lookup.isLoading || lookup.data?.kind === "owned") {
      return {
        title: t("title"),
        body: <Skeleton active paragraph={{ rows: 4 }} />,
      };
    }

    if (notFoundHtml) {
      return {
        title: t("notFoundTitle"),
        tone: "error",
        body: (
          <>
            {/* API-authored copy containing <br/>; not user input. */}
            <p
              className="text-[13.5px] leading-relaxed text-neutral-600 dark:text-neutral-300"
              dangerouslySetInnerHTML={{ __html: notFoundHtml }}
            />
            <TryAgain label={t("tryAgain")} onClick={onClose} />
          </>
        ),
      };
    }

    if (lookup.isError) {
      return {
        title: t("errors.generic"),
        tone: "error",
        body: <TryAgain label={t("tryAgain")} onClick={onClose} />,
      };
    }

    if (lookup.data?.kind !== "found") {
      return {
        title: t("title"),
        body: <Skeleton active paragraph={{ rows: 4 }} />,
      };
    }

    const car = lookup.data.car;
    const isAuthed = authStatus === "authenticated";
    const purchaseError =
      purchase.error instanceof ApiError ? purchase.error.message : null;

    return {
      title: t("foundTitle"),
      body: (
        <>
          <dl className="divide-y divide-neutral-100 dark:divide-neutral-800">
            <Row label={t("fields.name")} value={car.name} />
            <Row label={t("fields.vin")} value={car.vin} />
            <Row label={t("fields.company")} value={car.company} />
            <Row label={t("fields.model")} value={car.model} />
            <Row label={t("fields.year")} value={car.year} />
          </dl>

          <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-neutral-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:bg-neutral-900">
            <div>
              <p className="text-[12.5px] text-neutral-500">{t("priceLabel")}</p>
              <p className="text-[22px] font-semibold text-neutral-900 dark:text-neutral-50">
                {price.toLocaleString("mn-MN")}₮
              </p>
            </div>

            {isAuthed ? (
              <Button
                type="primary"
                size="large"
                loading={purchase.isPending}
                onClick={() => purchase.mutate()}
                className="min-h-12! rounded-xl! px-7! font-semibold!"
              >
                {t("buy")}
              </Button>
            ) : (
              <Link
                href={`/auth/login?callbackUrl=${encodeURIComponent(returnTo)}`}
              >
                <Button
                  type="primary"
                  size="large"
                  className="min-h-12! rounded-xl! px-7! font-semibold!"
                >
                  {t("loginToBuy")}
                </Button>
              </Link>
            )}
          </div>

          {purchaseError ? (
            <p role="alert" className="mt-3 text-[12.5px] font-medium text-red">
              {purchaseError}
            </p>
          ) : null}
        </>
      ),
    };
  }

  const view = renderView();

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      // Unmounts the body on close, so reopening with a different plate never
      // flashes the previous car while the new query runs.
      destroyOnHidden
      centered
      width="min(560px, 94vw)"
      title={
        <span
          className={
            view.tone === "error"
              ? "text-red"
              : "text-neutral-900 dark:text-neutral-50"
          }
        >
          {view.title}
        </span>
      }
    >
      {view.body}
    </Modal>
  );
}

/**
 * A plain button, not a link: the modal already sits on `/report`, so "search
 * again" just closes it. (antd's reset paints bare `<a>` blue and beats an
 * inherited text colour, which is another reason not to use one here.)
 */
function TryAgain({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-5 inline-flex text-[13px] font-medium text-primary hover:underline"
    >
      {label}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-[12.5px] text-neutral-500">{label}</dt>
      <dd className="text-right text-[13.5px] font-medium text-neutral-900 dark:text-neutral-100">
        {value || "—"}
      </dd>
    </div>
  );
}
```

- [ ] **Step 4: Verify it compiles alongside the old panel**

```bash
node -e "for (const l of ['mn','en','ru']) { const m = require('./messages/'+l+'.json'); if (!m.reportCheck.title) throw new Error('missing reportCheck.title in '+l); } console.log('ok')"
```

Expected: `ok`.

```bash
npx tsc --noEmit && npm run lint
```

Expected: both clean. `src/components/report/ReportLookup.tsx` still exists and is still used by `/report/check` — that is correct at this point.

- [ ] **Step 5: Commit**

```bash
git add src/components/report/ReportLookupModal.tsx messages/mn.json messages/en.json messages/ru.json
git commit -m "feat(report): add ReportLookupModal, the lookup panel in a modal shell"
```

---

### Task 3: Drive the modal from `ReportHero`

Wires the hero's form to the modal and syncs the search term into the landing URL. After this task `/report` answers a lookup without leaving the page. `/report/check` still exists but nothing links to it any more.

**Files:**
- Modify: `src/components/report/ReportHero.tsx`
- Modify: `src/app/[locale]/report/page.tsx:1-10,42-62`

**Interfaces:**
- Consumes: `normalizeFor`, `validate`, `reportSearchQuery`, `SearchMode`, `SearchError` from `@/lib/reportSearch` (Task 1); `ReportLookupModal` with props `{ open, price, plate?, vin?, onClose }` (Task 2).
- Produces: `ReportHero` now takes a required prop `{ price: number }`. `/report` accepts `?plate=` and `?vin=` and opens the modal on load when either is present. Task 5 navigates to it.

- [ ] **Step 1: Prove the hero still navigates away (the failing check)**

```bash
rg -n "report/check|useTransition" src/components/report/ReportHero.tsx
```

Expected: hits on the `router.push({ pathname: "/report/check", query })` call, the prose comment above it, and the `useTransition` import/usage.

- [ ] **Step 2: Give the landing page the price**

In `src/app/[locale]/report/page.tsx`, add the import:

```tsx
import { effectiveReportPrice, getConfig } from "@/services/config";
```

and inside `ReportPage`, after `setRequestLocale(locale)`:

```tsx
  // The backend recomputes the price at purchase time, so this copy is
  // display-only. `/report` is already dynamic — the locale layout reads
  // cookies() — so the no-store fetch costs no static rendering.
  const config = await getConfig();
```

then change the render to:

```tsx
      <ReportHero price={effectiveReportPrice(config)} />
```

- [ ] **Step 3: Rewrite the hero's state, submit and URL sync**

In `src/components/report/ReportHero.tsx`:

Replace the React import with `import { useEffect, useState } from "react";` (drop `useTransition`), and add these imports next to the existing ones:

```tsx
import { reportSearchQuery } from "@/lib/reportSearch";
import ReportLookupModal from "./ReportLookupModal";
```

`reportSearchQuery` joins the `normalizeFor` / `validate` / `SearchError` / `SearchMode` import added in Task 1 — merge it into that same statement rather than adding a second one.

Add the props type above the component:

```tsx
type Props = {
  /** Effective price in MNT, resolved server-side from GET /config. */
  price: number;
};
```

Add this module-level helper below `SearchIcon`:

```tsx
/**
 * Reflect the current lookup in the URL without navigating.
 *
 * `history.replaceState` rather than next-intl's router: the modal is pure
 * client state, and a `router.replace` would re-run the landing page's server
 * component just to change a query string. The existing pathname already
 * carries the locale prefix, so it is reused as-is.
 */
function syncUrl(query: { plate?: string; vin?: string }) {
  const params = new URLSearchParams();
  if (query.plate) params.set("plate", query.plate);
  if (query.vin) params.set("vin", query.vin);
  const qs = params.toString();
  window.history.replaceState(
    null,
    "",
    qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
  );
}
```

Change the signature and replace the state block plus the mount effect (currently `:88-104`) with:

```tsx
export default function ReportHero({ price }: Props) {
  const t = useTranslations("reportLanding.hero");
  const [mode, setMode] = useState<SearchMode>("plate");
  const [value, setValue] = useState("");
  const [error, setError] = useState<SearchError>(null);
  const [sampleOpen, setSampleOpen] = useState(false);
  const [lookup, setLookup] = useState<{ plate?: string; vin?: string }>({});
  const [lookupOpen, setLookupOpen] = useState(false);

  // One-time URL read after hydration. This single path covers arriving from
  // the home panel, returning from `/auth/login`, and refreshing or sharing the
  // URL. Read from `window` rather than `useSearchParams`, which would force a
  // Suspense/CSR bailout and drag the whole landing page client-side.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const plate = params.get("plate");
    const vin = params.get("vin");
    if (!plate && !vin) return;

    const nextMode: SearchMode = plate ? "plate" : "vin";
    const next = normalizeFor(nextMode, plate ?? vin ?? "");

    /* eslint-disable react-hooks/set-state-in-effect */
    setMode(nextMode);
    setValue(next);
    setLookup(reportSearchQuery(nextMode, next));
    setLookupOpen(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);
```

Note `useRouter` is no longer used in this file — remove the `useRouter` import from `@/i18n/navigation`. The whole import line goes, since `Link` was never imported here.

Replace `handleSubmit` (currently `:112-127`, including its docblock) with:

```tsx
  /**
   * The form only validates; the lookup itself runs in the modal. The term is
   * mirrored into the URL so a refresh, a shared link and the login round-trip
   * all reopen the same result.
   */
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate(mode, value);
    setError(err);
    if (err) return;

    const query = reportSearchQuery(mode, value);
    setLookup(query);
    syncUrl(query);
    setLookupOpen(true);
  }

  function closeLookup() {
    setLookupOpen(false);
    syncUrl({});
  }
```

On the submit `Button` (currently `:245-254`), delete the `loading={isPending}` line. Everything else about the button stays.

- [ ] **Step 4: Mount the modal outside the form**

Add this as the last child of the `<section>`, immediately before its closing `</section>` tag — **not** inside the `<form>`. antd portals render into `document.body` but still bubble events through the React tree, so a modal nested in a form can hand it stray events.

```tsx
      <ReportLookupModal
        open={lookupOpen}
        price={price}
        plate={lookup.plate}
        vin={lookup.vin}
        onClose={closeLookup}
      />
```

- [ ] **Step 5: Verify**

```bash
rg -n "report/check|useTransition|isPending" src/components/report/ReportHero.tsx
```

Expected: no matches.

```bash
npx tsc --noEmit && npm run lint
```

Expected: both clean. If lint flags `react-hooks/set-state-in-effect` despite the disable block, widen the block rather than deleting the effect — the URL read genuinely has to happen after hydration.

- [ ] **Step 6: Commit**

```bash
git add src/components/report/ReportHero.tsx "src/app/[locale]/report/page.tsx"
git commit -m "feat(report): open the lookup in a modal on /report instead of navigating"
```

---

### Task 4: Delete `/report/check`

Removes the now-orphaned page, the old panel component and the four translation keys only they used.

**Files:**
- Delete: `src/app/[locale]/report/check/page.tsx`
- Delete: `src/components/report/ReportLookup.tsx`
- Modify: `src/app/[locale]/dashboard/page.tsx:35`
- Modify: `messages/mn.json`, `messages/en.json`, `messages/ru.json`

**Interfaces:**
- Consumes: the modal flow from Task 3, which fully replaces this page.
- Produces: nothing new. `/report/check` stops resolving; `/report` is the only lookup entry point.

- [ ] **Step 1: Prove the dead route is still referenced (the failing check)**

```bash
rg -n "report/check" src
```

Expected: exactly one hit — `src/app/[locale]/dashboard/page.tsx:35`. (Task 3 removed the hero's references, and `ReportLookup.tsx`'s two are about to be deleted with the file.) If any other file still points there, fix it in this task.

- [ ] **Step 2: Delete the page and the old panel**

```bash
git rm "src/app/[locale]/report/check/page.tsx" src/components/report/ReportLookup.tsx
```

- [ ] **Step 3: Repoint the dashboard quick action**

In `src/app/[locale]/dashboard/page.tsx:35`:

```tsx
      href: "/report",
```

- [ ] **Step 4: Remove the four dead translation keys**

From the `reportCheck` object in each of `messages/mn.json`, `messages/en.json`, `messages/ru.json`, delete these lines:

- `"metaTitle": …` — the page that used it is gone; the modal reads `reportCheck.title`, added in Task 2.
- `"metaDescription": …` — same.
- `"noInputTitle": …` — the modal only opens with a search term, so the empty state no longer exists.
- `"noInputBody": …` — same.

Leave every other key in `reportCheck` in place; the modal renders all of them.

- [ ] **Step 5: Verify**

```bash
rg -n "report/check|ReportLookup\b|noInputTitle|noInputBody|reportCheck.metaTitle" src messages
```

Expected: no matches. (`ReportLookupModal` does not match `ReportLookup\b` — the `\b` boundary requires a non-word character after `ReportLookup`.)

```bash
npx tsc --noEmit && npm run lint
```

Expected: both clean.

```bash
node -e "
const keys = ['metaTitle','metaDescription','noInputTitle','noInputBody'];
for (const l of ['mn','en','ru']) {
  const rc = require('./messages/'+l+'.json').reportCheck;
  for (const k of keys) if (k in rc) throw new Error(l+' still has '+k);
  if (!rc.title || !rc.foundTitle) throw new Error(l+' lost a live key');
}
console.log('ok')"
```

Expected: `ok`.

- [ ] **Step 6: Commit**

```bash
git add -A "src/app/[locale]/report" src/components/report "src/app/[locale]/dashboard/page.tsx" messages
git commit -m "refactor(report): delete /report/check now that the modal replaces it"
```

---

### Task 5: Plate/VIN switch on the home panel

Replaces the home page's single VIN input with a mode switch that matches the hero, fixing the original bug: a licence plate typed here now reaches `/report` as `?plate=` instead of a `?vin=` that cannot validate.

**Files:**
- Modify: `src/components/home/CarSearchSection.tsx` (imports, `:93`, `:268-272`, `:625-654`)
- Modify: `messages/mn.json`, `messages/en.json`, `messages/ru.json`

**Interfaces:**
- Consumes: `normalizeFor`, `validate`, `reportSearchQuery`, `SearchMode`, `SearchError` from `@/lib/reportSearch` (Task 1); the `?plate=` / `?vin=` contract on `/report` (Task 3).
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Prove the plate path is broken (the failing check)**

```bash
rg -n "onVinSubmit|vinForm" src/components/home/CarSearchSection.tsx
```

Expected: hits showing `router.push(\`/report?vin=…\`)` as the only submit path, plus the `vinForm` instance — i.e. no way to send a plate.

- [ ] **Step 2: Add the two short mode labels**

Insert into the `homeSearch.vin` object in each message file. The hero's own `reportLanding.hero.form.modeVin` ("Арлын дугаар (VIN)") wraps in this panel — it is `lg:col-span-3` of a `max-w-7xl` grid minus `p-6`, roughly 290px of content — so the panel gets its own short pair.

- `messages/mn.json` → `"modePlate": "Улсын дугаар",` and `"modeVin": "VIN",`
- `messages/en.json` → `"modePlate": "Plate",` and `"modeVin": "VIN",`
- `messages/ru.json` → `"modePlate": "Гос. номер",` and `"modeVin": "VIN",`

In the same edit, delete `"placeholder"` and `"required"` from `homeSearch.vin` in all three files. The placeholder becomes mode-dependent and validation moves to the shared `validate`, so both go unused.

- [ ] **Step 3: Add the imports and panel state**

In `src/components/home/CarSearchSection.tsx`, add:

```tsx
import {
  normalizeFor,
  reportSearchQuery,
  validate,
  type SearchError,
  type SearchMode,
} from "@/lib/reportSearch";
```

Add a translations hook next to the existing ones (`:82-87`). The four error strings and both placeholders already exist under the hero's namespace, so they are reused rather than copied across three locales:

```tsx
  const tr = useTranslations("reportLanding.hero.form");
```

Replace the `vinForm` line (`:93`):

```tsx
  const [vinForm] = Form.useForm<{ vin: string }>();
```

with:

```tsx
  const [reportMode, setReportMode] = useState<SearchMode>("plate");
  const [reportValue, setReportValue] = useState("");
  const [reportError, setReportError] = useState<SearchError>(null);
```

Keep the `Form` import — the advanced search form above still uses it.

- [ ] **Step 4: Replace the submit handler**

Replace `onVinSubmit` (`:268-272`) with:

```tsx
  const switchReportMode = (next: SearchMode) => {
    setReportMode(next);
    setReportValue("");
    setReportError(null);
  };

  /**
   * The panel only validates and hands off — `/report` owns the lookup and
   * opens its result modal from the query it finds here.
   */
  const onReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate(reportMode, reportValue);
    setReportError(err);
    if (err) return;
    router.push({
      pathname: "/report",
      query: reportSearchQuery(reportMode, reportValue),
    });
  };
```

- [ ] **Step 5: Replace the panel's form markup**

Swap the whole antd `<Form>` block at `:625-654` for a native form. antd's `Form` bought nothing here once validation moved to `validate`, and plain state makes "clear the value when the mode changes" straightforward.

```tsx
            <form onSubmit={onReportSubmit} noValidate className="mt-auto pt-8">
              <Segmented<SearchMode>
                value={reportMode}
                onChange={switchReportMode}
                options={[
                  { label: t("vin.modePlate"), value: "plate" },
                  { label: t("vin.modeVin"), value: "vin" },
                ]}
                block
                className="mb-3 bg-white/10! [&_.ant-segmented-item]:text-blue-100! [&_.ant-segmented-item-selected]:bg-white! [&_.ant-segmented-item-selected]:text-neutral-900!"
              />
              <label htmlFor="home-report-input" className="sr-only">
                {reportMode === "plate" ? tr("plateLabel") : tr("label")}
              </label>
              <Input
                id="home-report-input"
                value={reportValue}
                onChange={(e) => {
                  setReportValue(normalizeFor(reportMode, e.target.value));
                  if (reportError) setReportError(null);
                }}
                placeholder={
                  reportMode === "plate"
                    ? tr("platePlaceholder")
                    : tr("placeholder")
                }
                size="large"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={reportError ? true : undefined}
                aria-describedby={reportError ? "home-report-error" : undefined}
                className="rounded-xl! border-white/30! bg-white/95! shadow-sm! backdrop-blur"
              />
              {reportError ? (
                <p
                  id="home-report-error"
                  role="alert"
                  className="mt-2 text-[12px] font-medium text-red-300"
                >
                  {tr(`errors.${reportError}`)}
                </p>
              ) : null}
              <Button
                htmlType="submit"
                type="primary"
                size="large"
                block
                className="mt-3 rounded-xl! border-none! bg-blue-600! font-semibold! text-white! shadow-lg! hover:bg-blue-500!"
              >
                {t("vin.submit")}
              </Button>
            </form>
```

`text-red-300` rather than the project's `text-red` (`#bc1818`): the panel background is `#05122e`, where the dark custom red is barely legible. Tailwind's default red scale is still available — `RateCard.tsx:81` uses `text-red-600`.

- [ ] **Step 6: Verify**

```bash
rg -n "vinForm|onVinSubmit|vin.placeholder|vin.required" src
```

Expected: no matches.

```bash
node -e "
for (const l of ['mn','en','ru']) {
  const v = require('./messages/'+l+'.json').homeSearch.vin;
  if (!v.modePlate || !v.modeVin) throw new Error(l+' missing mode labels');
  if ('placeholder' in v || 'required' in v) throw new Error(l+' still has dead keys');
}
console.log('ok')"
```

Expected: `ok`.

```bash
npx tsc --noEmit && npm run lint
```

Expected: both clean.

- [ ] **Step 7: Commit**

```bash
git add src/components/home/CarSearchSection.tsx messages
git commit -m "fix(home): let the report panel search by licence plate, not VIN only"
```

---

### Task 6: Browser verification pass

Drives the real flow end to end. Nothing here changes code unless a scenario fails.

**Files:**
- Modify: only if a scenario fails.

**Interfaces:**
- Consumes: everything from Tasks 1-5.
- Produces: a verified flow.

- [ ] **Step 1: Read the project's verify skill**

Use the `verify` skill (`.claude/skills/verify/SKILL.md`). Key points: the dev server is usually already up on port 2500 — probe it with `curl -s -o /dev/null -w "%{http_code}" http://localhost:2500/mn` and reuse it; clicking and typing need a CDP driver over headless Chrome, not `--screenshot` alone.

- [ ] **Step 2: Confirm the route is gone and the landing still renders**

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:2500/mn/report/check
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:2500/mn/report
```

Expected: `404` then `200`.

- [ ] **Step 3: Run the seven scenarios**

Drive `http://localhost:2500/mn` and `http://localhost:2500/mn/report` over CDP:

1. Home panel, plate mode, type `1234УБН`, submit → URL becomes `/mn/report?plate=1234%D0%A3%D0%91%D0%9D` (or the unencoded equivalent) and `.ant-modal` is present in the DOM.
2. Home panel, VIN mode, a chassis number the API knows → same, with `?vin=`.
3. Home panel, plate mode, type Latin `1234YBH` → the input reads `1234УБН` before submit.
4. Home panel, plate mode, `12ABC`, submit → the `#home-report-error` paragraph renders and `window.location.pathname` is unchanged.
5. `/mn/report` hero, submit a valid plate → modal opens, `window.location.search` gains the param, closing the modal empties it again.
6. Reload `/mn/report?vin=<known chassis>` → modal is open on load with the value prefilled in the input.
7. Logged out, on a found result → the "Нэвтэрч авах" link's `href` contains `callbackUrl=%2Freport%3F…`, not `%2Freport%2Fcheck`.

Get a real chassis number for scenarios 2 and 6 from the backend rather than inventing one: `curl -s "http://tjcar-api-v2.test/api/japan?per_page=2"` and take a `data[].vin`-shaped field, or reuse a VIN from an existing report row.

- [ ] **Step 4: Screenshot the panel at both widths**

Capture `http://localhost:2500/mn` at 1440px and at 390px (via `Emulation.setDeviceMetricsOverride` — `--window-size` lies below ~485px on macOS) and check the Segmented labels do not wrap and the panel keeps its layout. Assert `document.documentElement.scrollWidth === window.innerWidth` at 390px.

- [ ] **Step 5: Report**

State each scenario's actual result. If any failed, fix it, re-run, and commit the fix with a message naming the scenario.

---

## Notes for the implementer

- **Why `history.replaceState` and not `router.replace`:** the landing page is a server component. A `router.replace` for a modal-open flag would round-trip the server for nothing, and `useSearchParams` would push the whole page into a Suspense/CSR bailout. The existing pathname already carries the locale prefix, so reusing it sidesteps locale handling entirely.
- **Why the modal sits outside the `<form>`:** antd portals render into `document.body` but events still bubble through the React tree. A modal nested inside a form has bitten this codebase before.
- **What must not regress:** the `isExistingReport` short-circuit (an already-owned VIN redirects to `/report/{id}` instead of charging again), passing the searched `chassis` rather than JPStat's `car.vin` to `createReport`, and rendering the API's 422 message as HTML.
