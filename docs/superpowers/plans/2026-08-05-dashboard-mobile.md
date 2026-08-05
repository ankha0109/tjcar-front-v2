# Dashboard Mobile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/dashboard` into an app-style grouped menu on phones, with every dashboard subpage title moved into the fixed mobile header.

**Architecture:** The split is made server-side from the `tjcar-device` cookie via `getDevice()`, never from a Tailwind breakpoint. `/dashboard` renders a new client island (`DashboardMobileMenu`) on phones and the untouched desktop tree otherwise. Subpage titles move into the `@mobileHeader` parallel-route slot through a single optional catch-all file, and `DashboardHeader` renders nothing on phones so the title is not repeated below the bar.

**Tech Stack:** Next.js 16 (App Router, parallel routes, `proxy.ts`), React 19, next-intl, TanStack Query v5, NextAuth, antd v6, Tailwind v4.

## Global Constraints

- **This repo has no test runner.** `package.json` scripts are `dev`, `build`, `start`, `lint` only. Every task verifies with `npx tsc --noEmit` and `npm run lint`, plus a real-browser check via the `verify` skill for anything visible. Do NOT introduce vitest/jest/playwright — that is out of scope for this plan.
- Dev server runs on **port 2500** (`npm run dev`).
- Routing imports (`Link`, `useRouter`, `usePathname`, `redirect`) come from `@/i18n/navigation`, never `next/link` / `next/navigation`.
- Every new message key goes into **all three** files: `messages/mn.json`, `messages/en.json`, `messages/ru.json`.
- Mobile vs desktop is decided by `getDevice()` from `@/lib/device` (reads the `tjcar-device` cookie, set in `src/proxy.ts` from the User-Agent). Never gate this UI on `md:` / `lg:`.
- Tailwind v4 in this project gates `hover:` behind `(hover:hover)`, so hover styles do nothing on a phone. Use `active:` for touch feedback on the new mobile rows.
- `cn()` uses twMerge: it strips `leading-*` when a later argument carries `text-[…]`. If a row ever needs both, write it as `text-[15px]/tight`.
- Never use `tracking-*` or `font-mono` (project preference).
- Page containers keep `mx-auto w-full max-w-7xl px-4 lg:px-6`.

---

## File Structure

**Create**

| File | Responsibility |
|---|---|
| `src/app/[locale]/@mobileHeader/dashboard/[[...rest]]/page.tsx` | Maps every `/dashboard*` path to a mobile header (title, back target, right action) |
| `src/hooks/useDashboardCounts.ts` | The three dashboard counts (bids / orders / reports) behind shared query keys |
| `src/hooks/useThemeToggle.ts` | Reads `<html data-theme>` and flips it through the `setTheme` server action |
| `src/lib/contact.ts` | The support phone number, in one place |
| `src/components/dashboard/mobile/icons.tsx` | The ten line icons the mobile menu uses |
| `src/components/dashboard/mobile/MobileMenuRow.tsx` | One menu row: icon + label + badge/switch + chevron |
| `src/components/dashboard/mobile/MobileMenuGroup.tsx` | Uppercase group heading + the white card its rows sit in |
| `src/components/dashboard/mobile/MobileAccountCard.tsx` | Avatar, name, balance, Premium state, top-up button |
| `src/components/dashboard/mobile/DashboardMobileMenu.tsx` | Composes the whole mobile `/dashboard` screen and owns the top-up drawer |

**Modify**

| File | Change |
|---|---|
| `messages/{mn,en,ru}.json` | New `dashboard.mobile.*` keys |
| `src/components/layout/mobile/MobileHeader.tsx` | Let `right={null}` mean "no right action" |
| `src/components/dashboard/DashboardHeader.tsx` | Render nothing on phones |
| `src/components/dashboard/DashboardStats.tsx` | Consume `useDashboardCounts` |
| `src/components/layout/mobile/MobileDrawer.tsx` | Consume `useThemeToggle` and `src/lib/contact.ts` |
| `src/app/[locale]/dashboard/page.tsx` | Branch on device |
| `src/app/[locale]/dashboard/layout.tsx` | Skip the sidebar on phones, tighten vertical padding |
| `CLAUDE.md` | Document the `@mobileHeader` slot convention |

**Not touched:** `dashboard/bids/`, `dashboard/bids/[id]/`, `dashboard/orders/`, `dashboard/orders/[id]/`, `dashboard/reports/`, `dashboard/profile/`, `Sidebar.tsx`, `WalletBalanceCard.tsx`, `WalletSection.tsx`, `WalletTopUpDrawer.tsx`.

---

### Task 1: Translations and the `MobileHeader` right slot

**Files:**
- Modify: `messages/mn.json`, `messages/en.json`, `messages/ru.json`
- Modify: `src/components/layout/mobile/MobileHeader.tsx:154`

**Interfaces:**
- Consumes: nothing.
- Produces: message keys `dashboard.mobile.title`, `dashboard.mobile.groupActivity`, `dashboard.mobile.groupLists`, `dashboard.mobile.groupAccount`, `dashboard.mobile.groupSupport`. `MobileHeader` accepts `right={null}` meaning "render no right-hand action".

- [ ] **Step 1: Add `dashboard.mobile` to `messages/mn.json`**

Insert as a new key inside the top-level `"dashboard"` object, immediately after the `"sidebar"` block:

```json
    "mobile": {
      "title": "Хэрэглэгчийн булан",
      "groupActivity": "Миний үйл ажиллагаа",
      "groupLists": "Миний жагсаалт",
      "groupAccount": "Бүртгэл",
      "groupSupport": "Тусламж"
    },
```

- [ ] **Step 2: Add the same block to `messages/en.json`**

Same position inside `"dashboard"`:

```json
    "mobile": {
      "title": "My account",
      "groupActivity": "My activity",
      "groupLists": "My lists",
      "groupAccount": "Account",
      "groupSupport": "Support"
    },
```

- [ ] **Step 3: Add the same block to `messages/ru.json`**

```json
    "mobile": {
      "title": "Личный кабинет",
      "groupActivity": "Моя активность",
      "groupLists": "Мои списки",
      "groupAccount": "Аккаунт",
      "groupSupport": "Поддержка"
    },
```

