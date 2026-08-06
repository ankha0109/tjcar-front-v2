# Contact page, and the removal of the `home-v2` demo

**Date:** 2026-08-06
**Status:** approved, ready to implement

## Problem

`DesktopFooter`'s company column links to `/contact`, and no such route exists —
the link falls through to `[locale]/[...rest]` and serves a 404. It is the only
dead internal link in the app; every other `href` in `src/` resolves to a real
route.

Two more links are casualties of the same gap. `DesktopHeader`'s menu card and
`MobileDrawer` both render a row labelled `header.topbar.contact.label`
("Холбоо барих") whose `aria` string is literally "Холбоо барих хуудас", and both
point it at `/about` because the contact page was never built.

Separately, `/home-v2` is a redesigned-home demo that was never adopted. Nothing
links to it, but it still ships and is indexable.

## Goals

1. `/contact` is a real page carrying every contact fact the company publishes.
2. The header and drawer rows point at it instead of `/about`.
3. `/home-v2` and its component tree are gone.

## Non-goals

- A message/inquiry form. The backend has no contact endpoint (`routes/*.php`
  has nothing for contact, feedback or inquiries), and the site already offers
  Messenger and the AI chat widget. Decided against in brainstorming.
- Branch lists, staff photos, newsletter signup.
- Fixing `header.topbar.hours.short` (see "Conflicting facts" below) — noted,
  out of scope.

## Source content

The v1 page, `~/Projects/Front/tjcar-front/src/app/contact/page.js`, is a title,
four centred cards (phone, email, hours, address) and a Google Maps iframe. No
form. Its facts:

| Fact | v1 value |
| --- | --- |
| Phones | 7511-5888, 8811-3032 |
| Email | info@tjcar.mn |
| Hours | Даваа - Бямба (07:30 - 17:30) |
| Address | Баянгол дүүрэг, 3-р хороо, Замчдын гудамж, 80/1 1003 тоот |
| Map | Google Maps embed, `TJ Car LLC` pin at 47.91118, 106.891904 |

v2 already carries the same facts in `messages/*.json` under `footer.contact`
and `header.topbar.hours.schedule`, plus `MESSENGER_URL` (`https://m.me/tjcar.llc`)
in `GarageContactCard` and the Facebook/Instagram URLs in `DesktopFooter`.

### Conflicting facts

Two values disagree between v1 and v2. **The newest v2 value wins** in both
cases; the v1 and topbar values are treated as stale.

| | v1 | v2 | Use |
| --- | --- | --- | --- |
| Phones | 7511-5888, 8811-3032 | `footer.contact.phone` → two numbers; `GarageContactCard` → **three** | **7511-5888, 8604-5888, 8304-5888** |
| Hours | 07:30–17:30 | `footer.contact.hours` → 07:30–17:30, but `header.topbar.hours.short` → 09:00–18:00 | **07:30–17:30** |

`GarageContactCard`'s `PHONES` array is the fullest list and its comment claims
the numbers match the header and footer, which they no longer do — the footer
string stopped at two. The contact page prints all three. Rewriting the footer's
`footer.contact.phone` string is a copy decision for the user and stays out of
scope; only the numbers the new page prints are settled here.

`header.topbar.hours.short` stays wrong after this change. It is rendered by the
header topbar only and fixing it means deciding what the "short" form should
say — a separate, one-line change.

## Design

### Routes and files

```
src/app/[locale]/contact/page.tsx        server; generateMetadata + setRequestLocale
src/components/contact/ContactHero.tsx   eyebrow + h1 + subtitle
src/components/contact/ContactChannels.tsx  3 action cards + office block
src/components/contact/ContactMap.tsx    Google Maps iframe + directions link
src/components/contact/ContactJsonLd.tsx LocalBusiness structured data
```

All five are server components — the page has no interactive state. The page
composes them in order, mirroring `app/[locale]/terms/page.tsx` and
`app/[locale]/about/page.tsx`.

No `@mobileHeader` slot file. `/contact` is a plain page, so
`@mobileHeader/[...rest]/page.tsx` matches it and renders `DefaultMobileHeader`
— the same treatment `/terms` and `/about` get.

### Layout

`ContactHero` follows `TermsHero`: the ruled-paper backdrop masked to nothing at
the band's bottom, a pill eyebrow, an `h1` and a subtitle, all with the
`hero-reveal` stagger. Its pill icon is a phone rather than a document.

Below it, one `mx-auto w-full max-w-7xl px-4 lg:px-6` container holding a
12-column grid:

- **`lg:col-span-7`** — `ContactChannels`. Three cards in a
  `sm:grid-cols-3` row: call, Messenger (new tab), email (`mailto:`). The
  Messenger and email cards are a single anchor wrapping icon, label and value,
  so the whole card is the hit target. The phone card cannot be — it holds three
  numbers — so it is a plain card listing each number as its own `tel:` chip,
  the shape `GarageContactCard` already uses. Under them, the office block:
  address, the three-line
  schedule (weekdays / Saturday / Sunday-closed), and the Facebook + Instagram
  links.
- **`lg:col-span-5`** — `ContactMap`. The iframe inside a bordered, rounded
  card, with the "open in Google Maps" link beneath it.

Below `lg` the grid collapses to one column and the order is channels → office →
map. Every surface carries its `dark:` variant, as the rest of the site does.

Icons are inline SVG components at the bottom of each file — the pattern
`TermsHero` and `GarageContactCard` already use. No new icon dependency.

### Where the facts live

`src/lib/contact.ts` grows from two constants into the module that owns every
non-translatable contact value:

