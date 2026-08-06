# `/report/view/[jpReportId]` — the placeholder behind the PDF's QR code

**Date:** 2026-08-06
**Status:** approved, ready to implement

## Problem

Every generated report PDF prints a QR code and, under it, the same URL in
plain text:

```
https://tjcar.mn/report/view/{jp_report_id}
```

`resources/views/pdf/report.blade.php:205` (API repo) draws the QR;
line 212 prints the caption — "… холбоосоор хүчинтэй, баталгаатай эсэхийг
шалгаарай". So the page is advertised, in print, as the way to prove the
report is genuine.

No such route exists. `/report/view/{id}` is two segments, so it does not match
`/report/[uuid]` (a single dynamic segment guarded by a UUID regex) and falls
through to `[locale]/[...rest]`, which serves a 404. A customer holding a paid
report scans the QR and is told the page does not exist — the worst possible
answer to "is this document real?".

The real verification page is buildable: `GET /reports/public/{jpReportId}`
exists in the API (`routes/api.php:52`, `PublicReportController`) and
`PublicReport` is already typed in `src/types/report.ts`. It is deliberately
**not** this piece of work. This spec closes the 404 with an honest holding
page so the printed QR stops lying, and leaves the route in place for the real
implementation to fill.

## Goals

1. `/report/view/{anything}` returns a real 200 page that says the verification
   page is coming, in all three locales.
2. `/report/view` with no id does not 404 either.
3. The route slot is shaped so the real verification page replaces the body of
   one file, with no URL change.

## Non-goals

- Fetching or rendering the report. No API call, no `PublicReport`, no PDF
  link. Decided in brainstorming: this is a message, not a half-built feature.
- Echoing the scanned report id back to the reader. Considered and rejected —
  it invites the reader to believe something was looked up.
- Any contact detail (phone, Messenger). The header, footer and AI chat widget
  already carry those on every page.
- Changing the PDF template or the printed URL. The URL is correct; the page
  was simply never built.

## Routes

Two files under `src/app/[locale]/report/view/`:

| File | Behaviour |
| --- | --- |
| `[jpReportId]/page.tsx` | Renders the holding page. Status 200. |
| `page.tsx` | `redirect({ href: "/report", locale })`. |

`view` is a static segment, so Next resolves it ahead of the sibling
`[uuid]` dynamic route — `/report/view` never reaches the UUID regex in
`report/[uuid]/page.tsx`, and `/report/view/x` was never routed there at all.

`jpReportId` is matched but not read: nothing is fetched, so there is nothing
to validate it against. Any value renders the same page. Validating it would
mean guessing the backend's id format and 404-ing legitimate QR scans on a
wrong guess.

The bare-`/report/view` redirect follows the existing
`dashboard/wallet/page.tsx` pattern: `redirect` from `@/i18n/navigation`, called
with `{ href, locale }`. It exists because the URL is printed in readable text
under the QR, and a human retyping it can drop the id.

### Mobile header

No file is needed under the `@mobileHeader` slot. `[...rest]/page.tsx` in that
slot matches `/report/view/...` and renders `DefaultMobileHeader` — logo,
compare tray, hamburger. That is right for this page: it has no title worth
repeating in the 56px bar.

## Metadata

`generateMetadata` on `[jpReportId]/page.tsx` sets the title from
`reportView.metaTitle` (the locale layout's `title.template` wraps it) and
`robots: { index: false, follow: false }`.

Two reasons for `noindex`, either sufficient: the URL space is one entry per
sold report, and the page currently has nothing to say. It matches what
`report/[uuid]/page.tsx` already does.

## Page body

A single centred composition, lifted from `NotFoundView`'s structure so the two
"nothing here yet" screens in the app read as one family:

- the shared container, `mx-auto w-full max-w-7xl px-4 lg:px-6`, centred and
  vertically padded
- one brand bloom behind the heading (`aria-hidden`), the same ornament
  `NotFoundView` uses — no illustration
- `<h1>` — `reportView.title`
- one paragraph — `reportView.description`
- two buttons, reusing `NotFoundView`'s `BUTTON_BASE` shape: primary →
  `/report`, outlined → `/`

No numeral (there is no status code to show), no quick-links list, no
`nf-rise` animation delays — the page has three elements, not seven.

It lives inline in `[jpReportId]/page.tsx`. No component file: nothing else
renders it, and the real verification page will replace this body wholesale.

Both links use `Link` from `@/i18n/navigation` with locale-less hrefs, and carry
their colour class on the anchor itself — antd's reset paints a bare `<a>` blue
and beats an inherited colour.

## Translations

New top-level namespace `reportView`, added to `messages/mn.json`,
`messages/en.json` and `messages/ru.json`. Vocabulary follows `reportLanding`,
which says "PDF репорт" in Mongolian.

| Key | mn | en | ru |
| --- | --- | --- | --- |
| `metaTitle` | Репорт баталгаажуулалт | Report verification | Проверка отчёта |
| `title` | Тун удахгүй | Coming soon | Скоро |
| `description` | Репорт баталгаажуулах онлайн хуудас бэлтгэгдэж байна. Тун удахгүй энэ хаягаар репорт жинхэнэ эсэхийг шалгах боломжтой болно. | The online report verification page is being prepared. Soon this address will let you confirm that a report is genuine. | Страница онлайн-проверки отчёта готовится. Совсем скоро по этому адресу можно будет подтвердить подлинность отчёта. |
| `ctaReport` | Репорт үйлчилгээ | Report service | Услуга «Отчёт» |
| `ctaHome` | Нүүр хуудас | Home | На главную |

The message files carry unrelated uncommitted work. Edit them in place with
targeted insertions — never check them out, reset them, or rewrite them
wholesale.

## Verification

1. `npm run build` — the two new routes appear in the route table and the build
   passes.
2. `/verify` — load `/mn/report/view/12345`, `/en/report/view/12345` and
   `/ru/report/view/12345`, confirm 200 and the right copy in each; confirm
   `/mn/report/view` lands on `/mn/report`.
3. Confirm `/mn/report/{uuid}` and `/mn/report` still resolve as before — the
   new static segment must not shadow them.

## Follow-up

The real page: fetch `GET /reports/public/{jpReportId}`, render `PublicReport`
(vin, `car_data`, created date, PDF link), and 404 on an unknown id. The route,
the metadata and the noindex rule land here; that work replaces the body only.
