# `/report/view` Holding Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `https://tjcar.mn/report/view/{jp_report_id}` — the URL every report PDF's QR code points at — from a 404 into a 200 page that says the verification screen is coming.

**Architecture:** Two server components under `src/app/[locale]/report/view/`. `[jpReportId]/page.tsx` renders a static centred message (no API call, the id is matched but never read); `page.tsx` redirects the id-less URL to `/report`. Copy comes from a new `reportView` namespace in the three message files.

**Tech Stack:** Next.js 16 App Router, next-intl v4, Tailwind v4.

**Spec:** `docs/superpowers/specs/2026-08-06-report-view-coming-soon-design.md`

## Global Constraints

- Locales are `mn` (default), `en`, `ru`. Every new key goes into **all three**
  of `messages/mn.json`, `messages/en.json`, `messages/ru.json`.
- **`messages/*.json` carry unrelated uncommitted work by the user, as do
  several `src/` files.** Edit the message files with targeted `Edit` calls
  only. Never `git checkout`, `git restore`, `git stash` or rewrite them
  wholesale, and never `git add messages/` — see Task 3 for how the commit is
  built without swallowing that WIP.
- Navigation comes from `@/i18n/navigation` (`Link`, `redirect`), never from
  `next/link` or `next/navigation`.
- Page container is exactly `mx-auto w-full max-w-7xl px-4 lg:px-6`.
- Never use `tracking-*` or `font-mono` in this project.
- The colour class goes on the `<a>`/`Link` itself — antd's reset paints a bare
  `<a>` blue and beats an inherited colour.
- Dev server runs on port **2500** (`npm run dev`).

---

### Task 1: The holding page

**Files:**
- Create: `src/app/[locale]/report/view/[jpReportId]/page.tsx`
- Modify: `messages/mn.json` (insert one namespace before `"terms"`)
- Modify: `messages/en.json` (same)
- Modify: `messages/ru.json` (same)
- Test: none — this repo has no test framework (`package.json` scripts are
  `dev`, `build`, `start`, `lint`). Verification is the build plus real HTTP
  responses from the dev server.

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: the `reportView` message namespace with keys `metaTitle`, `title`,
  `description`, `ctaReport`, `ctaHome` — Task 2 does not use them, but any
  later work on this route will.

- [ ] **Step 1: Add the `reportView` namespace to `messages/mn.json`**

Use `Edit` with `old_string` `  "terms": {` (it occurs exactly once in the
file) and this `new_string`:

```json
  "reportView": {
    "metaTitle": "Репорт баталгаажуулалт",
    "title": "Тун удахгүй",
    "description": "Репорт баталгаажуулах онлайн хуудас бэлтгэгдэж байна. Тун удахгүй энэ хаягаар репорт жинхэнэ эсэхийг шалгах боломжтой болно.",
    "ctaReport": "Репорт үйлчилгээ",
    "ctaHome": "Нүүр хуудас"
  },
  "terms": {
```

- [ ] **Step 2: Add the same namespace to `messages/en.json`**

Same anchor, `  "terms": {`:

```json
  "reportView": {
    "metaTitle": "Report verification",
    "title": "Coming soon",
    "description": "The online report verification page is being prepared. Soon this address will let you confirm that a report is genuine.",
    "ctaReport": "Report service",
    "ctaHome": "Home"
  },
  "terms": {
```

- [ ] **Step 3: Add the same namespace to `messages/ru.json`**

Same anchor, `  "terms": {`:

```json
  "reportView": {
    "metaTitle": "Проверка отчёта",
    "title": "Скоро",
    "description": "Страница онлайн-проверки отчёта готовится. Совсем скоро по этому адресу можно будет подтвердить подлинность отчёта.",
    "ctaReport": "Услуга «Отчёт»",
    "ctaHome": "На главную"
  },
  "terms": {
```

- [ ] **Step 4: Check all three files are still valid JSON**

Run:

