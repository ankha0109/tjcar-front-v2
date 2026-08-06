# Contact page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/contact` — the only route the app links to but does not serve — and delete the unadopted `/home-v2` demo.

**Architecture:** Four server components (`ContactHero`, `ContactChannels`, `ContactMap`, `ContactJsonLd`) composed by `app/[locale]/contact/page.tsx`, following the existing `terms/` and `about/` page shape. Every non-translatable contact value (phones, email, Messenger, socials, map URLs) moves into `src/lib/contact.ts` so the new page, `GarageContactCard` and `DesktopFooter` read one source. Copy lives in a new top-level `contact` i18n namespace in all three locales.

**Tech Stack:** Next.js 16 (App Router, RSC), next-intl 4, Tailwind CSS v4, TypeScript. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-08-06-contact-page-design.md`

## Global Constraints

- **This repo has no test runner.** `package.json` defines only `dev`, `build`, `start`, `lint`; there is not a single `*.test.*` / `*.spec.*` file and no vitest/jest/playwright config. Do not invent a test suite for this work. Each task's gate is `npm run lint` → `npm run build` → a browser check.
- `npm run dev` serves on **port 2500**, not 3000.
- **Locale prefix is required on every route** — check `/mn/contact`, never `/contact`.
- Every top-level page wrapper uses exactly `mx-auto w-full max-w-7xl px-4 lg:px-6`. Vertical padding is free; the horizontal scale is not.
- Routing imports (`Link`, `useRouter`, `usePathname`, `redirect`) come from `@/i18n/navigation`, never `next/link` / `next/navigation`. **External links (`tel:`, `mailto:`, `https://`) use a plain `<a>`, not `Link`.**
- Any new translation key must be added to **all three** of `messages/mn.json`, `messages/en.json`, `messages/ru.json`. Mongolian is the source text.
- Server components read copy with `const t = await getTranslations("namespace");`.
- **antd's CSS reset colors a bare `<a>` blue and beats an inherited text color.** Every anchor must carry its own Tailwind text-color class.
- **`hover:` does nothing on touch devices in this project** (Tailwind v4 gates it behind `(hover:hover)`). Use `pointer-fine:hover:` for hover styling, as `GarageContactCard` does.
- **Never use `tracking-*` or `font-mono`** anywhere in this project.
- Every surface needs its `dark:` variant.
- Commit messages end with the trailer `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`.
- The working tree carries unrelated user WIP across ~22 files. **Stage only the paths a task names** — never `git add -A`, never `git commit -a`.
- **`messages/{mn,en,ru}.json` are three of those WIP files** — they hold ~203 uncommitted lines of the user's in-flight work (KRW rates, dashboard labels, terms nav). Git stages whole files, so committing them would sweep that work into this branch's history. **Tasks 1 and 3 therefore edit the three message files but do not commit them.** Their edits stay in the working tree beside the user's, and the user commits all of it when their own work is ready. Every non-i18n path in this plan commits normally.

---

### Task 1: Delete the `home-v2` demo

Nothing in `src/` imports `HomeV2`, `HeroV2`, `ServiceShowcase`, `serviceShowcaseData` or `serviceIcons` except `app/[locale]/home-v2/page.tsx` itself, so this is three deletes and no rewiring. Doing it first keeps the `messages/*.json` line numbers stable for Task 3.

**This discards uncommitted work.** `HomeV2.tsx`, `ServiceShowcase.tsx` and `home-v2/page.tsx` carry 12 uncommitted lines against `HEAD`. The user confirmed the removal knowing this.

**Files:**
- Delete: `src/app/[locale]/home-v2/` (whole directory, 1 file)
- Delete: `src/components/home/v2/` (whole directory, 5 files)
- Modify: `messages/mn.json` — remove the `homeV2` object, lines 882–1047
- Modify: `messages/en.json` — remove the `homeV2` object, lines 882–1047
- Modify: `messages/ru.json` — remove the `homeV2` object, lines 882–1047

**Interfaces:**
- Consumes: nothing.
- Produces: nothing. Later tasks do not depend on this one; it is sequenced first only to keep line numbers stable.

- [ ] **Step 1: Confirm nothing outside the demo references it**

```bash
grep -rn "home/v2\|HomeV2\|HeroV2\|ServiceShowcase\|serviceShowcase\|serviceIcons" src \
  --include='*.tsx' --include='*.ts' | grep -v "^src/components/home/v2/"
```

Expected: exactly three lines, all in `src/app/[locale]/home-v2/page.tsx`. If anything else appears, **stop** and report it — the deletion is no longer safe.

- [ ] **Step 2: Delete the two directories**

```bash
git rm -r --quiet "src/app/[locale]/home-v2" src/components/home/v2
```

- [ ] **Step 3: Confirm the `homeV2` namespace sits exactly where this plan says**

```bash
for f in messages/mn.json messages/en.json messages/ru.json; do
  echo "== $f"; sed -n '882p;1047p;1048p' "$f"
done
```

Expected, for each file: line 882 is `  "homeV2": {`, line 1047 is `  },`, line 1048 is `  "homeBlog": {`. If any file differs, find its real range with `grep -n '^  "homeV2"' <file>` and use that instead of 882–1047 in the next step.

- [ ] **Step 4: Back the three files up first**

