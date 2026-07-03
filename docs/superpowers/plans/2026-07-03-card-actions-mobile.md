# CardActions Mobile Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the wishlist/compare buttons on car cards always visible with 40px touch targets on touch devices, while keeping the hover-reveal behaviour on mouse devices.

**Architecture:** Pure Tailwind class change in one shared component (`CardActions`). Tailwind v4.1+ `pointer-fine:`/`pointer-coarse:` variants gate the hover-reveal to mouse devices and the size bump to touch devices. All three consumers (CarCard grid, CarListItem list, CarTableView table) pick the fix up automatically.

**Tech Stack:** Next.js 16, Tailwind CSS 4.2.1, antd 6.4.3.

**Spec:** `docs/superpowers/specs/2026-07-03-card-actions-mobile-design.md`

## Global Constraints

- Tailwind 4.2.1 is installed — `pointer-fine:` / `pointer-coarse:` are built-in variants; do NOT use arbitrary `[@media(...)]` variants.
- antd sets its own button sizing/background, so overrides need Tailwind's `!` importance suffix (trailing `!`, e.g. `h-10!`) — the file already uses this convention.
- No test framework exists in this repo. Verification = `npx tsc --noEmit`, `npm run lint`, and visual check on the dev server (`npm run dev`, port 2500).
- Only `src/components/cards/shared/CardActions.tsx` may change.

---

### Task 1: Touch-aware visibility, sizing, and contrast in CardActions

**Files:**
- Modify: `src/components/cards/shared/CardActions.tsx:52-127`

**Interfaces:**
- Consumes: nothing new — existing `Props` API (`visibility`, `absolute`, `disableCompare`) is unchanged.
- Produces: same `CardActions` component; no signature change, so no consumer edits.

- [ ] **Step 1: Gate the hover-reveal to fine pointers (root div)**

In `src/components/cards/shared/CardActions.tsx`, the root `<div>`'s
`visibility === "hover"` class string currently reads:

```tsx
        visibility === "hover" &&
          "opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100",
```

Replace with:

```tsx
        visibility === "hover" &&
          "pointer-fine:opacity-0 transition-opacity duration-200 pointer-fine:group-hover:opacity-100 focus-within:opacity-100",
```

Effect: on coarse pointers nothing sets `opacity-0`, so the buttons are always
visible; on fine pointers the current hide/hover-reveal is byte-for-byte
equivalent behaviour. `focus-within:opacity-100` stays unconditional for
keyboard users.

- [ ] **Step 2: Bump touch target + contrast on the wishlist button**

The wishlist `<Button>` className currently reads:

```tsx
          className={cn(
            "ring-1! backdrop-blur-md! active:scale-95!",
            wishlisted
              ? "bg-rose-500! text-white! ring-rose-300/40! shadow-md! hover:bg-rose-500!"
              : "bg-white/85! text-neutral-700! ring-black/5! hover:bg-white! hover:text-rose-500!",
          )}
```

Replace with:

```tsx
          className={cn(
            "ring-1! backdrop-blur-md! active:scale-95! pointer-coarse:h-10! pointer-coarse:w-10! pointer-coarse:min-w-10!",
            wishlisted
              ? "bg-rose-500! text-white! ring-rose-300/40! shadow-md! hover:bg-rose-500!"
              : "bg-white/90! text-neutral-700! ring-black/5! shadow-sm! hover:bg-white! hover:text-rose-500!",
          )}
```

(Changes: three `pointer-coarse:` size classes appended to the base string;
inactive background `bg-white/85!` → `bg-white/90!`; `shadow-sm!` added to the
inactive branch only — the active branch already has `shadow-md!`.)

Then add an icon-size class to the wishlist `<svg>` (keep the `width`/`height`
attributes — CSS overrides them on coarse pointers only):

```tsx
          <svg
            className="pointer-coarse:size-[17px]"
            width="15"
            height="15"
```

- [ ] **Step 3: Same treatment for the compare button**

The compare `<Button>` className currently reads:

```tsx
            className={cn(
              "ring-1! backdrop-blur-md! active:scale-95!",
              compared
                ? "bg-neutral-900! text-white! ring-white/20! shadow-md! hover:bg-neutral-900!"
                : "bg-white/85! text-neutral-700! ring-black/5! hover:bg-white! hover:text-neutral-900!",
            )}
```

Replace with:

```tsx
            className={cn(
              "ring-1! backdrop-blur-md! active:scale-95! pointer-coarse:h-10! pointer-coarse:w-10! pointer-coarse:min-w-10!",
              compared
                ? "bg-neutral-900! text-white! ring-white/20! shadow-md! hover:bg-neutral-900!"
                : "bg-white/90! text-neutral-700! ring-black/5! shadow-sm! hover:bg-white! hover:text-neutral-900!",
            )}
```

And on the compare `<svg>`:

```tsx
            <svg
              className="pointer-coarse:size-[17px]"
              width="15"
              height="15"
```

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: exits 0, no output.

Run: `npm run lint`
Expected: exits 0 (no new warnings/errors for `CardActions.tsx`).

- [ ] **Step 5: Visual verification on the dev server**

Run: `npm run dev` (serves at `http://localhost:2500`).

Check a listing page that renders `CarCard` (e.g. `/mn/japan`) in a browser:

1. **Mobile emulation** (DevTools device toolbar, which simulates
   `pointer: coarse`): wishlist + compare buttons are visible on every card
   *without* any interaction, rendered at 40px with 17px icons; tapping the
   heart toggles it rose without navigating to the detail page.
2. **Desktop viewport** (normal mouse): buttons are hidden until the card is
   hovered, sized 32px exactly as before; keyboard Tab onto a button also
   reveals it (`focus-within`).
3. **Table view** on mobile emulation: the actions column renders both 40px
   buttons without clipping (92px column fits 40 + 6 + 40 = 86px).

Expected: all three observations hold.

- [ ] **Step 6: Commit**

```bash
git add src/components/cards/shared/CardActions.tsx
git commit -m "fix: show card wishlist/compare actions on touch devices

Tailwind v4 gates group-hover behind (hover: hover), so the opacity-0
overlay actions never revealed on phones. Scope the hide to pointer-fine
devices, bump touch targets to 40px on pointer-coarse, and nudge the
idle background contrast.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```