- [ ] **Step 4: Verify all three files still parse and carry the same key set**

Run:

```bash
node -e '
const keys = ["title","groupActivity","groupLists","groupAccount","groupSupport"];
for (const l of ["mn","en","ru"]) {
  const m = require("./messages/" + l + ".json");
  const missing = keys.filter(k => !m.dashboard.mobile?.[k]);
  console.log(l, missing.length ? "MISSING " + missing.join(",") : "ok");
}'
```

Expected: `mn ok`, `en ok`, `ru ok`. A JSON syntax error throws here instead of at runtime.

- [ ] **Step 5: Let `right={null}` suppress the compare icon in `MobileHeader`**

In `src/components/layout/mobile/MobileHeader.tsx`, find this line inside the `<header>` element:

```tsx
        {right ?? <DefaultRight />}
```

Replace it with:

```tsx
        {/* `??` would swallow an explicit `right={null}`, so compare is the
            default only when the prop is genuinely absent. The dashboard passes
            `null`: a "compare cars" button has no business on an account
            screen. */}
        {right === undefined ? <DefaultRight /> : right}
```

Then extend the `right` line in the `Props` type from:

```tsx
  right?: ReactNode;
```

to:

```tsx
  /** Right-hand action. Omit for the compare tray; pass `null` for none. */
  right?: ReactNode;
```

- [ ] **Step 6: Confirm no existing caller passes `right`**

Run: `grep -rn -A 8 "<MobileHeader" src | grep "right=" || echo "NO CALLER PASSES right"`
Expected: `NO CALLER PASSES right` — every current `<MobileHeader>` omits the prop, so behaviour is unchanged.

- [ ] **Step 7: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit 0.

- [ ] **Step 8: Commit**

```bash
git add messages/mn.json messages/en.json messages/ru.json src/components/layout/mobile/MobileHeader.tsx
git commit -m "feat(dashboard): mobile menu strings, opt-out right slot on MobileHeader"
```

---

### Task 2: Dashboard titles in the mobile header

**Files:**
- Create: `src/app/[locale]/@mobileHeader/dashboard/[[...rest]]/page.tsx`
- Modify: `src/components/dashboard/DashboardHeader.tsx`

**Interfaces:**
- Consumes: `right={null}` support and `dashboard.mobile.title` from Task 1.
- Produces: `DashboardHeader` is now an **async** server component returning `null` on phones. Nothing else imports from these files.

- [ ] **Step 1: Confirm `DashboardHeader` is only used from server components**

Run: `grep -rn "DashboardHeader" src`
Expected: the component file plus six `src/app/[locale]/dashboard/**/page.tsx` imports, all of them server components (no `"use client"` at the top). If any client component shows up, stop — an async component cannot be rendered from a client component and the plan needs revisiting.

- [ ] **Step 2: Create the header slot**

Create `src/app/[locale]/@mobileHeader/dashboard/[[...rest]]/page.tsx`:

```tsx
import type { ReactNode } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import MobileHeader from "@/components/layout/mobile/MobileHeader";
import { Link } from "@/i18n/navigation";
import { getDevice } from "@/lib/device";

type Props = {
  params: Promise<{ locale: string; rest?: string[] }>;
};

/**
 * Every dashboard title, in one file.
 *
 * The lot detail slots (`japan/[id]` and friends) each fetch the car they name,
 * which is why they are separate routes. A dashboard title is always a static
 * translation, so an optional catch-all can cover `/dashboard` and everything
 * under it at once. A segment that is not handled below still gets a working
 * header — back arrow, no title — rather than falling through to the logo.
 */
export default async function MobileHeaderDashboard({ params }: Props) {
  const { locale, rest } = await params;
  setRequestLocale(locale);
  const device = await getDevice();
  if (device !== "mobile") return null;

  const t = await getTranslations("dashboard");

  // `/dashboard` itself is the account screen, so it keeps the logo and the
  // hamburger and takes no back arrow — the bottom nav is the way out.
  if (!rest?.length) {
    return (
      <MobileHeader title={t("mobile.title")} right={null} menuButton />
    );
  }

  const [section, id] = rest;

  let title: string | undefined;
  let backHref = "/dashboard";
  let right: ReactNode = null;

  switch (section) {
    case "bids":
      title = id ? t("bidDetail.title") : t("bids.title");
      if (id) backHref = "/dashboard/bids";
      break;
    case "orders":
      title = id ? t("orderDetail.title") : t("orders.title");
      if (id) backHref = "/dashboard/orders";
      break;
    case "reports":
      title = t("reports.title");
      // The desktop page renders this as a labelled button next to its <h1>;
      // on a phone the <h1> is this header, so the action comes with it.
      right = <NewReportAction label={t("reports.newReport")} />;
      break;
    case "profile":
      title = t("profile.title");
      break;
    // Anything else (`/dashboard/wallet`, which redirects, or a route added
    // later without a case here) keeps a bare back arrow.
  }

  return <MobileHeader back={{ href: backHref }} title={title} right={right} />;
}

function NewReportAction({ label }: { label: string }) {
  return (
    <Link
      href="/report"
      aria-label={label}
      className="-mr-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-700 active:bg-neutral-100 dark:text-neutral-200 dark:active:bg-neutral-900"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    </Link>
  );
}
```

- [ ] **Step 3: Make `DashboardHeader` stand down on phones**

Replace the whole of `src/components/dashboard/DashboardHeader.tsx` with:

```tsx
import { getDevice } from "@/lib/device";

type Props = {
  title: string;
  action?: React.ReactNode;
};

/**
 * The page title, on desktop only.
 *
 * On phones the very same title is rendered by the `@mobileHeader/dashboard`
 * slot inside the fixed bar, so repeating it here would ship two headings and
 * burn a chunk of a small screen. `action` goes with it: the mobile header
 * carries its own (the reports page's "new report" plus).
 */
export default async function DashboardHeader({ title, action }: Props) {
  const device = await getDevice();
  if (device === "mobile") return null;

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
```

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit 0.