These files hold the user's uncommitted work, so git is **not** a safety net here — `git checkout -- messages/` would destroy 203 lines of their in-flight changes. Copy them into the plan's workspace instead, and restore from there if anything goes wrong in Step 5.

```bash
mkdir -p .superpowers/sdd/2026-08-06-contact-page/backup
cp messages/mn.json messages/en.json messages/ru.json \
   .superpowers/sdd/2026-08-06-contact-page/backup/
ls -l .superpowers/sdd/2026-08-06-contact-page/backup/
```

Expected: three files listed, each non-empty.

- [ ] **Step 5: Remove the namespace from all three locales**

```bash
for f in messages/mn.json messages/en.json messages/ru.json; do
  sed -i '' '882,1047d' "$f"
done
```

- [ ] **Step 6: Verify all three files are still valid JSON and the key is gone**

```bash
python3 -c "
import json
for loc in ('mn','en','ru'):
    d = json.load(open(f'messages/{loc}.json', encoding='utf-8'))
    assert 'homeV2' not in d, loc
    assert 'homeBlog' in d and 'homeServices' in d, loc
    print(loc, 'ok —', len(d), 'namespaces')
"
```

Expected: three `ok` lines. A `json.decoder.JSONDecodeError` means the line range was wrong — restore from the Step 4 backup (`cp .superpowers/sdd/2026-08-06-contact-page/backup/*.json messages/`), then redo Step 3. **Never `git checkout` these files.**

- [ ] **Step 7: Verify no reference survives anywhere**

```bash
grep -rn "homeV2\|home/v2" src messages ; echo "exit=$?"
```

Expected: no output and `exit=1`.

- [ ] **Step 8: Build**

Run: `npm run build`
Expected: success. A dangling import from the deleted tree, or a `homeV2` key still read somewhere, fails here.

- [ ] **Step 9: Confirm the route is gone**

Start `npm run dev`, open `http://localhost:2500/mn/home-v2`.
Expected: the 404 page (`NotFoundView` — "Хуудас олдсонгүй" with the Japan/Korea/garage/posts links), not the demo home.

- [ ] **Step 10: Commit the deletions only**

The three message files stay out of this commit — see the Global Constraints. Their `homeV2` removal stays in the working tree.

```bash
git add "src/app/[locale]/home-v2" src/components/home/v2
git commit -m "chore: drop the unadopted home-v2 demo

Nothing linked to /home-v2 and the redesign was never adopted. Removing the
route and its component tree. The homeV2 i18n namespace is deleted in the
working tree and rides along with the user's in-flight messages/*.json work.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 11: Confirm the message files are still dirty and unstaged**

```bash
git status --short messages/
```

Expected: ` M messages/en.json`, ` M messages/mn.json`, ` M messages/ru.json` — a leading space in column 1, meaning modified but not staged. A `M ` in column 1 means they were staged by mistake; run `git restore --staged messages/` to unstage without losing the edits.

---

### Task 2: Make `src/lib/contact.ts` the single source of contact facts

Today the phone list lives in `GarageContactCard` (three numbers), the social URLs live in `DesktopFooter`, the Messenger URL lives in `GarageContactCard`, and `src/lib/contact.ts` holds one number in two renderings. The new page needs all of it, so it moves here first and the two existing consumers import it.

**Files:**
- Modify: `src/lib/contact.ts` (currently 3 lines — the two existing exports keep their names and values)
- Modify: `src/components/garage/GarageContactCard.tsx:8-14` (drop the local `PHONES` and `MESSENGER_URL`)
- Modify: `src/components/layout/desktop/DesktopFooter.tsx:37-47` (source `SOCIAL_LINKS` hrefs from the module)

**Interfaces:**
- Consumes: nothing.
- Produces, all from `@/lib/contact` — Tasks 4–7 import these exact names:
  - `CONTACT_PHONE_RAW: string`, `CONTACT_PHONE_DISPLAY: string` (unchanged)
  - `CONTACT_PHONES: readonly { raw: string; display: string }[]`
  - `CONTACT_EMAIL: string`
  - `MESSENGER_URL: string`, `FACEBOOK_URL: string`, `INSTAGRAM_URL: string`
  - `OFFICE_LAT: number`, `OFFICE_LNG: number`
  - `MAP_EMBED_URL: string`, `MAP_PLACE_URL: string`

- [ ] **Step 1: Rewrite `src/lib/contact.ts`**

```ts
/** Support line. Two renderings of one number — keep them in step. */
export const CONTACT_PHONE_RAW = "+97675115888";
export const CONTACT_PHONE_DISPLAY = "+976 7511-5888";

/**
 * Every published support number. `raw` dials, `display` prints. The header
 * and drawer show only the first; the garage card and the contact page show
 * all three. Same numbers in every locale, so they are data, not translations.
 */
export const CONTACT_PHONES = [
  { raw: "+97675115888", display: "7511-5888" },
  { raw: "+97686045888", display: "8604-5888" },
  { raw: "+97683045888", display: "8304-5888" },
] as const;

export const CONTACT_EMAIL = "info@tjcar.mn";

export const MESSENGER_URL = "https://m.me/tjcar.llc";
export const FACEBOOK_URL = "https://www.facebook.com/tjcar.llc";
export const INSTAGRAM_URL = "https://www.instagram.com/tjcar.llc";