```ts
export const CONTACT_PHONE_RAW = "+97675115888";      // unchanged
export const CONTACT_PHONE_DISPLAY = "+976 7511-5888"; // unchanged
export const CONTACT_PHONES = [
  { raw: "+97675115888", display: "7511-5888" },
  { raw: "+97686045888", display: "8604-5888" },
  { raw: "+97683045888", display: "8304-5888" },
] as const;
export const CONTACT_EMAIL = "info@tjcar.mn";
export const MESSENGER_URL = "https://m.me/tjcar.llc";
export const FACEBOOK_URL = "https://www.facebook.com/tjcar.llc";
export const INSTAGRAM_URL = "https://www.instagram.com/tjcar.llc";
export const MAP_EMBED_URL = "https://www.google.com/maps/embed?pb=!1m14!…";
export const MAP_PLACE_URL =
  "https://www.google.com/maps/search/?api=1&query=47.91118,106.891904";
```

The two existing exports keep their names and values so `DesktopHeader`,
`MobileDrawer`, `DesktopFooter` and `TermsBody` are untouched.

`CONTACT_PHONES` and `MESSENGER_URL` move here from `GarageContactCard`, which
imports both instead of declaring its own copies — one list, one home, and the
comment about the numbers matching the header and footer stops being a promise
nobody enforces. `FACEBOOK_URL` / `INSTAGRAM_URL`
likewise move out of `DesktopFooter`'s `SOCIAL_LINKS`, which keeps its array
shape but sources the two `href`s from this module.

`MAP_EMBED_URL` is copied verbatim from the `src` in v1's
`src/app/contact/page.js` iframe — the whole `?pb=!1m14!…` string, which encodes
the `TJ Car LLC` pin. Truncated above only to keep this document readable; the
implementation copies every character. It renders
as a plain JSX `<iframe>` with `loading="lazy"`,
`referrerPolicy="no-referrer-when-downgrade"` and a `title` — not v1's
`dangerouslySetInnerHTML`, and unlike v1 it is labelled for screen readers.

Address and hours are translatable prose, so they stay in `messages/*.json`.

### Translations

One new top-level namespace, `contact`, added to all three of
`messages/{mn,en,ru}.json`. No top-level `contact` key exists today — the five
current `"contact"` keys are all nested (`header.topbar`, `footer.company`,
`footer`, `garage`, `terms`).

```
contact.metadata.{title,description}
contact.hero.{eyebrow,hours,title,subtitle}
contact.channels.heading
contact.channels.phone.{label,hint}
contact.channels.messenger.{label,hint}
contact.channels.email.{label,hint}
contact.office.{heading,addressLabel,address,hoursLabel,socialLabel}
contact.office.hours.{weekdays,saturday,sunday}
contact.map.{heading,title,directions}
```

`contact.office.hours.*` duplicates the three strings already at
`header.topbar.hours.schedule.*` rather than reaching across namespaces — a
page's copy belongs to that page, and the drawer may want to shorten its version
later.

Mongolian is the source text; English and Russian are translated from it.

### Structured data

`ContactJsonLd` emits a `LocalBusiness` node — name, `telephone`,
`email`, `PostalAddress` (Ulaanbaatar, MN), `geo` at 47.91118 / 106.891904,
`openingHoursSpecification` (Mo–Sa 07:30–17:30) and the Facebook/Instagram URLs
as `sameAs`. It reuses `ReportJsonLd`'s shape exactly — a local `JsonLdScript`
helper rendering `<script type="application/ld+json">` whose `__html` is
`JSON.stringify(data).replace(/</g, "\\u003c")` — and the same
`SITE_URL = "https://v2.tjcar.mn"` for `@id` / `url`.

### Wiring the links

- `DesktopHeader.tsx:602` — `href="/about"` → `href="/contact"`.
- `MobileDrawer.tsx:410` — `href="/about"` → `href="/contact"`.
- `DesktopFooter`'s `/contact` entry needs no change; it stops 404ing.

### Removing `home-v2`

`src/components/home/v2/` is imported only by `src/app/[locale]/home-v2/page.tsx`
— nothing else in `src/` references `HomeV2`, `HeroV2`, `ServiceShowcase`,
`serviceShowcaseData` or `serviceIcons`. The removal is therefore three deletes:

1. `src/app/[locale]/home-v2/` (the whole directory)
2. `src/components/home/v2/` (the whole directory)
3. the `homeV2` namespace in each of `messages/{mn,en,ru}.json`

`src/components/home/servicesData.ts` and the live `Home`/`MobileHome` tree are
untouched — they are the non-v2 home and stay.

**Uncommitted work will be lost.** `HomeV2.tsx`, `ServiceShowcase.tsx` and
`home-v2/page.tsx` carry 12 uncommitted lines against `HEAD`. Deleting the files
discards them. The user confirmed the removal knowing this.

## Verification

- `/mn/contact`, `/en/contact`, `/ru/contact` all render, in both themes, at
  phone and desktop widths.
- Every card acts: `tel:` dials, Messenger opens `m.me/tjcar.llc` in a new tab,
  `mailto:` opens a compose window, the map link opens Google Maps.
- The header menu card and the mobile drawer both land on `/contact`.
- The footer's "Холбоо барих" no longer 404s.
- `/mn/home-v2` returns 404 and `rg "homeV2|home/v2"` over `src/` and
  `messages/` comes back empty.
- `npm run build` passes — it type-checks and would catch a missing translation
  key or a dangling import from the deleted tree.

## Notes for later

- `/report/view/{jp_report_id}` still has no page, while the backend prints a QR
  to it into every issued PDF. Anyone scanning a report QR gets a 404. Tracked
  in the report memory; not part of this work.
- `messages/*.json` still carries a `reportCheck` namespace left over from the
  deleted `/report/check` route.
- `src/app/` has no `sitemap.ts` or `robots.ts`.