- [ ] **Step 5: Verify in a real browser**

Use the `verify` skill to start the app (`npm run dev`, port 2500). Force the phone shell by setting the cookie `tjcar-device=mobile` on `localhost:2500` before loading (the proxy sets it from the User-Agent, so a desktop UA otherwise gets the desktop shell), and use CDP `setDeviceMetricsOverride` at 390×844 — `--window-size` below ~485px lies on macOS.

Sign in, then check each of these:

| URL | Expected header |
|---|---|
| `/mn/dashboard/bids` | ← back arrow, "Миний саналууд", **no** compare icon, no `<h1>` in the page body |
| `/mn/dashboard/bids/<id>` | ← back arrow, "Саналын дэлгэрэнгүй", back goes to `/mn/dashboard/bids` |
| `/mn/dashboard/orders` | ← back arrow, "Захиалсан машин" |
| `/mn/dashboard/reports` | ← back arrow, "Миний репортууд", **＋** on the right → `/mn/report` |
| `/mn/dashboard/profile` | ← back arrow, "Профайл" |

Then flip the cookie to `tjcar-device=desktop` and confirm `/mn/dashboard/reports` still shows its own `<h1>` and its full-width "Шинэ репорт" button.

- [ ] **Step 6: Commit**

```bash
git add "src/app/[locale]/@mobileHeader/dashboard" src/components/dashboard/DashboardHeader.tsx
git commit -m "feat(dashboard): dashboard titles in the mobile header"
```

---

### Task 3: `useDashboardCounts`

**Files:**
- Create: `src/hooks/useDashboardCounts.ts`
- Modify: `src/components/dashboard/DashboardStats.tsx`

**Interfaces:**
- Consumes: `Api` (`@/services/Api`), `listOrders` (`@/services/orders`), `listReports` (`@/services/reports`) — all already used by `DashboardStats`.
- Produces: `useDashboardCounts(): DashboardCounts` where
  `DashboardCounts = { bids: number | undefined; bidsPending: number | undefined; orders: number | undefined; reports: number | undefined }`.
  Every field is `undefined` until its query resolves. Task 7 renders these as badges.

- [ ] **Step 1: Create the hook**

Create `src/hooks/useDashboardCounts.ts`:

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Api from "@/services/Api";
import { listOrders } from "@/services/orders";
import { listReports } from "@/services/reports";

type StatsResponse = {
  data: {
    requests: number;
    requests_win: number;
    requests_pending: number;
  };
};

export type DashboardCounts = {
  /** Total bids sent. `undefined` until `GET /stats` lands. */
  bids: number | undefined;
  /** Of those, how many are still awaiting a result. */
  bidsPending: number | undefined;
  orders: number | undefined;
  reports: number | undefined;
};

/**
 * The three numbers the dashboard counts.
 *
 * Kept in one hook so the desktop stat cards and the mobile menu badges can
 * never quote different figures — same query keys, same staleTime, one cache
 * entry each. `GET /stats` owns the bid numbers; the orders and reports totals
 * are read from the paginator meta of a single-row page, which is cheaper than
 * adding a server-side counter for one figure apiece.
 */
export function useDashboardCounts(): DashboardCounts {
  const { status } = useSession();
  const enabled = status === "authenticated";

  const bidStats = useQuery({
    queryKey: ["stats", "bids"],
    queryFn: () => Api.get<StatsResponse>("/stats"),
    enabled,
    staleTime: 30_000,
  });

  const orders = useQuery({
    queryKey: ["stats", "orders"],
    queryFn: () => listOrders(1, 1),
    enabled,
    staleTime: 30_000,
  });

  const reports = useQuery({
    queryKey: ["stats", "reports"],
    queryFn: () => listReports(1, 1),
    enabled,
    staleTime: 30_000,
  });

  return {
    bids: bidStats.data?.data.requests,
    bidsPending: bidStats.data?.data.requests_pending,
    orders: orders.data?.meta.total,
    reports: reports.data?.meta.total,
  };
}
```

- [ ] **Step 2: Point `DashboardStats` at the hook**

Replace the whole of `src/components/dashboard/DashboardStats.tsx` with:

```tsx
"use client";

import { useTranslations } from "next-intl";
import { useDashboardCounts } from "@/hooks/useDashboardCounts";
import StatCard from "./StatCard";

/**
 * Overview counts, desktop only — phones get the same numbers as badges on the
 * mobile menu. Both read {@link useDashboardCounts}, so the two can never
 * disagree.
 */
export default function DashboardStats() {
  const t = useTranslations("dashboard.home");
  const counts = useDashboardCounts();

  // Same wrapper element and classes the server page used, so the grid does not shift.
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        label={t("stats.bidsLabel")}
        value={counts.bids ?? "—"}
        hint={t("stats.bidsHint", { count: counts.bidsPending ?? 0 })}
        href="/dashboard/bids"
      />
      <StatCard
        label={t("stats.ordersLabel")}
        value={counts.orders ?? "—"}
        hint={t("stats.ordersHint")}
        href="/dashboard/orders"
      />
      <StatCard
        label={t("stats.reportsLabel")}
        value={counts.reports ?? "—"}
        hint={t("stats.reportsHint")}
        href="/dashboard/reports"
      />
    </section>
  );
}
```

- [ ] **Step 3: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit 0.

- [ ] **Step 4: Verify the desktop cards are unchanged**

With the `verify` skill and cookie `tjcar-device=desktop`, load `/mn/dashboard` signed in. The three stat cards must show the same numbers and the same hint text as before the refactor (bids hint reads "N хүлээгдэж байна"). Before the queries resolve each card shows `—`.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useDashboardCounts.ts src/components/dashboard/DashboardStats.tsx
git commit -m "refactor(dashboard): share the stat counts through useDashboardCounts"
```

---

### Task 4: `useThemeToggle` and the shared contact number

**Files:**
- Create: `src/hooks/useThemeToggle.ts`
- Create: `src/lib/contact.ts`
- Modify: `src/components/layout/mobile/MobileDrawer.tsx`