/** Office pin. The coordinates also feed the contact page's structured data. */
export const OFFICE_LAT = 47.91118;
export const OFFICE_LNG = 106.891904;

/**
 * Google's own embed form for the `TJ Car LLC` place, lifted verbatim from the
 * v1 site (`~/Projects/Front/tjcar-front/src/app/contact/page.js`). The `pb=`
 * blob is opaque and position-sensitive — copy it, never hand-edit it.
 */
export const MAP_EMBED_URL =
  "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d10697.210837873457!2d106.891904!3d47.91118!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x5d96935a39f75b61%3A0x3f6caa887cf1b78b!2sTJ%20Car%20LLC!5e0!3m2!1sen!2sus!4v1714967435809!5m2!1sen!2sus";

/** "Open in Google Maps" target — coordinates, so it works without a place id. */
export const MAP_PLACE_URL =
  "https://www.google.com/maps/search/?api=1&query=47.91118%2C106.891904";
```

- [ ] **Step 2: Point `GarageContactCard` at the module**

In `src/components/garage/GarageContactCard.tsx`, replace lines 3–14 (the doc comment, the `PHONES` array and the `MESSENGER_URL` const) with an import, keeping the file's remaining body untouched:

```tsx
import { getTranslations } from "next-intl/server";
import { CONTACT_PHONES, MESSENGER_URL } from "@/lib/contact";

/**
 * In-stock cars are sold over the phone, so this card takes the place the bid
 * panel holds on an auction lot. The numbers come from `@/lib/contact` — the
 * same list the contact page prints.
 */