```bash
python3 -c "
import json
for loc in ['mn','en','ru']:
    d = json.load(open(f'messages/{loc}.json'))
    assert sorted(d['reportView']) == ['ctaHome','ctaReport','description','metaTitle','title'], loc
    print(loc, 'ok')
"
```

Expected: three `ok` lines. A `JSONDecodeError` means the insertion broke a
comma — fix it before going on.

- [ ] **Step 5: Create the page**

Create `src/app/[locale]/report/view/[jpReportId]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const BUTTON_BASE =
  "inline-flex h-11 items-center justify-center rounded-md px-6 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "reportView" });

  return {
    title: t("metaTitle"),
    // One URL per sold report, and nothing on it worth ranking yet — the same
    // rule `report/[uuid]` follows.
    robots: { index: false, follow: false },
  };
}

/**
 * The page the QR code on every generated report PDF points at:
 * `https://tjcar.mn/report/view/{jp_report_id}`, printed — along with the URL
 * in readable text — by `resources/views/pdf/report.blade.php` in the API repo.
 *
 * The real verification screen does not exist yet, so this admits it. A 200
 * that says "coming soon" beats the 404 a scanned QR used to land on when the
 * caption under it promises the reader they can check the report is genuine.
 *
 * `jpReportId` is matched but never read: nothing is fetched, so there is
 * nothing to validate it against, and guessing the backend's id format would
 * 404 legitimate scans. `GET /reports/public/{jpReportId}` (already live, and
 * typed here as `PublicReport`) is what replaces this body.
 */