**Interfaces:**
- Consumes: `setTheme` (`@/app/actions/theme`), `Theme` (`@/lib/theme`).
- Produces:
  - `useThemeToggle(): { theme: Theme; isPending: boolean; toggle: (dark: boolean) => void }`
  - `CONTACT_PHONE_RAW = "+97675115888"` and `CONTACT_PHONE_DISPLAY = "+976 7511-5888"` from `@/lib/contact`.

- [ ] **Step 1: Create the theme hook**

Create `src/hooks/useThemeToggle.ts`:

```ts
"use client";

import { useSyncExternalStore, useTransition } from "react";
import { setTheme } from "@/app/actions/theme";
import { useRouter } from "@/i18n/navigation";
import type { Theme } from "@/lib/theme";

// Reads the active theme straight from <html data-theme> (set server-side and
// re-rendered on router.refresh()), so a toggle stays in sync with the DOM
// without prop-drilling `theme` through the mobile-header parallel-route slots.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

export type UseThemeToggleResult = {
  theme: Theme;
  /** The server action is in flight — drive a Switch's `loading` with this. */
  isPending: boolean;
  /** `true` switches to dark. */
  toggle: (dark: boolean) => void;
};

/**
 * The dark-mode switch, shared by the hamburger drawer and the dashboard menu.
 * The cookie is written by a server action, then `router.refresh()` re-renders
 * the tree so `<html data-theme>` — and every server component that reads the
 * theme — follows.
 */
export function useThemeToggle(): UseThemeToggleResult {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = (dark: boolean) => {
    startTransition(async () => {
      await setTheme(dark ? "dark" : "light");
      router.refresh();
    });
  };

  return { theme, isPending, toggle };
}
```

- [ ] **Step 2: Create the contact constants**

Create `src/lib/contact.ts`:

```ts
/** Support line. Two renderings of one number — keep them in step. */
export const CONTACT_PHONE_RAW = "+97675115888";
export const CONTACT_PHONE_DISPLAY = "+976 7511-5888";
```

- [ ] **Step 3: Rewire `MobileDrawer` onto both**

In `src/components/layout/mobile/MobileDrawer.tsx`:

1. Change the React import line

```tsx
import { useSyncExternalStore, useTransition } from "react";
```

to remove it entirely (no other React hooks are used in this file).

2. Delete the local phone constants:

```tsx
const CONTACT_PHONE_RAW = "+97675115888";
const CONTACT_PHONE_DISPLAY = "+976 7511-5888";
```

3. Delete the four theme helpers and their comment block — everything from

```tsx
// Reads the active theme straight from <html data-theme> (set server-side and
```

down to the closing brace of

```tsx
function getServerThemeSnapshot(): Theme {
  return "light";
}
```

4. Delete the `Theme` type import (`import type { Theme } from "@/lib/theme";`) and the `setTheme` import (`import { setTheme } from "@/app/actions/theme";`) — the hook owns both now.

5. Add these imports alongside the existing ones:

```tsx
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_RAW } from "@/lib/contact";
import { useThemeToggle } from "@/hooks/useThemeToggle";
```

6. Inside `MobileDrawer`, replace

```tsx
  const [isThemePending, startThemeTransition] = useTransition();
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  const onToggleTheme = (checked: boolean) => {
    startThemeTransition(async () => {
      await setTheme(checked ? "dark" : "light");
      router.refresh();
    });
  };
```

with

```tsx
  const {
    theme,
    isPending: isThemePending,
    toggle: onToggleTheme,
  } = useThemeToggle();
```

Leave the `<Switch>` markup that consumes `theme`, `isThemePending` and `onToggleTheme` exactly as it is.

- [ ] **Step 4: Check `router` is still used**

Run: `grep -n "router" src/components/layout/mobile/MobileDrawer.tsx`
Expected: if the only remaining hit is `const router = useRouter();`, delete that line and the `useRouter` import (keep `Link`). Lint would flag it otherwise.

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit 0.

- [ ] **Step 6: Verify the drawer still works**

With the `verify` skill and cookie `tjcar-device=mobile` at 390×844, open any page, tap ☰, and:
- flip "Шөнийн горим" — the page must go dark and the switch stay on after the refresh
- flip it back — the page returns to light
- confirm the phone row still reads `+976 7511-5888` and its `href` is `tel:+97675115888`

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useThemeToggle.ts src/lib/contact.ts src/components/layout/mobile/MobileDrawer.tsx
git commit -m "refactor(mobile): extract useThemeToggle and the contact number"
```

---

### Task 5: Menu primitives

**Files:**
- Create: `src/components/dashboard/mobile/icons.tsx`
- Create: `src/components/dashboard/mobile/MobileMenuRow.tsx`
- Create: `src/components/dashboard/mobile/MobileMenuGroup.tsx`

**Interfaces:**
- Consumes: `Link` (`@/i18n/navigation`), `cn` (`@/utils`).
- Produces:
  - Icons: `GavelIcon`, `TruckIcon`, `DocumentIcon`, `HeartIcon`, `CompareIcon`, `UserIcon`, `MoonIcon`, `PhoneIcon`, `MailIcon`, `PowerIcon` — each `(props: React.SVGProps<SVGSVGElement>) => ReactElement`, sized by the caller's `className`.
  - `MobileMenuRow` props: `{ icon: ReactNode; label: string; badge?: number; trailing?: ReactNode; href?: string; external?: string; onClick?: () => void; danger?: boolean }`.
  - `MobileMenuGroup` props: `{ title?: string; children: ReactNode }`.

- [ ] **Step 1: Create the icon set**

Create `src/components/dashboard/mobile/icons.tsx`:

```tsx
import type { SVGProps } from "react";

// One stroke weight for the whole menu — the rows read as a single list, so a
// mixed-weight icon column is the first thing that looks wrong.
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export const GavelIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}>
    <path d="m14.5 12.5-8 8a2.119 2.119 0 1 1-3-3l8-8" />
    <path d="m16 16 6-6" />
    <path d="m8 8 6-6" />
    <path d="m9 7 8 8" />
    <path d="m21 11-8-8" />
  </svg>
);