export default async function GarageContactCard() {
```

Then rename the one usage further down the file:

```tsx
        {CONTACT_PHONES.map((phone) => (
```

- [ ] **Step 3: Point `DesktopFooter`'s socials at the module**

In `src/components/layout/desktop/DesktopFooter.tsx`, add `FACEBOOK_URL` and `INSTAGRAM_URL` to the existing `@/lib/contact` import, then replace the two literal hrefs in `SOCIAL_LINKS` (lines 39 and 44) with the constants. The array's shape, keys and icons do not change:

```tsx
const SOCIAL_LINKS: {
  href: string;
  key: "facebook" | "instagram";
  Icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement;
}[] = [
  {
    href: FACEBOOK_URL,
    key: "facebook",
    Icon: FacebookIcon,
  },
  {
    href: INSTAGRAM_URL,
    key: "instagram",
    Icon: InstagramIcon,
  },
];
```

Read the existing type annotation off the file before editing — reproduce it exactly rather than the sketch above if it differs.

- [ ] **Step 4: Confirm no stray copies remain**

```bash
grep -rn "m.me/tjcar\|facebook.com/tjcar\|instagram.com/tjcar\|97686045888\|97683045888" src \
  | grep -v "^src/lib/contact.ts"
```

Expected: no output. Any hit is a literal that should have become an import.

- [ ] **Step 5: Lint and build**

Run: `npm run lint && npm run build`
Expected: both clean. A renamed export that a consumer missed fails the build.

- [ ] **Step 6: Check the two touched surfaces still render**

With `npm run dev` running, open a garage car detail page (`http://localhost:2500/mn/garage` → click any car) and confirm the contact card still shows three phone chips and the Messenger button. Scroll any page to the footer and confirm the Facebook and Instagram icons still link out.

- [ ] **Step 7: Commit**

```bash
git add src/lib/contact.ts src/components/garage/GarageContactCard.tsx src/components/layout/desktop/DesktopFooter.tsx
git commit -m "refactor: give every contact fact one home in lib/contact

The phone list, Messenger URL and social URLs were declared inline in the two
components that happened to need them. The contact page needs all of them, so
they move to @/lib/contact and the existing consumers import from there.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Add the `contact` i18n namespace to all three locales

No top-level `contact` key exists today — the five current `"contact"` keys are all nested (`header.topbar`, `footer.company`, `footer`, `garage`, `terms`). `terms` is the last top-level key in every file, so the new namespace is appended after it.

The address strings are copied from each locale's existing `footer.contact.address`, so the footer and the contact page cannot drift apart in wording.

**Files:**
- Modify: `messages/mn.json` (append after the `terms` object)
- Modify: `messages/en.json` (append after the `terms` object)
- Modify: `messages/ru.json` (append after the `terms` object)

**Interfaces:**
- Consumes: nothing.
- Produces the keys Tasks 4–7 read:
  `contact.metadata.{title,description}`,
  `contact.hero.{eyebrow,hours,title,subtitle}`,
  `contact.channels.heading`,
  `contact.channels.phone.{label,hint}`,
  `contact.channels.messenger.{label,hint}`,
  `contact.channels.email.{label,hint}`,
  `contact.office.{heading,addressLabel,address,hoursLabel,socialLabel}`,
  `contact.office.hours.{weekdays,saturday,sunday}`,
  `contact.map.{heading,title,directions}`.

- [ ] **Step 1: Append the namespace to `messages/mn.json`**

Add a comma after the closing brace of the `terms` object (the last top-level key), then insert before the file's final `}`:

```json
  "contact": {
    "metadata": {
      "title": "Холбоо барих",
      "description": "Ти Жэй Кар ХХК-тай утас, Messenger, и-мэйлээр холбогдох. Оффисын хаяг, ажлын цаг, байршлын зураг."
    },
    "hero": {
      "eyebrow": "Холбоо барих",
      "hours": "Даваа–Бямба 07:30–17:30",
      "title": "Асуух зүйл байна уу? Шууд холбогдоорой.",
      "subtitle": "Дуудлага худалдаа, захиалга, тээвэр, бүртгэлийн талаар манай ажилтан утсаар болон Messenger-ээр хариулна."
    },
    "channels": {
      "heading": "Холбоо барих суваг",
      "phone": {
        "label": "Утсаар залгах",
        "hint": "Ажлын цагаар шууд хариулна"
      },
      "messenger": {
        "label": "Messenger",
        "hint": "Facebook хуудсаар бичих"
      },
      "email": {
        "label": "И-мэйл",
        "hint": "Албан бичиг, гэрээний асуудлаар"
      }
    },
    "office": {
      "heading": "Оффис",
      "addressLabel": "Хаяг",
      "address": "Баянгол дүүрэг, 3-р хороо, Замчдын гудамж, 80/1, 1003 тоот",
      "hoursLabel": "Ажлын цаг",
      "hours": {
        "weekdays": "Даваа–Баасан: 07:30–17:30",
        "saturday": "Бямба: 07:30–17:30",
        "sunday": "Ням: Амарна"
      },
      "socialLabel": "Сошиал"
    },
    "map": {
      "heading": "Байршил",
      "title": "Ти Жэй Кар ХХК-ийн оффисын байршил Google Maps дээр",
      "directions": "Google Maps дээр нээх"
    }
  }
```

- [ ] **Step 2: Append the namespace to `messages/en.json`**

```json
  "contact": {
    "metadata": {
      "title": "Contact",
      "description": "Reach TJ Car LLC by phone, Messenger or email. Office address, working hours and a map."
    },
    "hero": {
      "eyebrow": "Contact",
      "hours": "Mon–Sat 07:30–17:30",
      "title": "Questions? Talk to us directly.",
      "subtitle": "Our team answers by phone and on Messenger — auctions, orders, shipping and registration."
    },
    "channels": {
      "heading": "Ways to reach us",
      "phone": {
        "label": "Call us",
        "hint": "Answered during working hours"
      },
      "messenger": {
        "label": "Messenger",
        "hint": "Message our Facebook page"
      },
      "email": {
        "label": "Email",
        "hint": "For paperwork and contracts"
      }
    },
    "office": {
      "heading": "Office",
      "addressLabel": "Address",
      "address": "Bayangol District, Khoroo 3, Zamchdyn St, 80/1, Suite 1003, Ulaanbaatar",
      "hoursLabel": "Working hours",
      "hours": {
        "weekdays": "Monday–Friday: 07:30–17:30",
        "saturday": "Saturday: 07:30–17:30",
        "sunday": "Sunday: Closed"
      },
      "socialLabel": "Social"
    },
    "map": {
      "heading": "Find us",
      "title": "TJ Car LLC office location on Google Maps",
      "directions": "Open in Google Maps"
    }
  }
```

- [ ] **Step 3: Append the namespace to `messages/ru.json`**

```json
  "contact": {
    "metadata": {
      "title": "Контакты",
      "description": "Свяжитесь с «Ти Джей Кар» ХХК по телефону, в Messenger или по почте. Адрес офиса, часы работы и карта."
    },
    "hero": {
      "eyebrow": "Контакты",
      "hours": "Пн–Сб 07:30–17:30",
      "title": "Есть вопросы? Свяжитесь с нами напрямую.",
      "subtitle": "Наши сотрудники отвечают по телефону и в Messenger — аукционы, заказы, доставка и регистрация."
    },
    "channels": {
      "heading": "Способы связи",
      "phone": {
        "label": "Позвонить",
        "hint": "Отвечаем в рабочее время"
      },
      "messenger": {
        "label": "Messenger",
        "hint": "Написать на странице Facebook"
      },
      "email": {
        "label": "Эл. почта",
        "hint": "Для документов и договоров"
      }
    },
    "office": {
      "heading": "Офис",
      "addressLabel": "Адрес",
      "address": "р-н Баянгол, 3-й хороо, ул. Замчдын, 80/1, оф. 1003, Улан-Батор",
      "hoursLabel": "Часы работы",
      "hours": {
        "weekdays": "Понедельник–пятница: 07:30–17:30",
        "saturday": "Суббота: 07:30–17:30",
        "sunday": "Воскресенье: выходной"
      },
      "socialLabel": "Соцсети"
    },
    "map": {
      "heading": "Как нас найти",
      "title": "Расположение офиса «Ти Джей Кар» ХХК на Google Maps",
      "directions": "Открыть в Google Maps"
    }
  }
```

- [ ] **Step 4: Verify the three files parse and carry identical key trees**

```bash
python3 -c "
import json
def keys(o, p=''):
    out = set()
    for k, v in o.items():
        out.add(p + k)
        if isinstance(v, dict): out |= keys(v, p + k + '.')
    return out
tree = {l: json.load(open(f'messages/{l}.json', encoding='utf-8')) for l in ('mn','en','ru')}
base = keys(tree['mn']['contact'])
for l in ('en','ru'):
    diff = base ^ keys(tree[l]['contact'])
    assert not diff, (l, diff)
print('contact keys match across locales —', len(base), 'keys')
"
```

Expected: `contact keys match across locales — 33 keys`. An assertion failure names the locale and the mismatched key.

- [ ] **Step 5: Leave the three files uncommitted**

This task produces no commit — see the Global Constraints. The three message files carry the user's in-flight work and go into history with it, not with this plan's commits.

```bash
git status --short messages/
```

Expected: ` M` in column 1 for all three — modified, unstaged. Nothing to commit here. The next task's build is what proves these keys resolve.

---

### Task 4: Page shell and `ContactHero`

After this task `/contact` stops 404ing. The hero deliberately reuses `TermsHero`'s ruled-paper backdrop and `hero-reveal` stagger so the two static company pages read as a pair — read `src/components/terms/TermsHero.tsx` first; the code below is its sibling with a phone in the pill instead of a document.

**Files:**
- Create: `src/components/contact/ContactHero.tsx`
- Create: `src/app/[locale]/contact/page.tsx`

**Interfaces:**
- Consumes: `contact.hero.*` and `contact.metadata.*` from Task 3.
- Produces: `ContactHero` (default export, no props) and the page that renders it. Task 5 fills the `lg:col-span-7` slot, Task 6 the `lg:col-span-5` slot, Task 7 adds `ContactJsonLd` above the hero — **the page in Step 2 already contains the grid those tasks slot into**, with the two later components commented out.

- [ ] **Step 1: Create `src/components/contact/ContactHero.tsx`**

```tsx
import { getTranslations } from "next-intl/server";

/**
 * Page hero for the contact page. Shares `TermsHero`'s ruled backdrop on
 * purpose — these are the two static company pages and they should read as a
 * pair. The pill's trailing slot carries the working hours, which is the one
 * fact a visitor checks before deciding whether to call.
 */
export default async function ContactHero() {
  const t = await getTranslations("contact.hero");

  return (
    <section className="relative overflow-hidden border-b border-neutral-200/70 bg-neutral-50/60 dark:border-neutral-800/70 dark:bg-neutral-900/40">
      {/* Ruled-paper lines, masked to nothing by the bottom of the band. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)] dark:opacity-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgba(100,116,139,0.14) 0 1px, transparent 1px 30px)",
        }}
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-12 pt-10 md:pb-16 md:pt-16 lg:px-6">
        <div className="hero-reveal" style={{ animationDelay: "0ms" }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/70 px-3 py-1.5 text-[11px] font-medium uppercase text-neutral-600 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/60 dark:text-neutral-400">
            <PhoneIcon className="h-3.5 w-3.5 text-primary" />
            {t("eyebrow")}
            <span className="h-3 w-px bg-neutral-200 dark:bg-neutral-700" />
            <span className="normal-case text-neutral-500 dark:text-neutral-400">
              {t("hours")}
            </span>
          </span>
        </div>

        <h1
          className="hero-reveal mt-5 max-w-2xl text-balance text-3xl font-semibold leading-[1.12] text-neutral-900 sm:text-4xl md:text-[42px] dark:text-neutral-50"
          style={{ animationDelay: "120ms" }}
        >
          {t("title")}
        </h1>

        <p
          className="hero-reveal mt-5 max-w-2xl text-[15px] leading-relaxed text-neutral-600 md:text-base dark:text-neutral-400"
          style={{ animationDelay: "220ms" }}
        >
          {t("subtitle")}
        </p>
      </div>
    </section>
  );
}

function PhoneIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
```

- [ ] **Step 2: Create `src/app/[locale]/contact/page.tsx`**

The grid below is the final layout. Tasks 5–7 uncomment their lines; do not restructure it.

```tsx
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ContactHero from "@/components/contact/ContactHero";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact.metadata" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function ContactPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <ContactHero />
      <div className="mx-auto w-full max-w-7xl px-4 py-10 md:py-14 lg:px-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-7">
            {/* <ContactChannels /> — Task 5 */}
          </div>
          <div className="col-span-12 lg:col-span-5">
            {/* <ContactMap /> — Task 6 */}
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Lint and build**

Run: `npm run lint && npm run build`
Expected: both clean. A missing `contact.hero.*` key fails the build, because the page is statically rendered for all three locales.

- [ ] **Step 4: Check all three locales render**

With `npm run dev` running, open `http://localhost:2500/mn/contact`, `/en/contact` and `/ru/contact`.
Expected: hero band with the eyebrow pill (phone icon, "Холбоо барих", the hours), the heading and the subtitle — no 404, no missing-message error overlay. Toggle the theme and confirm the dark variant. Check the browser tab title matches `contact.metadata.title`.

- [ ] **Step 5: Check the mobile header**

Set the device to a phone (or load the page on one) and confirm the fixed top bar shows the default logo + compare + hamburger. `/contact` is matched by `@mobileHeader/[...rest]/page.tsx`, so no slot file is needed — if the bar instead shows a stale title from a previous page, that is the known soft-navigation behaviour and means a slot file **is** required; report it rather than working around it.

- [ ] **Step 6: Commit**

```bash
git add src/components/contact/ContactHero.tsx "src/app/[locale]/contact/page.tsx"
git commit -m "feat(contact): add the /contact route and its hero

DesktopFooter has linked /contact since it was written; nothing served it.
The hero borrows TermsHero's ruled backdrop so the two static company pages
read as a pair.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: `ContactChannels` — the three action cards and the office block

The Messenger and email cards are each a single anchor, so the whole card is the hit target. The phone card cannot be — it holds three numbers — so it is a plain card with one `tel:` chip per number, the shape `GarageContactCard` already uses.

**Files:**
- Create: `src/components/contact/ContactChannels.tsx`
- Modify: `src/app/[locale]/contact/page.tsx` (import it, uncomment its slot)

**Interfaces:**
- Consumes: `CONTACT_PHONES`, `CONTACT_EMAIL`, `MESSENGER_URL`, `FACEBOOK_URL`, `INSTAGRAM_URL` from Task 2; `contact.channels.*` and `contact.office.*` from Task 3.
- Produces: `ContactChannels` (default export, no props).

- [ ] **Step 1: Create `src/components/contact/ContactChannels.tsx`**

```tsx
import { getTranslations } from "next-intl/server";
import {
  CONTACT_EMAIL,
  CONTACT_PHONES,
  FACEBOOK_URL,
  INSTAGRAM_URL,
  MESSENGER_URL,
} from "@/lib/contact";

const CARD =
  "rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900";

/**
 * The three ways to reach the company, then the office facts underneath.
 * Messenger and email are whole-card anchors; the phone card is not, because
 * three numbers cannot share one href.
 */
export default async function ContactChannels() {
  const t = await getTranslations("contact");

  return (
    <div>
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        {t("channels.heading")}
      </h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className={CARD}>
          <CardHead
            icon={<PhoneIcon />}
            tone="emerald"
            label={t("channels.phone.label")}
            hint={t("channels.phone.hint")}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {CONTACT_PHONES.map((phone) => (
              <a
                key={phone.raw}
                href={`tel:${phone.raw}`}
                className="rounded-xl bg-neutral-100 px-3 py-2 text-[13px] font-semibold text-neutral-900 transition-colors pointer-fine:hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100"
              >
                {phone.display}
              </a>
            ))}
          </div>
        </div>

        <a
          href={MESSENGER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`${CARD} block text-neutral-900 transition-colors pointer-fine:hover:border-neutral-300 dark:text-neutral-100 dark:pointer-fine:hover:border-neutral-700`}
        >
          <CardHead
            icon={<MessageIcon />}
            tone="sky"
            label={t("channels.messenger.label")}
            hint={t("channels.messenger.hint")}
          />
          <span className="mt-3 block text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
            m.me/tjcar.llc
          </span>
        </a>

        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className={`${CARD} block text-neutral-900 transition-colors pointer-fine:hover:border-neutral-300 dark:text-neutral-100 dark:pointer-fine:hover:border-neutral-700`}
        >
          <CardHead
            icon={<MailIcon />}
            tone="amber"
            label={t("channels.email.label")}
            hint={t("channels.email.hint")}
          />
          <span className="mt-3 block break-all text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
            {CONTACT_EMAIL}
          </span>
        </a>
      </div>

      <section className={`${CARD} mt-3 p-5`}>
        <h2 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
          {t("office.heading")}
        </h2>

        <dl className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-medium uppercase text-neutral-500 dark:text-neutral-400">
              {t("office.addressLabel")}
            </dt>
            <dd className="mt-1.5 text-[14px] leading-relaxed text-neutral-800 dark:text-neutral-200">
              {t("office.address")}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase text-neutral-500 dark:text-neutral-400">
              {t("office.hoursLabel")}
            </dt>
            <dd className="mt-1.5 text-[14px] leading-relaxed text-neutral-800 dark:text-neutral-200">
              <div>{t("office.hours.weekdays")}</div>
              <div>{t("office.hours.saturday")}</div>
              <div className="text-neutral-400 dark:text-neutral-500">
                {t("office.hours.sunday")}
              </div>
            </dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <span className="text-[11px] font-medium uppercase text-neutral-500 dark:text-neutral-400">
            {t("office.socialLabel")}
          </span>
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] font-medium text-neutral-700 underline-offset-4 pointer-fine:hover:underline dark:text-neutral-300"
          >
            Facebook
          </a>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] font-medium text-neutral-700 underline-offset-4 pointer-fine:hover:underline dark:text-neutral-300"
          >
            Instagram
          </a>
        </div>
      </section>
    </div>
  );
}

const TONES = {
  emerald:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  sky: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
} as const;

function CardHead({
  icon,
  tone,
  label,
  hint,
}: {
  icon: React.ReactNode;
  tone: keyof typeof TONES;
  label: string;
  hint: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${TONES[tone]}`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">
          {label}
        </div>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
          {hint}
        </p>
      </div>
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4.5 w-4.5"
      aria-hidden
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4.5 w-4.5"
      aria-hidden
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4.5 w-4.5"
      aria-hidden
    >
      <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}
```

- [ ] **Step 2: Slot it into the page**

In `src/app/[locale]/contact/page.tsx`, add the import and replace the Task 5 comment:

```tsx
import ContactChannels from "@/components/contact/ContactChannels";
```

```tsx
          <div className="col-span-12 lg:col-span-7">
            <ContactChannels />
          </div>
```

- [ ] **Step 3: Lint and build**

Run: `npm run lint && npm run build`
Expected: both clean.

- [ ] **Step 4: Check the cards act**

At `http://localhost:2500/mn/contact`:
- three phone chips, each dialling its own number (`tel:` — on desktop the browser offers a handler; confirm the `href` in the inspector if no handler is installed)
- the Messenger card opens `https://m.me/tjcar.llc` in a new tab
- the email card opens a compose window for `info@tjcar.mn`
- the office block shows the address and all three schedule lines, with Sunday dimmed
- Facebook and Instagram open in new tabs
- **no anchor renders in antd's default blue** — every link should be neutral-toned
- the row collapses from `sm:grid-cols-3` to stacked below `sm`, and the whole column sits left of the empty map slot at `lg`
- dark theme is legible throughout

- [ ] **Step 5: Commit**

```bash
git add src/components/contact/ContactChannels.tsx "src/app/[locale]/contact/page.tsx"
git commit -m "feat(contact): add the channel cards and office block

Call, Messenger and email as three cards, then the address, the schedule and
the social links. Numbers and URLs come from @/lib/contact.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: `ContactMap`

v1 injected the iframe through `dangerouslySetInnerHTML` and gave it no accessible name. This renders it as plain JSX with a `title`.

**Files:**
- Create: `src/components/contact/ContactMap.tsx`
- Modify: `src/app/[locale]/contact/page.tsx` (import it, uncomment its slot)

**Interfaces:**
- Consumes: `MAP_EMBED_URL`, `MAP_PLACE_URL` from Task 2; `contact.map.*` from Task 3.
- Produces: `ContactMap` (default export, no props).

- [ ] **Step 1: Create `src/components/contact/ContactMap.tsx`**

```tsx
import { getTranslations } from "next-intl/server";
import { MAP_EMBED_URL, MAP_PLACE_URL } from "@/lib/contact";

/**
 * Google's place embed for the office. `loading="lazy"` keeps the third-party
 * frame out of the initial load; the `title` is what a screen reader announces,
 * which v1's raw HTML injection never provided.
 */
export default async function ContactMap() {
  const t = await getTranslations("contact.map");

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <h2 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
          {t("heading")}
        </h2>
        <a
          href={MAP_PLACE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-[13px] font-medium text-primary underline-offset-4 pointer-fine:hover:underline"
        >
          {t("directions")}
        </a>
      </div>

      <iframe
        src={MAP_EMBED_URL}
        title={t("title")}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        className="block h-80 w-full border-0 lg:h-115"
      />
    </section>
  );
}
```

- [ ] **Step 2: Slot it into the page**

```tsx
import ContactMap from "@/components/contact/ContactMap";
```

```tsx
          <div className="col-span-12 lg:col-span-5">
            <ContactMap />
          </div>
```

- [ ] **Step 3: Lint and build**

Run: `npm run lint && npm run build`
Expected: both clean.

- [ ] **Step 4: Check the map**

At `http://localhost:2500/mn/contact`:
- the map loads and shows the `TJ Car LLC` pin (not a grey "can't load" tile and not a different city — if the pin is wrong the `pb=` string was altered in transit)
- "Google Maps дээр нээх" opens Google Maps at 47.91118, 106.891904 in a new tab
- at `lg` the map sits right of the channels column and their heights are comparable; below `lg` it stacks under the office block
- the page body does not scroll horizontally at 320px width

- [ ] **Step 5: Commit**

```bash
git add src/components/contact/ContactMap.tsx "src/app/[locale]/contact/page.tsx"
git commit -m "feat(contact): add the office map

Google's place embed for TJ Car LLC, lazy-loaded and titled, plus a link out
to Google Maps. Same pin v1 used.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: `ContactJsonLd`

Structured data for the office. `AutoDealer` is a `LocalBusiness` subtype and describes the company more precisely, so the spec's "LocalBusiness" is satisfied by the narrower type.

**Files:**
- Create: `src/components/contact/ContactJsonLd.tsx`
- Modify: `src/app/[locale]/contact/page.tsx` (render it above the hero)

**Interfaces:**
- Consumes: `CONTACT_PHONES`, `CONTACT_EMAIL`, `FACEBOOK_URL`, `INSTAGRAM_URL`, `OFFICE_LAT`, `OFFICE_LNG` from Task 2; `contact.office.address` from Task 3.
- Produces: `ContactJsonLd({ locale }: { locale: string })` — the page already has `locale` in scope from `await params`.

- [ ] **Step 1: Read the pattern being copied**

Read `src/components/report/ReportJsonLd.tsx:1-15`. The `JsonLdScript` helper and the `SITE_URL` constant below are that file's, reproduced deliberately — including the `<` escape, which stops a stray `</script>` in translated copy from closing the tag early.

- [ ] **Step 2: Create `src/components/contact/ContactJsonLd.tsx`**

```tsx
import { getTranslations } from "next-intl/server";
import {
  CONTACT_EMAIL,
  CONTACT_PHONES,
  FACEBOOK_URL,
  INSTAGRAM_URL,
  OFFICE_LAT,
  OFFICE_LNG,
} from "@/lib/contact";

const SITE_URL = "https://v2.tjcar.mn";

function JsonLdScript({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

/**
 * AutoDealer (a LocalBusiness subtype) structured data for /contact — the one
 * page that states the address, the numbers and the opening hours together.
 */
export default async function ContactJsonLd({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "contact.office" });

  const data = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "@id": `${SITE_URL}/#organization`,
    name: "TJ Car LLC",
    url: `${SITE_URL}/${locale}/contact`,
    telephone: CONTACT_PHONES.map((phone) => phone.raw),
    email: CONTACT_EMAIL,
    address: {
      "@type": "PostalAddress",
      streetAddress: t("address"),
      addressLocality: "Ulaanbaatar",
      addressCountry: "MN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: OFFICE_LAT,
      longitude: OFFICE_LNG,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
        opens: "07:30",
        closes: "17:30",
      },
    ],
    sameAs: [FACEBOOK_URL, INSTAGRAM_URL],
  };

  return <JsonLdScript data={data} />;
}
```

- [ ] **Step 3: Render it from the page**

```tsx
import ContactJsonLd from "@/components/contact/ContactJsonLd";
```

```tsx
    <>
      <ContactJsonLd locale={locale} />
      <ContactHero />
```

- [ ] **Step 4: Lint and build**

Run: `npm run lint && npm run build`
Expected: both clean.

- [ ] **Step 5: Verify the emitted JSON**

```bash
curl -s http://localhost:2500/mn/contact \
  | python3 -c "
import sys, re, json
html = sys.stdin.read()
blocks = re.findall(r'<script type=\"application/ld\+json\">(.*?)</script>', html, re.S)
dealer = [json.loads(b) for b in blocks]
dealer = [d for d in dealer if d.get('@type') == 'AutoDealer']
assert len(dealer) == 1, f'expected 1 AutoDealer block, got {len(dealer)}'
print(json.dumps(dealer[0], ensure_ascii=False, indent=2))
"
```

Expected: one parsed object with three `telephone` entries, the Mongolian `streetAddress`, `geo` at 47.91118 / 106.891904, and Mo–Sa 07:30–17:30. A `JSONDecodeError` means the escaping broke.

- [ ] **Step 6: Commit**

```bash
git add src/components/contact/ContactJsonLd.tsx "src/app/[locale]/contact/page.tsx"
git commit -m "feat(contact): add AutoDealer structured data

Address, numbers, coordinates and opening hours in one schema.org block,
following ReportJsonLd's shape.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Point the header and drawer at `/contact`, then sweep

Both surfaces render a row labelled `header.topbar.contact.label` ("Холбоо барих") whose `aria` string is literally "Холбоо барих хуудас", and both send it to `/about` because the page did not exist. This is the last task because the links should not go live before the page does.

**Files:**
- Modify: `src/components/layout/desktop/DesktopHeader.tsx:602`
- Modify: `src/components/layout/mobile/MobileDrawer.tsx:410`

**Interfaces:**
- Consumes: the `/contact` route from Tasks 4–7.
- Produces: nothing.

- [ ] **Step 1: Retarget both links**

In `src/components/layout/desktop/DesktopHeader.tsx`, inside the `nav2.info` drawer section, the `DrawerLink` whose child is `{t("topbar.contact.label")}`:

```tsx
              <DrawerLink
                href="/contact"
```

In `src/components/layout/mobile/MobileDrawer.tsx`, the `DrawerLink` with the same child:

```tsx
            <DrawerLink
              href="/contact"
```

Both files have another `/about` link nearby that is a genuine "about" entry — change only the one whose label is `topbar.contact.label`.

- [ ] **Step 2: Confirm exactly two links changed**

```bash
git diff -U0 src/components/layout/desktop/DesktopHeader.tsx src/components/layout/mobile/MobileDrawer.tsx
```

Expected: two hunks, each a single line, `-  href="/about"` → `+  href="/contact"`.

- [ ] **Step 3: Sweep for any remaining dead internal link**

```bash
grep -rnE "href=\"/|href: *[\"\`']/" src --include='*.tsx' --include='*.ts' \
  | sed -E 's|.*["\`'"'"']([/][a-z0-9/_?=&-]*).*|\1|' | sed -E 's/[?#].*//' \
  | sort -u
```

Cross-check every path against `find "src/app/[locale]" -name page.tsx`.
Expected: every path resolves to a route. `/contact` now does.

- [ ] **Step 4: Lint and build**

Run: `npm run lint && npm run build`
Expected: both clean.

- [ ] **Step 5: Walk the three entry points**

With `npm run dev` running:
- desktop, open the header's menu card → "Холбоо барих" lands on `/mn/contact`
- phone width, open the hamburger drawer → "Холбоо барих" lands on `/mn/contact` and the drawer closes
- scroll to the footer → the company column's "Холбоо барих" lands on `/mn/contact` instead of the 404 page

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/desktop/DesktopHeader.tsx src/components/layout/mobile/MobileDrawer.tsx
git commit -m "fix(nav): send the contact rows to /contact

The header menu card and the mobile drawer pointed their contact rows at
/about because no contact page existed. It does now.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Done when

- `/mn/contact`, `/en/contact` and `/ru/contact` all render in both themes, at phone and desktop widths, with no horizontal body scroll at 320px.
- Every channel acts: three `tel:` chips, Messenger in a new tab, `mailto:`, the Google Maps link.
- The header menu card, the mobile drawer and the footer all reach `/contact`.
- `/mn/home-v2` returns 404 and `grep -rn "homeV2\|home/v2" src messages` is empty.
- `npm run lint && npm run build` pass.
- The user's unrelated WIP is still uncommitted and unbroken: `git status --short` still lists the files it listed before this work, minus the ones these tasks committed. In particular `messages/{mn,en,ru}.json` are still dirty and unstaged, now carrying both the user's work and this plan's i18n changes.