export default async function ReportVerifySoonPage({
  params,
}: {
  params: Promise<{ locale: string; jpReportId: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("reportView");

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-4 py-20 text-center lg:px-6 lg:py-28">
      <div className="relative isolate flex w-full flex-col items-center">
        {/* The only ornament on the page — the same brand bloom the 404 screen
            uses, so the two "nothing here yet" pages read as one family. */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[20rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary opacity-[0.10] blur-[110px] sm:size-[34rem] dark:opacity-[0.18]"
        />

        <h1 className="text-2xl font-semibold lg:text-3xl">{t("title")}</h1>

        <p className="mt-3 max-w-md text-base text-secondary dark:text-neutral-400">
          {t("description")}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/report"
            className={`${BUTTON_BASE} bg-primary text-white hover:bg-[#d63a21]`}
          >
            {t("ctaReport")}
          </Link>
          <Link
            href="/"
            className={`${BUTTON_BASE} border border-black/10 text-neutral-800 hover:bg-black/[0.04] dark:border-white/15 dark:text-neutral-200 dark:hover:bg-white/[0.06]`}
          >
            {t("ctaHome")}
          </Link>
        </div>
      </div>
    </section>
  );
}
```

Notes for whoever is typing this:
- `<section>`, not `<main>` — both shells (`DesktopShell`, `MobileShell`)
  already wrap `children` in `<main className="flex-1 flex flex-col">`, which
  is what makes `flex-1` here centre the block vertically.
- No `nf-rise` animation classes. That entrance belongs to the 404 screen's
  seven-element composition; three elements do not need staggering.
- No `@mobileHeader` slot file. `src/app/[locale]/@mobileHeader/[...rest]/page.tsx`
  already matches this path and renders `DefaultMobileHeader`, which is right:
  this page has no title worth repeating in the 56px bar.

- [ ] **Step 6: Start the dev server**

Run in the background:

```bash
npm run dev
```

Wait for `Ready` on port 2500.

- [ ] **Step 7: Verify all three locales answer 200 with the right copy**

Run:

```bash
for l in mn en ru; do
  code=$(curl -s -o /tmp/rv-$l.html -w "%{http_code}" "http://localhost:2500/$l/report/view/12345")
  echo "$l -> $code"
done
grep -c "Тун удахгүй" /tmp/rv-mn.html
grep -c "Coming soon" /tmp/rv-en.html
grep -c "Скоро"      /tmp/rv-ru.html
```

Expected: `mn -> 200`, `en -> 200`, `ru -> 200`, then a non-zero count from
each `grep`. A `404` means the route file is in the wrong folder; a `500` with
`MISSING_MESSAGE` in the server log means a key did not land in that locale.

- [ ] **Step 8: Verify nothing else on `/report` moved**

Run:

```bash
curl -s -o /dev/null -w "report      %{http_code}\n" http://localhost:2500/mn/report
curl -s -o /dev/null -w "uuid        %{http_code}\n" http://localhost:2500/mn/report/11111111-2222-3333-4444-555555555555
curl -s -o /dev/null -w "non-uuid    %{http_code}\n" http://localhost:2500/mn/report/abc
```

Expected: `report 200`, `uuid 200`, `non-uuid 404`. The new static `view`
segment must not shadow the sibling `[uuid]` route.

- [ ] **Step 9: Look at it**

Use the `/verify` skill (or open the browser yourself) on
`http://localhost:2500/mn/report/view/12345` in both light and dark theme, and
at phone width. Confirm: the block is vertically centred, the bloom sits behind
the heading, both buttons are visible and legible, and the header/footer edges
line up with the text block.

---

### Task 2: The id-less URL

**Files:**
- Create: `src/app/[locale]/report/view/page.tsx`

**Interfaces:**
- Consumes: nothing. (It renders no copy, so it needs no `reportView` keys.)
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Create the redirect**

Create `src/app/[locale]/report/view/page.tsx`:

```tsx
import { redirect } from "@/i18n/navigation";

/**
 * `/report/view` with no id. The PDF prints the full URL in readable text
 * under the QR code, so a human retyping it can drop the trailing id — and
 * there is nothing to show them here. `/report` is where the service is
 * explained.
 */
export default async function ReportViewIndexRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/report", locale });
}
```

- [ ] **Step 2: Verify the redirect**

With the dev server still running:

```bash
for l in mn en ru; do
  curl -s -o /dev/null -w "$l -> %{http_code} %{redirect_url}\n" \
    "http://localhost:2500/$l/report/view"
done
```

Expected, one line per locale: `307` and a `redirect_url` ending in
`/$l/report` (e.g. `mn -> 307 http://localhost:2500/mn/report`).

- [ ] **Step 3: Run the production build**

Run:

```bash
npm run build
```

Expected: build succeeds, and the route table lists both
`/[locale]/report/view` and `/[locale]/report/view/[jpReportId]`.

- [ ] **Step 4: Lint**

Run:

```bash
npx eslint "src/app/[locale]/report/view"
```

Expected: no output.

---

### Task 3: Commit without swallowing the user's WIP

**Files:** none changed — this task only builds a commit.

**Interfaces:** none.

The two new page files are untracked and clean, so they can be committed
normally. The three message files cannot: they already hold unrelated
uncommitted work, and `git add messages/mn.json` would stage all of it.

**Ask the user before running this task.** Leaving everything uncommitted
alongside their existing WIP is a perfectly good outcome; only do this if they
want the change committed now.

- [ ] **Step 1: Confirm what is actually dirty**

Run:

```bash
git status --short
```

Expected: `?? src/app/[locale]/report/view/` plus ` M messages/{mn,en,ru}.json`
and the user's other modified files. If the message files are NOT modified
beyond our insertion (`git diff --stat messages/` shows ~5 added lines each and
nothing else), skip to Step 3 and commit normally.

- [ ] **Step 2: Build the message blobs from `HEAD` + our insertion only**

This writes, for each locale, a blob equal to the committed file with only the
`reportView` namespace added — the user's WIP in those files is not in it.

The scratch directory is a fixed path, not `mktemp -d`: Steps 2 and 3 run as
separate shell invocations and shell variables do not survive between them.

```bash
tmp=/tmp/tjcar-report-view-commit; mkdir -p "$tmp"
python3 - "$tmp" <<'PY'
import json, subprocess, sys
tmp = sys.argv[1]
blocks = {
  "mn": {
    "metaTitle": "Репорт баталгаажуулалт",
    "title": "Тун удахгүй",
    "description": "Репорт баталгаажуулах онлайн хуудас бэлтгэгдэж байна. Тун удахгүй энэ хаягаар репорт жинхэнэ эсэхийг шалгах боломжтой болно.",
    "ctaReport": "Репорт үйлчилгээ",
    "ctaHome": "Нүүр хуудас",
  },
  "en": {
    "metaTitle": "Report verification",
    "title": "Coming soon",
    "description": "The online report verification page is being prepared. Soon this address will let you confirm that a report is genuine.",
    "ctaReport": "Report service",
    "ctaHome": "Home",
  },
  "ru": {
    "metaTitle": "Проверка отчёта",
    "title": "Скоро",
    "description": "Страница онлайн-проверки отчёта готовится. Совсем скоро по этому адресу можно будет подтвердить подлинность отчёта.",
    "ctaReport": "Услуга «Отчёт»",
    "ctaHome": "На главную",
  },
}
for loc, block in blocks.items():
    head = subprocess.run(
        ["git", "show", f"HEAD:messages/{loc}.json"],
        capture_output=True, text=True, check=True,
    ).stdout
    anchor = '  "terms": {'
    assert head.count(anchor) == 1, loc
    added = json.dumps({"reportView": block}, ensure_ascii=False, indent=2)
    # Strip the wrapping braces and re-indent to sit at namespace level.
    body = added[added.index("\n") + 1 : added.rindex("\n")]
    out = head.replace(anchor, body + ",\n" + anchor)
    json.loads(out)  # blows up here rather than in the commit
    open(f"{tmp}/{loc}.json", "w").write(out)
    print(loc, "prepared")
PY
```

Expected: `mn prepared`, `en prepared`, `ru prepared`.

- [ ] **Step 3: Write the commit with plumbing**

`GIT_INDEX_FILE` points git at a scratch index, so the real index and the
working tree are never touched.

```bash
export GIT_INDEX_FILE=$tmp/index
git read-tree HEAD
for loc in mn en ru; do
  git update-index --add --cacheinfo 100644,"$(git hash-object -w $tmp/$loc.json)",messages/$loc.json
done
for f in "src/app/[locale]/report/view/page.tsx" \
         "src/app/[locale]/report/view/[jpReportId]/page.tsx"; do
  git update-index --add --cacheinfo 100644,"$(git hash-object -w "$f")","$f"
done
tree=$(git write-tree)
commit=$(git commit-tree "$tree" -p HEAD -m "feat(report): answer the PDF QR with a holding page

The QR on every generated report — and the URL printed under it — point at
/report/view/{jp_report_id}, which 404'd. It now renders a coming-soon page in
all three locales, and the id-less /report/view redirects to /report. The real
verification screen (GET /reports/public/{jpReportId}) replaces the body later.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>")
git update-ref refs/heads/main "$commit"
unset GIT_INDEX_FILE
git log --oneline -1
```

- [ ] **Step 4: Prove the user's WIP survived**

Run:

```bash
git status --short
git show --stat HEAD
```

Expected: `git show --stat` lists exactly five files (three message files, two
page files). `git status` still shows every file the user had modified before,
message files included — those now diff against a HEAD that contains our keys,
so their remaining diff is the user's work alone. Confirm with:

```bash
git diff messages/mn.json | grep -c reportView
```

Expected: `0`.

---

## Notes

- **Do not** validate `jpReportId` or add a `notFound()` branch. Nothing is
  fetched, so there is no source of truth to validate against, and a wrong
  guess at the id format 404s real customers holding real reports.
- **Do not** add the report id, a phone number or a Messenger link to the page.
  Both were considered and rejected in brainstorming: an echoed id implies a
  lookup happened, and the header, footer and AI chat widget already carry
  support contacts on every page.