export const TruckIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}>
    <path d="M10 17h4V5H2v12h3" />
    <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1" />
    <circle cx="7.5" cy="17.5" r="2.5" />
    <circle cx="17.5" cy="17.5" r="2.5" />
  </svg>
);

export const DocumentIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="9" x2="15" y1="13" y2="13" />
    <line x1="9" x2="15" y1="17" y2="17" />
  </svg>
);

export const HeartIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

export const CompareIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}>
    <path d="M3 7h13l-3-3" />
    <path d="M21 17H8l3 3" />
  </svg>
);

export const UserIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21v-1a7 7 0 0 1 7-7h2a7 7 0 0 1 7 7v1" />
  </svg>
);

export const MoonIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export const PhoneIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
  </svg>
);

export const MailIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

export const PowerIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}>
    <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
    <line x1="12" x2="12" y1="2" y2="12" />
  </svg>
);

export const ChevronIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
```

- [ ] **Step 2: Create the row**

Create `src/components/dashboard/mobile/MobileMenuRow.tsx`:

```tsx
"use client";

import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/utils";
import { ChevronIcon } from "./icons";

type Props = {
  /** Line icon, already sized and coloured by the caller. */
  icon: ReactNode;
  label: string;
  /** Count on the right. Hidden when 0 or undefined — a zero says nothing. */
  badge?: number;
  /** Replaces the chevron (a Switch, say). Makes the row non-navigating. */
  trailing?: ReactNode;
  /** Internal route. Exclusive with `external` and `onClick`. */
  href?: string;
  /** `tel:` or an absolute URL — rendered as a plain anchor. */
  external?: string;
  onClick?: () => void;
  /** Destructive styling, and no chevron: this row leaves rather than goes. */
  danger?: boolean;
};

/**
 * One row of the mobile dashboard menu.
 *
 * Touch feedback is `active:`, not `hover:` — Tailwind v4 gates hover behind
 * `(hover:hover)` in this project, so a hover style is invisible on a phone.
 */
export default function MobileMenuRow({
  icon,
  label,
  badge,
  trailing,
  href,
  external,
  onClick,
  danger,
}: Props) {
  const inner = (
    <>
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center",
          danger && "text-rose-500",
        )}
      >
        {icon}
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-[15px]",
          danger
            ? "text-rose-600 dark:text-rose-400"
            : "text-neutral-900 dark:text-neutral-100",
        )}
      >
        {label}
      </span>
      {badge ? (
        <span className="shrink-0 rounded-full bg-neutral-100 px-2 text-[12px] font-semibold leading-5 tabular-nums text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
      {trailing ? (
        trailing
      ) : danger ? null : (
        <ChevronIcon className="h-3.5 w-3.5 shrink-0 text-neutral-300 dark:text-neutral-600" />
      )}
    </>
  );

  const className = cn(
    "flex min-h-[52px] w-full items-center gap-3 px-4 py-2 text-left",
    (href || external || onClick) &&
      "active:bg-neutral-50 dark:active:bg-neutral-900",
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  if (external) {
    return (
      <a href={external} className={className}>
        {inner}
      </a>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {inner}
      </button>
    );
  }

  return <div className={className}>{inner}</div>;
}
```

- [ ] **Step 3: Create the group**

Create `src/components/dashboard/mobile/MobileMenuGroup.tsx`:

```tsx
import type { ReactNode } from "react";
import { cn } from "@/utils";

type Props = {
  /** Uppercase heading above the card. Omit for a standalone card. */
  title?: string;
  children: ReactNode;
};

/**
 * A titled block of {@link MobileMenuRow}s — the iOS-settings shape: a small
 * grey heading over one white card with hairlines between its rows.
 *
 * The vertical rhythm lives here rather than on the parent so an untitled card
 * (sign out) keeps the same gap a titled one gets from its heading.
 */
export default function MobileMenuGroup({ title, children }: Props) {
  return (
    <section>
      {title ? (
        <h2 className="px-1 pb-2 pt-5 text-[11px] font-semibold uppercase text-neutral-400 dark:text-neutral-500">
          {title}
        </h2>
      ) : null}
      <div
        className={cn(
          "divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900",
          !title && "mt-5",
        )}
      >
        {children}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit 0. Nothing imports these yet, so there is nothing to see in a browser until Task 7.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/mobile
git commit -m "feat(dashboard): mobile menu row, group and icons"
```

---

### Task 6: The account card

**Files:**
- Create: `src/components/dashboard/mobile/MobileAccountCard.tsx`

**Interfaces:**
- Consumes: `useWalletBalance` and `WALLET_BALANCE_KEY` (`@/hooks/useWalletBalance`), `MINIMUM_BALANCE` and `formatMnt` (`@/lib/bidConfig`), `BrandButton` (`@/components/ui/BrandButton`), the `dashboard.wallet.*` messages.
- Produces: `MobileAccountCard` props `{ onTopUp: () => void }`. Task 7 passes the drawer opener.

- [ ] **Step 1: Create the card**

Create `src/components/dashboard/mobile/MobileAccountCard.tsx`:

```tsx
"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import BrandButton from "@/components/ui/BrandButton";
import { useWalletBalance, WALLET_BALANCE_KEY } from "@/hooks/useWalletBalance";
import { MINIMUM_BALANCE, formatMnt } from "@/lib/bidConfig";
import { cn } from "@/utils";

// Same shape MobileDrawer casts the session user to — the augmented next-auth
// type does not surface these fields here.
type CustomerUser = {
  firstname?: string;
  lastname?: string;
  name?: string;
};

type Props = {
  /** Opens the top-up drawer, which the parent owns. */
  onTopUp: () => void;
};

/**
 * The phone's version of {@link WalletBalanceCard}: who you are and what you
 * can spend, in one card that has to leave room for the menu underneath it.
 *
 * That is why the desktop card's four-line "what Premium buys you" list is not
 * here — the top-up drawer makes the same argument at the moment it matters.
 * The progress bar stays: below the threshold the number alone does not say
 * how far off bidding is.
 */
export default function MobileAccountCard({ onTopUp }: Props) {
  const t = useTranslations("dashboard.wallet");
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const user = session?.user as CustomerUser | undefined;
  const { balance, isFetching, isAuthenticated } = useWalletBalance();

  const isPremium = balance >= MINIMUM_BALANCE;
  const missing = Math.max(MINIMUM_BALANCE - balance, 0);
  const progress = Math.min(Math.round((balance / MINIMUM_BALANCE) * 100), 100);

  const fullName =
    [user?.firstname, user?.lastname].filter(Boolean).join(" ") ||
    user?.name ||
    "";
  const initials =
    `${user?.firstname?.[0] ?? ""}${user?.lastname?.[0] ?? ""}`.toUpperCase() ||
    "U";

  // `/dashboard` sits behind the proxy auth guard, so this is only the blink
  // before the session hydrates on the client.
  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="h-10 w-40 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
        <div className="mt-4 h-9 w-48 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
      </div>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      {/* Warm brand haze in the corner — the one bit of colour on an otherwise
          neutral screen, so the balance reads as its subject. */}
      <div
        className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />

      <div className="relative flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900">
          {initials}
        </span>
        {fullName && (
          <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
            {fullName}
          </p>
        )}
        <button
          type="button"
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: WALLET_BALANCE_KEY })
          }
          disabled={isFetching}
          aria-label={t("refresh")}
          className="ml-auto inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 disabled:opacity-60 dark:border-neutral-700 dark:text-neutral-400"
        >
          <RefreshIcon className={isFetching ? "animate-spin" : undefined} />
        </button>
      </div>

      <div className="relative mt-4">
        <p className="text-[11px] font-semibold uppercase text-neutral-500 dark:text-neutral-400">
          {t("balanceLabel")}
        </p>
        <p className="mt-1 text-[32px] font-semibold leading-none tabular-nums text-neutral-900 dark:text-neutral-100">
          {formatMnt(balance)}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span
            className={cn(
              "h-1.5 w-1.5 shrink-0 rounded-full",
              isPremium ? "bg-emerald-500" : "bg-amber-500",
            )}
            aria-hidden
          />
          <p className="text-[13px] text-neutral-600 dark:text-neutral-400">
            {isPremium
              ? t("premiumActive")
              : t("shortBy", { amount: formatMnt(missing) })}
          </p>
        </div>
      </div>

      {!isPremium && (
        <div className="relative mt-4">
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t("progressAria")}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${Math.max(progress, 2)}%` }}
            />
          </div>
          <p className="mt-2 text-[12px] text-neutral-500 dark:text-neutral-400">
            {t("minimumHint", { amount: formatMnt(MINIMUM_BALANCE) })}
          </p>
        </div>
      )}

      <div className="relative mt-5">
        <BrandButton block size="large" onClick={onTopUp}>
          {t("topUp")}
        </BrandButton>
      </div>
    </section>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <polyline points="21 3 21 9 15 9" />
    </svg>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/mobile/MobileAccountCard.tsx
git commit -m "feat(dashboard): mobile account card"
```

---

### Task 7: Assemble the mobile dashboard

**Files:**
- Create: `src/components/dashboard/mobile/DashboardMobileMenu.tsx`
- Modify: `src/app/[locale]/dashboard/page.tsx`
- Modify: `src/app/[locale]/dashboard/layout.tsx`

**Interfaces:**
- Consumes: `MobileAccountCard`, `MobileMenuGroup`, `MobileMenuRow` and the icons (Task 5–6); `useDashboardCounts` (Task 3); `useThemeToggle` and `CONTACT_PHONE_*` (Task 4); `dashboard.mobile.*` (Task 1); `WalletTopUpDrawer` (`@/components/wallet/WalletTopUpDrawer`, existing, props `{ open: boolean; onClose: () => void }`); `useWishlist().count`, `useCompare().count`.
- Produces: `DashboardMobileMenu` props `{ openTopUp?: boolean }`. Nothing consumes it beyond the dashboard index.

- [ ] **Step 1: Create the screen**

Create `src/components/dashboard/mobile/DashboardMobileMenu.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Switch } from "antd";
import { signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import WalletTopUpDrawer from "@/components/wallet/WalletTopUpDrawer";
import { useCompare } from "@/hooks/useCompare";
import { useDashboardCounts } from "@/hooks/useDashboardCounts";
import { useThemeToggle } from "@/hooks/useThemeToggle";
import { useWishlist } from "@/hooks/useWishlist";
import { usePathname, useRouter } from "@/i18n/navigation";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_RAW } from "@/lib/contact";
import MobileAccountCard from "./MobileAccountCard";
import MobileMenuGroup from "./MobileMenuGroup";
import MobileMenuRow from "./MobileMenuRow";
import {
  CompareIcon,
  DocumentIcon,
  GavelIcon,
  HeartIcon,
  MailIcon,
  MoonIcon,
  PhoneIcon,
  PowerIcon,
  TruckIcon,
  UserIcon,
} from "./icons";

/** Every row's icon is the same size; only the colour differs. */
const ICON = "h-[18px] w-[18px]";

type Props = {
  /** From `?topup=1` — deep links land straight in the top-up flow. */
  openTopUp?: boolean;
};

/**
 * `/dashboard` on a phone: the account screen a banking app would open with.
 *
 * The desktop tree (balance card, stat grid, recent bids, cars in transit) is
 * reached through the sidebar, which phones never get — so instead of stacking
 * four sections a customer has to scroll past, the numbers ride along as
 * badges on the rows that lead to them.
 */
export default function DashboardMobileMenu({ openTopUp = false }: Props) {
  const t = useTranslations("dashboard");
  const tHeader = useTranslations("header");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [topUpOpen, setTopUpOpen] = useState(openTopUp);
  const counts = useDashboardCounts();
  const { count: wishlistCount } = useWishlist();
  const { count: compareCount } = useCompare();
  const {
    theme,
    isPending: isThemePending,
    toggle: toggleTheme,
  } = useThemeToggle();

  // Closing drops `?topup=1`, otherwise a refresh — or the back button — would
  // reopen the drawer. Same contract WalletSection keeps on desktop.
  const closeTopUp = () => {
    setTopUpOpen(false);
    if (openTopUp) router.replace(pathname);
  };

  return (
    // A plain wrapper, not a fragment: the layout's content column applies
    // `space-y-8` to its element children, and a fragment would flatten every
    // card into that spacing.
    <div>
      <MobileAccountCard onTopUp={() => setTopUpOpen(true)} />

      <MobileMenuGroup title={t("mobile.groupActivity")}>
        <MobileMenuRow
          icon={<GavelIcon className={`${ICON} text-neutral-500`} />}
          label={t("bids.title")}
          badge={counts.bids}
          href="/dashboard/bids"
        />
        <MobileMenuRow
          icon={<TruckIcon className={`${ICON} text-neutral-500`} />}
          label={t("orders.title")}
          badge={counts.orders}
          href="/dashboard/orders"
        />
        <MobileMenuRow
          icon={<DocumentIcon className={`${ICON} text-neutral-500`} />}
          label={t("reports.title")}
          badge={counts.reports}
          href="/dashboard/reports"
        />
      </MobileMenuGroup>

      <MobileMenuGroup title={t("mobile.groupLists")}>
        <MobileMenuRow
          icon={<HeartIcon className={`${ICON} text-rose-500`} />}
          label={tHeader("wishlist")}
          badge={wishlistCount}
          href="/wishlist"
        />
        <MobileMenuRow
          icon={<CompareIcon className={`${ICON} text-neutral-500`} />}
          label={tHeader("compare")}
          badge={compareCount}
          href="/compare"
        />
      </MobileMenuGroup>

      <MobileMenuGroup title={t("mobile.groupAccount")}>
        <MobileMenuRow
          icon={<UserIcon className={`${ICON} text-neutral-500`} />}
          label={t("profile.title")}
          href="/dashboard/profile"
        />
        <MobileMenuRow
          icon={<MoonIcon className={`${ICON} text-indigo-500`} />}
          label={tHeader("theme.darkMode")}
          trailing={
            <Switch
              size="small"
              checked={theme === "dark"}
              loading={isThemePending}
              onChange={toggleTheme}
              aria-label={
                theme === "dark"
                  ? tHeader("theme.switchToLight")
                  : tHeader("theme.switchToDark")
              }
            />
          }
        />
      </MobileMenuGroup>

      <MobileMenuGroup title={t("mobile.groupSupport")}>
        <MobileMenuRow
          icon={<PhoneIcon className={`${ICON} text-emerald-500`} />}
          label={CONTACT_PHONE_DISPLAY}
          external={`tel:${CONTACT_PHONE_RAW}`}
        />
        <MobileMenuRow
          icon={<MailIcon className={`${ICON} text-sky-500`} />}
          label={tHeader("topbar.contact.label")}
          href="/about"
        />
      </MobileMenuGroup>

      <MobileMenuGroup>
        <MobileMenuRow
          icon={<PowerIcon className={ICON} />}
          label={tHeader("menu.signout")}
          danger
          onClick={() => signOut({ callbackUrl: `/${locale}` })}
        />
      </MobileMenuGroup>

      <WalletTopUpDrawer open={topUpOpen} onClose={closeTopUp} />
    </div>
  );
}
```

- [ ] **Step 2: Branch the dashboard index**

Replace the whole of `src/app/[locale]/dashboard/page.tsx` with:

```tsx
import { setRequestLocale } from "next-intl/server";
import DashboardActiveOrders from "@/components/dashboard/DashboardActiveOrders";
import DashboardRecentBids from "@/components/dashboard/DashboardRecentBids";
import DashboardStats from "@/components/dashboard/DashboardStats";
import DashboardMobileMenu from "@/components/dashboard/mobile/DashboardMobileMenu";
import WalletSection from "@/components/wallet/WalletSection";
import { getDevice } from "@/lib/device";

export default async function DashboardIndex({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ topup?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  // `?topup=1` (from the bid gate, the Premium modal and the old /dashboard/wallet
  // URL) opens the top-up drawer on arrival.
  const { topup } = await searchParams;
  const device = await getDevice();

  // On a phone this route is the account screen: a balance summary over a
  // grouped menu. The desktop tree below is reached through the sidebar, which
  // phones never see, so the two never have to agree on a layout.
  if (device === "mobile") {
    return <DashboardMobileMenu openTopUp={topup === "1"} />;
  }

  return (
    <>
      {/* Everything here is a client island: the balance is credited by hand
          after a bank transfer, bids settle and cars move between shipping
          stops while the page is open, so all of it is fetched rather than
          rendered into the server payload. */}
      <WalletSection openTopUp={topup === "1"} />

      <DashboardStats />

      <DashboardRecentBids />

      {/* Renders nothing when no car is in transit. */}
      <DashboardActiveOrders />
    </>
  );
}
```

- [ ] **Step 3: Drop the sidebar from the phone layout**

Replace the whole of `src/app/[locale]/dashboard/layout.tsx` with:

```tsx
import Sidebar from "@/components/dashboard/Sidebar";
import { getDevice } from "@/lib/device";
import { cn } from "@/utils";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMobile = (await getDevice()) === "mobile";

  return (
    <section className="flex flex-1 flex-col bg-neutral-50 dark:bg-neutral-950">
      <div
        className={cn(
          "mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 lg:gap-8 lg:px-6",
          isMobile ? "py-4" : "py-6 lg:py-8",
        )}
      >
        {/* Phones get the grouped menu on /dashboard itself, so the sidebar is
            not rendered at all — skipping it keeps its client bundle off the
            phone instead of hiding it behind a breakpoint. */}
        {!isMobile && <Sidebar />}
        <div className="min-w-0 flex-1 space-y-8">{children}</div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both exit 0.

- [ ] **Step 5: Verify the screen**

With the `verify` skill, cookie `tjcar-device=mobile`, CDP `setDeviceMetricsOverride` at 390×844, signed in, load `/mn/dashboard` and confirm:

- header reads "Хэрэглэгчийн булан" with ☰ on the right and **no** compare icon
- the account card shows initials, name, balance, Premium state (and the progress bar plus minimum hint when under 2,000,000₮)
- four titled groups in order: Миний үйл ажиллагаа, Миний жагсаалт, Бүртгэл, Тусламж — then the standalone sign-out card
- badges appear on the rows that have counts and are **absent** where a count is 0
- tapping "Данс цэнэглэх" opens the top-up drawer; closing it leaves the URL at `/mn/dashboard`
- `/mn/dashboard?topup=1` opens with the drawer already up, and closing it strips the query
- every row navigates: bids, orders, reports, wishlist, compare, profile, `/about`
- the dark-mode switch flips the whole screen and stays on
- the page does not scroll horizontally, and the bottom nav's profile tab is highlighted

- [ ] **Step 6: Commit**

```bash
git add src/components/dashboard/mobile/DashboardMobileMenu.tsx "src/app/[locale]/dashboard/page.tsx" "src/app/[locale]/dashboard/layout.tsx"
git commit -m "feat(dashboard): app-style menu screen on phones"
```

---

### Task 8: Regression sweep and documentation

**Files:**
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: everything from Tasks 1–7.
- Produces: nothing consumed by code.

- [ ] **Step 1: Confirm the production build succeeds**

Run: `npm run build`
Expected: exit 0. This is the only check that compiles the new parallel-route segment the way production will — a bad optional catch-all inside a slot fails here, not at `tsc`.

If the build rejects `@mobileHeader/dashboard/[[...rest]]`, fall back to the per-route slot shape used by `japan/[id]`: six files at `@mobileHeader/dashboard/{bids,orders,reports,profile}/page.tsx` and `@mobileHeader/dashboard/{bids,orders}/[id]/page.tsx`, each rendering the same `<MobileHeader>` the switch case produced. Behaviour is identical; only the file count changes.

- [ ] **Step 2: Sweep the phone**

With the `verify` skill, cookie `tjcar-device=mobile` at 390×844, in **both** light and dark mode:

| Check | Expected |
|---|---|
| `/mn/dashboard` | menu screen, groups legible in dark mode (no white-on-white card) |
| `/mn/dashboard/bids` | header title, no in-page `<h1>` |
| `/mn/dashboard/orders` | header title, no in-page `<h1>` |
| `/mn/dashboard/reports` | header title, ＋ on the right |
| `/mn/dashboard/profile` | header title, no in-page `<h1>` |
| `/mn/dashboard/wallet` | redirects to `/mn/dashboard?topup=1` with the drawer open |
| `/en/dashboard`, `/ru/dashboard` | group headings translated, none falling back to the key name |

- [ ] **Step 3: Sweep the desktop**

Cookie `tjcar-device=desktop`, 1440×900, light mode: `/mn/dashboard` must still show the sidebar, the balance card with its four Premium benefit lines, the three stat cards, recent bids and cars in transit. `/mn/dashboard/reports` keeps its `<h1>` and its "Шинэ репорт" button. Nothing on desktop may have moved.

- [ ] **Step 4: Document the slot convention in `CLAUDE.md`**

Add this section immediately after the "Page container" section:

```markdown
## Mobile header (`@mobileHeader` slot)

The phone shell's fixed top bar comes from a parallel route, not from the page:
`src/app/[locale]/@mobileHeader/`. `default.tsx` renders the logo + hamburger;
a route with its own segment under the slot overrides it.

- Every slot file starts with `if ((await getDevice()) !== "mobile") return null;`
  — the desktop shell renders the slot too.
- Lot detail pages (`japan/[id]`, `korea/[id]`, `garage/[id]`) each fetch the car
  they name, so they get one file apiece.
- `dashboard/[[...rest]]` covers `/dashboard` and everything under it in one
  file, because a dashboard title is always a static translation. Add a `case`
  there when adding a dashboard subpage; without one the page still gets a
  working back arrow, just no title.
- A page whose title lives in this bar must not also render it in the body —
  `DashboardHeader` returns `null` on phones for exactly this reason.
```

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: describe the @mobileHeader slot convention"
```

---

## Self-Review

**Spec coverage**

| Spec section | Task |
|---|---|
| Device split (`layout.tsx`, `page.tsx`, `DashboardHeader`) | 2, 7 |
| `MobileHeader` `right={null}` one-liner | 1 |
| Header slot table (index, bids, orders, reports ＋, profile, fallback) | 2 |
| `DashboardMobileMenu` / `MobileAccountCard` / `MobileMenuGroup` / `MobileMenuRow` | 5, 6, 7 |
| `useDashboardCounts` + `DashboardStats` refactor | 3 |
| `useThemeToggle` extraction from `MobileDrawer` | 4 |
| Account card without the Premium benefit list, with the progress bar | 6 |
| Five menu groups, badges hidden at 0 | 5, 7 |
| `dashboard.mobile.*` in mn/en/ru | 1 |
| Styling rules (`active:` not `hover:`, no `tracking-*`/`font-mono`) | Global Constraints, 5 |
| Verification (tsc, lint, phone + desktop sweeps) | every task, 8 |
| Catch-all fallback to per-route files | 8 Step 1 |

Two files the spec did not name were added during planning and are called out here rather than left implicit: `src/components/dashboard/mobile/icons.tsx` (keeps ~120 lines of SVG out of `DashboardMobileMenu`) and `src/lib/contact.ts` (the phone number would otherwise be typed into a second file).

**Type consistency**

- `useDashboardCounts` returns `bids | bidsPending | orders | reports`; Task 3 reads `counts.bids` / `counts.bidsPending` and Task 7 reads `counts.bids` / `counts.orders` / `counts.reports`. Consistent.
- `useThemeToggle` returns `{ theme, isPending, toggle }`; Task 4 destructures it as `isPending: isThemePending` and Task 7 as `isPending: isThemePending, toggle: toggleTheme`. Consistent.
- `MobileMenuRow` props used in Task 7: `icon`, `label`, `badge`, `trailing`, `href`, `external`, `onClick`, `danger` — all declared in Task 5.
- `MobileAccountCard` takes `onTopUp`; Task 7 passes it. `WalletTopUpDrawer` takes `{ open, onClose }`, matching its existing signature.
- `ChevronIcon` is exported from `icons.tsx` in Task 5 and imported by `MobileMenuRow` in the same task.
