# Homepage Mongolia-Truck Lottie Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a hand-written 2D-flat Lottie animation to the homepage hero showing a truck round-tripping between Ulaanbaatar and Zamiin-Üüd on a simplified Mongolia map.

**Architecture:** Client-side `MapAnimation` component rendered via `lottie-react`, fed by a hand-written `mongolia-truck.json` colocated with the component. Homepage (`page.tsx`) remains a server component and embeds `<MapAnimation />` above the featured-cars grid.

**Tech Stack:** Next.js 16, React 19, TailwindCSS 4, `lottie-react` (new dependency).

**Project has NO test runner.** "Verification" in each task means: run `npm run build` to check types/compile, then `npm run dev` (port 2500) and visually confirm in a browser. TDD steps are adapted accordingly.

**Spec:** [docs/superpowers/specs/2026-04-17-homepage-mongolia-truck-lottie-design.md](../specs/2026-04-17-homepage-mongolia-truck-lottie-design.md)

---

## File Structure

Files created:
- `src/components/hero/mongolia-truck.json` — Lottie animation data
- `src/components/hero/MapAnimation.tsx` — client component that renders the Lottie

Files modified:
- `package.json` / `package-lock.json` — add `lottie-react` dependency
- `src/app/page.tsx` — insert `<MapAnimation />` as hero above featured-cars grid

---

## Task 1: Install `lottie-react`

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Add the dependency**

Run:
```bash
npm install lottie-react
```

Expected: `package.json` has `"lottie-react": "^2.x.x"` under `dependencies` and `package-lock.json` updates.

- [ ] **Step 2: Verify React 19 compatibility**

Run:
```bash
npm run build
```

Expected: Build succeeds. If it fails with peer-dependency errors about React 19, run:
```bash
npm install lottie-react --legacy-peer-deps
```

Then re-run `npm run build`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add lottie-react dependency for hero animation"
```

---

## Task 2: Create the Lottie JSON file with canvas + background layer

**Files:**
- Create: `src/components/hero/mongolia-truck.json`

This task sets up a minimal valid Lottie JSON. Later tasks add layers on top.

- [ ] **Step 1: Create the file with canvas + white background**

Create `src/components/hero/mongolia-truck.json` with exactly this content:

```json
{
  "v": "5.9.0",
  "fr": 30,
  "ip": 0,
  "op": 240,
  "w": 1200,
  "h": 500,
  "nm": "Mongolia Truck",
  "ddd": 0,
  "assets": [],
  "layers": [
    {
      "ddd": 0,
      "ind": 1,
      "ty": 4,
      "nm": "Background",
      "sr": 1,
      "ks": {
        "o": { "a": 0, "k": 100 },
        "r": { "a": 0, "k": 0 },
        "p": { "a": 0, "k": [600, 250, 0] },
        "a": { "a": 0, "k": [0, 0, 0] },
        "s": { "a": 0, "k": [100, 100, 100] }
      },
      "ao": 0,
      "shapes": [
        {
          "ty": "gr",
          "it": [
            {
              "ty": "rc",
              "d": 1,
              "s": { "a": 0, "k": [1200, 500] },
              "p": { "a": 0, "k": [0, 0] },
              "r": { "a": 0, "k": 0 }
            },
            {
              "ty": "fl",
              "c": { "a": 0, "k": [1, 1, 1, 1] },
              "o": { "a": 0, "k": 100 },
              "r": 1
            },
            {
              "ty": "tr",
              "p": { "a": 0, "k": [0, 0] },
              "a": { "a": 0, "k": [0, 0] },
              "s": { "a": 0, "k": [100, 100] },
              "r": { "a": 0, "k": 0 },
              "o": { "a": 0, "k": 100 }
            }
          ]
        }
      ],
      "ip": 0,
      "op": 240,
      "st": 0
    }
  ]
}
```

- [ ] **Step 2: Verify JSON is valid**

Run:
```bash
node -e "JSON.parse(require('fs').readFileSync('src/components/hero/mongolia-truck.json', 'utf8')); console.log('valid')"
```

Expected: prints `valid`.

- [ ] **Step 3: Commit**

```bash
git add src/components/hero/mongolia-truck.json
git commit -m "feat(hero): scaffold mongolia-truck lottie with canvas + background"
```

---

## Task 3: Add Mongolia outline layer to the JSON

**Files:**
- Modify: `src/components/hero/mongolia-truck.json`

A simplified 14-point polygon approximating Mongolia's shape inside the 1200×500 canvas.

- [ ] **Step 1: Insert the Mongolia outline layer**

Edit `src/components/hero/mongolia-truck.json`. Inside the `"layers"` array, **after** the `Background` layer object (and before the closing `]`), insert a comma and this new layer object:

```json
{
  "ddd": 0,
  "ind": 2,
  "ty": 4,
  "nm": "Mongolia",
  "sr": 1,
  "ks": {
    "o": { "a": 0, "k": 100 },
    "r": { "a": 0, "k": 0 },
    "p": { "a": 0, "k": [0, 0, 0] },
    "a": { "a": 0, "k": [0, 0, 0] },
    "s": { "a": 0, "k": [100, 100, 100] }
  },
  "ao": 0,
  "shapes": [
    {
      "ty": "gr",
      "it": [
        {
          "ty": "sh",
          "ks": {
            "a": 0,
            "k": {
              "i": [[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],
              "o": [[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],
              "v": [[170,250],[220,180],[400,150],[600,130],[800,140],[980,180],[1050,230],[1020,290],[900,340],[700,370],[500,360],[300,340],[180,300],[170,275]],
              "c": true
            }
          }
        },
        {
          "ty": "fl",
          "c": { "a": 0, "k": [0.96, 0.96, 0.96, 1] },
          "o": { "a": 0, "k": 100 },
          "r": 1
        },
        {
          "ty": "st",
          "c": { "a": 0, "k": [0.2, 0.2, 0.2, 1] },
          "o": { "a": 0, "k": 100 },
          "w": { "a": 0, "k": 1.5 },
          "lc": 2,
          "lj": 2
        },
        {
          "ty": "tr",
          "p": { "a": 0, "k": [0, 0] },
          "a": { "a": 0, "k": [0, 0] },
          "s": { "a": 0, "k": [100, 100] },
          "r": { "a": 0, "k": 0 },
          "o": { "a": 0, "k": 100 }
        }
      ]
    }
  ],
  "ip": 0,
  "op": 240,
  "st": 0
}
```

- [ ] **Step 2: Validate JSON**

Run:
```bash
node -e "JSON.parse(require('fs').readFileSync('src/components/hero/mongolia-truck.json', 'utf8')); console.log('valid')"
```

Expected: prints `valid`.

- [ ] **Step 3: Commit**

```bash
git add src/components/hero/mongolia-truck.json
git commit -m "feat(hero): add mongolia outline layer"
```

---

## Task 4: Add route path layer (UB → Zamiin-Üüd)

**Files:**
- Modify: `src/components/hero/mongolia-truck.json`

Straight stroked line from UB (750, 180) to Zamiin-Üüd (820, 400). Grey, 2px. Dash pattern gives the "flow" appearance — animated in Task 7.

- [ ] **Step 1: Insert the route layer**

Edit `src/components/hero/mongolia-truck.json`. Insert this layer object in the `layers` array **after** the `Mongolia` layer (and before the closing `]`), preceded by a comma:

```json
{
  "ddd": 0,
  "ind": 3,
  "ty": 4,
  "nm": "Route",
  "sr": 1,
  "ks": {
    "o": { "a": 0, "k": 100 },
    "r": { "a": 0, "k": 0 },
    "p": { "a": 0, "k": [0, 0, 0] },
    "a": { "a": 0, "k": [0, 0, 0] },
    "s": { "a": 0, "k": [100, 100, 100] }
  },
  "ao": 0,
  "shapes": [
    {
      "ty": "gr",
      "it": [
        {
          "ty": "sh",
          "ks": {
            "a": 0,
            "k": {
              "i": [[0,0],[0,0]],
              "o": [[0,0],[0,0]],
              "v": [[750,180],[820,400]],
              "c": false
            }
          }
        },
        {
          "ty": "st",
          "c": { "a": 0, "k": [0.82, 0.82, 0.82, 1] },
          "o": { "a": 0, "k": 100 },
          "w": { "a": 0, "k": 2 },
          "lc": 2,
          "lj": 2,
          "d": [
            { "n": "d", "nm": "dash", "v": { "a": 0, "k": 8 } },
            { "n": "g", "nm": "gap",  "v": { "a": 0, "k": 6 } },
            { "n": "o", "nm": "offset", "v": {
              "a": 1,
              "k": [
                { "t": 0,   "s": [0],  "h": 0, "i": {"x":[0.4],"y":[1]}, "o": {"x":[0.6],"y":[0]} },
                { "t": 240, "s": [-56] }
              ]
            } }
          ]
        },
        {
          "ty": "tr",
          "p": { "a": 0, "k": [0, 0] },
          "a": { "a": 0, "k": [0, 0] },
          "s": { "a": 0, "k": [100, 100] },
          "r": { "a": 0, "k": 0 },
          "o": { "a": 0, "k": 100 }
        }
      ]
    }
  ],
  "ip": 0,
  "op": 240,
  "st": 0
}
```

- [ ] **Step 2: Validate JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('src/components/hero/mongolia-truck.json', 'utf8')); console.log('valid')"
```

Expected: `valid`.

- [ ] **Step 3: Commit**

```bash
git add src/components/hero/mongolia-truck.json
git commit -m "feat(hero): add animated dashed route from UB to Zamiin-Üüd"
```

---

## Task 5: Add UB and Zamiin-Üüd marker layers

**Files:**
- Modify: `src/components/hero/mongolia-truck.json`

Two circle markers with pulsing scale animation. UB at (750, 180), Zamiin-Üüd at (820, 400).

- [ ] **Step 1: Insert the UB marker layer**

Edit `src/components/hero/mongolia-truck.json`. Insert this layer after the `Route` layer:

```json
{
  "ddd": 0,
  "ind": 4,
  "ty": 4,
  "nm": "UB Marker",
  "sr": 1,
  "ks": {
    "o": { "a": 0, "k": 100 },
    "r": { "a": 0, "k": 0 },
    "p": { "a": 0, "k": [750, 180, 0] },
    "a": { "a": 0, "k": [0, 0, 0] },
    "s": {
      "a": 1,
      "k": [
        { "t": 0,   "s": [100, 100, 100], "i": {"x":[0.4,0.4,0.4],"y":[1,1,1]}, "o": {"x":[0.6,0.6,0.6],"y":[0,0,0]} },
        { "t": 45,  "s": [120, 120, 100], "i": {"x":[0.4,0.4,0.4],"y":[1,1,1]}, "o": {"x":[0.6,0.6,0.6],"y":[0,0,0]} },
        { "t": 90,  "s": [100, 100, 100] }
      ]
    }
  },
  "ao": 0,
  "shapes": [
    {
      "ty": "gr",
      "it": [
        {
          "ty": "el",
          "d": 1,
          "p": { "a": 0, "k": [0, 0] },
          "s": { "a": 0, "k": [12, 12] }
        },
        {
          "ty": "fl",
          "c": { "a": 0, "k": [0.2, 0.2, 0.2, 1] },
          "o": { "a": 0, "k": 100 },
          "r": 1
        },
        {
          "ty": "tr",
          "p": { "a": 0, "k": [0, 0] },
          "a": { "a": 0, "k": [0, 0] },
          "s": { "a": 0, "k": [100, 100] },
          "r": { "a": 0, "k": 0 },
          "o": { "a": 0, "k": 100 }
        }
      ]
    }
  ],
  "ip": 0,
  "op": 240,
  "st": 0
}
```

- [ ] **Step 2: Insert the Zamiin-Üüd marker layer**

Immediately after the UB marker layer, insert:

```json
{
  "ddd": 0,
  "ind": 5,
  "ty": 4,
  "nm": "Zamiin-Uud Marker",
  "sr": 1,
  "ks": {
    "o": { "a": 0, "k": 100 },
    "r": { "a": 0, "k": 0 },
    "p": { "a": 0, "k": [820, 400, 0] },
    "a": { "a": 0, "k": [0, 0, 0] },
    "s": {
      "a": 1,
      "k": [
        { "t": 45,  "s": [100, 100, 100], "i": {"x":[0.4,0.4,0.4],"y":[1,1,1]}, "o": {"x":[0.6,0.6,0.6],"y":[0,0,0]} },
        { "t": 90,  "s": [120, 120, 100], "i": {"x":[0.4,0.4,0.4],"y":[1,1,1]}, "o": {"x":[0.6,0.6,0.6],"y":[0,0,0]} },
        { "t": 135, "s": [100, 100, 100] }
      ]
    }
  },
  "ao": 0,
  "shapes": [
    {
      "ty": "gr",
      "it": [
        {
          "ty": "el",
          "d": 1,
          "p": { "a": 0, "k": [0, 0] },
          "s": { "a": 0, "k": [12, 12] }
        },
        {
          "ty": "fl",
          "c": { "a": 0, "k": [0.2, 0.2, 0.2, 1] },
          "o": { "a": 0, "k": 100 },
          "r": 1
        },
        {
          "ty": "tr",
          "p": { "a": 0, "k": [0, 0] },
          "a": { "a": 0, "k": [0, 0] },
          "s": { "a": 0, "k": [100, 100] },
          "r": { "a": 0, "k": 0 },
          "o": { "a": 0, "k": 100 }
        }
      ]
    }
  ],
  "ip": 0,
  "op": 240,
  "st": 0
}
```

- [ ] **Step 3: Insert text label layers ("УБ" and "Замын-Үүд")**

After the Zamiin-Üüd marker layer, insert these two text layers (note: Lottie text layers use `ty: 5`):

```json
{
  "ddd": 0,
  "ind": 6,
  "ty": 5,
  "nm": "UB Label",
  "sr": 1,
  "ks": {
    "o": { "a": 0, "k": 100 },
    "r": { "a": 0, "k": 0 },
    "p": { "a": 0, "k": [750, 165, 0] },
    "a": { "a": 0, "k": [0, 0, 0] },
    "s": { "a": 0, "k": [100, 100, 100] }
  },
  "ao": 0,
  "t": {
    "d": {
      "k": [
        {
          "s": {
            "s": 14,
            "f": "Arial",
            "t": "УБ",
            "j": 2,
            "tr": 0,
            "lh": 16,
            "ls": 0,
            "fc": [0.1, 0.1, 0.1]
          },
          "t": 0
        }
      ]
    },
    "p": {},
    "m": { "g": 1, "a": { "a": 0, "k": [0, 0] } },
    "a": []
  },
  "ip": 0,
  "op": 240,
  "st": 0
},
{
  "ddd": 0,
  "ind": 7,
  "ty": 5,
  "nm": "Zamiin-Uud Label",
  "sr": 1,
  "ks": {
    "o": { "a": 0, "k": 100 },
    "r": { "a": 0, "k": 0 },
    "p": { "a": 0, "k": [820, 425, 0] },
    "a": { "a": 0, "k": [0, 0, 0] },
    "s": { "a": 0, "k": [100, 100, 100] }
  },
  "ao": 0,
  "t": {
    "d": {
      "k": [
        {
          "s": {
            "s": 14,
            "f": "Arial",
            "t": "Замын-Үүд",
            "j": 2,
            "tr": 0,
            "lh": 16,
            "ls": 0,
            "fc": [0.1, 0.1, 0.1]
          },
          "t": 0
        }
      ]
    },
    "p": {},
    "m": { "g": 1, "a": { "a": 0, "k": [0, 0] } },
    "a": []
  },
  "ip": 0,
  "op": 240,
  "st": 0
}
```

Note: The `t.d.k[0].s.f` field ("Arial") references a font. `lottie-web` falls back to the browser default when a font isn't declared in a `fonts` section, which is acceptable here. If visual issues appear, add a `fonts` block at the top level of the JSON (alongside `assets`).

- [ ] **Step 4: Validate JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('src/components/hero/mongolia-truck.json', 'utf8')); console.log('valid')"
```

Expected: `valid`.

- [ ] **Step 5: Commit**

```bash
git add src/components/hero/mongolia-truck.json
git commit -m "feat(hero): add UB and Zamiin-Üüd markers with pulse + labels"
```

---

## Task 6: Add truck layer with motion animation

**Files:**
- Modify: `src/components/hero/mongolia-truck.json`

The truck is a group of 4 shapes (cabin, cargo box, 2 wheels) centered at the layer's origin `[0,0]`. The layer's `ks.p` (position) is keyframe-animated to move along the route, and `ks.s` (scale) flips on X to simulate the turnaround.

**Timeline (30fps, 240 total frames):**

| Frame | `ks.p` (position) | `ks.s` (scale) | What happens |
|---|---|---|---|
| 0   | [750, 180] | [0, 0]       | Truck invisible (scale 0) at UB |
| 15  | [750, 180] | [0, 0]       | Still invisible |
| 30  | [750, 180] | [100, 100]   | Pop in |
| 105 | [820, 400] | [100, 100]   | Reached Zamiin-Üüd |
| 120 | [820, 400] | [-100, 100]  | Turned around |
| 195 | [750, 180] | [-100, 100]  | Back at UB |
| 210 | [750, 180] | [100, 100]   | Turned around (face east again) |
| 240 | [750, 180] | [100, 100]   | Loop point |

- [ ] **Step 1: Insert the Truck layer at the end of the `layers` array**

Immediately before the closing `]` of `layers`, insert (prefixed with a comma):

```json
{
  "ddd": 0,
  "ind": 8,
  "ty": 4,
  "nm": "Truck",
  "sr": 1,
  "ks": {
    "o": { "a": 0, "k": 100 },
    "r": { "a": 0, "k": 0 },
    "p": {
      "a": 1,
      "k": [
        { "t": 30,  "s": [750, 180, 0], "i": {"x":0.4,"y":1}, "o": {"x":0.6,"y":0}, "to": [11.7, 36.7, 0], "ti": [-11.7, -36.7, 0] },
        { "t": 105, "s": [820, 400, 0], "h": 1 },
        { "t": 120, "s": [820, 400, 0], "i": {"x":0.4,"y":1}, "o": {"x":0.6,"y":0}, "to": [-11.7, -36.7, 0], "ti": [11.7, 36.7, 0] },
        { "t": 195, "s": [750, 180, 0] }
      ]
    },
    "a": { "a": 0, "k": [0, 0, 0] },
    "s": {
      "a": 1,
      "k": [
        { "t": 0,   "s": [0, 0, 100],     "h": 1 },
        { "t": 15,  "s": [0, 0, 100],     "i": {"x":[0.4,0.4,0.4],"y":[1,1,1]}, "o": {"x":[0.6,0.6,0.6],"y":[0,0,0]} },
        { "t": 30,  "s": [100, 100, 100], "h": 1 },
        { "t": 105, "s": [100, 100, 100], "i": {"x":[0.4,0.4,0.4],"y":[1,1,1]}, "o": {"x":[0.6,0.6,0.6],"y":[0,0,0]} },
        { "t": 120, "s": [-100, 100, 100], "h": 1 },
        { "t": 195, "s": [-100, 100, 100], "i": {"x":[0.4,0.4,0.4],"y":[1,1,1]}, "o": {"x":[0.6,0.6,0.6],"y":[0,0,0]} },
        { "t": 210, "s": [100, 100, 100] }
      ]
    }
  },
  "ao": 0,
  "shapes": [
    {
      "ty": "gr",
      "nm": "CargoBox",
      "it": [
        {
          "ty": "rc",
          "d": 1,
          "s": { "a": 0, "k": [24, 14] },
          "p": { "a": 0, "k": [-6, -9] },
          "r": { "a": 0, "k": 1 }
        },
        {
          "ty": "fl",
          "c": { "a": 0, "k": [0.945, 0.278, 0.173, 1] },
          "o": { "a": 0, "k": 100 },
          "r": 1
        },
        {
          "ty": "tr",
          "p": { "a": 0, "k": [0, 0] },
          "a": { "a": 0, "k": [0, 0] },
          "s": { "a": 0, "k": [100, 100] },
          "r": { "a": 0, "k": 0 },
          "o": { "a": 0, "k": 100 }
        }
      ]
    },
    {
      "ty": "gr",
      "nm": "Cabin",
      "it": [
        {
          "ty": "rc",
          "d": 1,
          "s": { "a": 0, "k": [10, 10] },
          "p": { "a": 0, "k": [11, -7] },
          "r": { "a": 0, "k": 1 }
        },
        {
          "ty": "fl",
          "c": { "a": 0, "k": [0.945, 0.278, 0.173, 1] },
          "o": { "a": 0, "k": 100 },
          "r": 1
        },
        {
          "ty": "tr",
          "p": { "a": 0, "k": [0, 0] },
          "a": { "a": 0, "k": [0, 0] },
          "s": { "a": 0, "k": [100, 100] },
          "r": { "a": 0, "k": 0 },
          "o": { "a": 0, "k": 100 }
        }
      ]
    },
    {
      "ty": "gr",
      "nm": "WheelRear",
      "it": [
        {
          "ty": "el",
          "d": 1,
          "s": { "a": 0, "k": [5, 5] },
          "p": { "a": 0, "k": [0, 0] }
        },
        {
          "ty": "fl",
          "c": { "a": 0, "k": [0.1, 0.1, 0.1, 1] },
          "o": { "a": 0, "k": 100 },
          "r": 1
        },
        {
          "ty": "tr",
          "p": { "a": 0, "k": [-12, 0] },
          "a": { "a": 0, "k": [0, 0] },
          "s": { "a": 0, "k": [100, 100] },
          "r": {
            "a": 1,
            "k": [
              { "t": 0,   "s": [0],    "i": {"x":[0.5],"y":[0.5]}, "o": {"x":[0.5],"y":[0.5]} },
              { "t": 240, "s": [2880] }
            ]
          },
          "o": { "a": 0, "k": 100 }
        }
      ]
    },
    {
      "ty": "gr",
      "nm": "WheelFront",
      "it": [
        {
          "ty": "el",
          "d": 1,
          "s": { "a": 0, "k": [5, 5] },
          "p": { "a": 0, "k": [0, 0] }
        },
        {
          "ty": "fl",
          "c": { "a": 0, "k": [0.1, 0.1, 0.1, 1] },
          "o": { "a": 0, "k": 100 },
          "r": 1
        },
        {
          "ty": "tr",
          "p": { "a": 0, "k": [13, 0] },
          "a": { "a": 0, "k": [0, 0] },
          "s": { "a": 0, "k": [100, 100] },
          "r": {
            "a": 1,
            "k": [
              { "t": 0,   "s": [0],    "i": {"x":[0.5],"y":[0.5]}, "o": {"x":[0.5],"y":[0.5]} },
              { "t": 240, "s": [2880] }
            ]
          },
          "o": { "a": 0, "k": 100 }
        }
      ]
    }
  ],
  "ip": 0,
  "op": 240,
  "st": 0
}
```

- [ ] **Step 2: Validate JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('src/components/hero/mongolia-truck.json', 'utf8')); console.log('valid')"
```

Expected: `valid`.

- [ ] **Step 3: Commit**

```bash
git add src/components/hero/mongolia-truck.json
git commit -m "feat(hero): add truck with UB <-> Zamiin-Üüd round-trip motion"
```

---

## Task 7: Create the `MapAnimation` client component

**Files:**
- Create: `src/components/hero/MapAnimation.tsx`

- [ ] **Step 1: Write the component**

Create `src/components/hero/MapAnimation.tsx` with exactly this content:

```tsx
"use client";

import Lottie from "lottie-react";
import animationData from "./mongolia-truck.json";

export default function MapAnimation() {
  return (
    <div className="w-full max-w-7xl mx-auto aspect-12/5">
      <Lottie animationData={animationData} loop autoplay />
    </div>
  );
}
```

- [ ] **Step 2: Type-check via build**

```bash
npm run build
```

Expected: Build succeeds with no type errors. If it fails with `Cannot find module './mongolia-truck.json'`, verify `tsconfig.json` has `"resolveJsonModule": true` (Next.js enables this by default — no action needed in normal cases).

- [ ] **Step 3: Commit**

```bash
git add src/components/hero/MapAnimation.tsx
git commit -m "feat(hero): add MapAnimation client component"
```

---

## Task 8: Add `prefers-reduced-motion` support

**Files:**
- Modify: `src/components/hero/MapAnimation.tsx`

When a user has "Reduce Motion" enabled, freeze the animation on the first frame.

- [ ] **Step 1: Replace the component with the reduced-motion-aware version**

Replace the entire contents of `src/components/hero/MapAnimation.tsx` with:

```tsx
"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import animationData from "./mongolia-truck.json";

export default function MapAnimation() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto aspect-12/5">
      <Lottie
        animationData={animationData}
        loop={!reduceMotion}
        autoplay={!reduceMotion}
      />
    </div>
  );
}
```

- [ ] **Step 2: Type-check via build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/hero/MapAnimation.tsx
git commit -m "feat(hero): respect prefers-reduced-motion in MapAnimation"
```

---

## Task 9: Integrate `MapAnimation` into the homepage

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Add the import and render the hero**

Replace the entire contents of `src/app/page.tsx` with:

```tsx
import { auth } from "@/auth";
import FeaturedCard from "@/components/cards/FeaturedCard";
import MapAnimation from "@/components/hero/MapAnimation";
import ServerApi from "@/services/ServerApi";
import { FeaturedCar } from "@/types/featured";

async function getFeaturedCars(accessToken: string): Promise<FeaturedCar[]> {
  console.log("accessToken:", accessToken);
  const api = ServerApi(accessToken);
  return api.get("/featured", {}, { cache: "no-store" } as RequestInit);
}

export default async function Home() {
  const session = await auth();
  const cars = session?.accessToken
    ? await getFeaturedCars(session.accessToken)
    : [];

  return (
    <>
      <section className="w-full">
        <MapAnimation />
      </section>
      <div className="max-w-7xl mx-auto py-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Онцлох машинууд
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {cars.map((car) => (
            <FeaturedCard key={car.ID} car={car} />
          ))}
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Type-check via build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: render MapAnimation hero on homepage"
```

---

## Task 10: Visual verification in dev server

**Files:** none (runtime verification only)

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

The server runs on port **2500**. Open [http://localhost:2500](http://localhost:2500) in a browser.

- [ ] **Step 2: Verify all success criteria**

Check each of the following — every box must be confirmed:

- [ ] Hero renders above "Онцлох машинууд" heading
- [ ] White background, grey Mongolia outline visible
- [ ] UB and Zamiin-Üüd markers visible at top-right and bottom of the map
- [ ] Dashed route line between the two markers
- [ ] Route dashes appear to "flow" from UB toward Zamiin-Üüd
- [ ] Orange truck appears at UB within the first second
- [ ] Truck moves from UB → Zamiin-Üüd smoothly (~2.5s)
- [ ] Truck flips (mirror) at Zamiin-Üüd and drives back to UB
- [ ] Animation loops seamlessly
- [ ] Markers pulse subtly when the truck approaches/departs
- [ ] No console errors in DevTools

- [ ] **Step 3: Verify reduced motion**

In macOS: System Settings → Accessibility → Display → enable "Reduce motion".

Reload the page. The animation should render statically on the first frame (no truck, no flow). Disable reduce motion and reload to restore animation.

- [ ] **Step 4: Verify responsiveness**

Resize the browser window from 320px to 1440px. The animation should scale proportionally and stay within `max-w-7xl` bounds. No horizontal overflow.

- [ ] **Step 5: Check performance**

Open Chrome DevTools → Performance tab → record 5 seconds while animation runs. CPU usage should remain below 10% and there should be no dropped frames.

- [ ] **Step 6: Check JSON file size**

```bash
ls -la src/components/hero/mongolia-truck.json
```

Expected: under 50KB (uncompressed).

- [ ] **Step 7: Stop dev server**

Press `Ctrl+C` in the terminal running `npm run dev`.

---

## Task 11 (contingency): Visual tuning

**Only execute if Task 10 reveals visual issues.** Otherwise, skip.

If any of these happen, diagnose and fix the Lottie JSON:

| Symptom | Likely cause | Fix |
|---|---|---|
| Truck doesn't appear | Scale keyframes wrong | Verify Task 6 Step 1 — scale goes 0→100 at frame 30 |
| Truck doesn't flip | `ks.s` x-component not -100 at frame 120 | Re-check the scale keyframe table in Task 6 |
| Truck overshoots markers | Position keyframes off | Verify positions are `[750,180]` and `[820,400]` |
| Dashes don't flow | Dash offset keyframe not animated | Verify `d[2].v.a: 1` in Task 4 |
| Labels cut off | Text anchor/position | Adjust `ks.p` y-value for label layers in Task 5 |
| Mongolia shape looks wrong | Polygon vertices | Tune the `v` array in Task 3 — 14 points, clockwise |

For each fix, make the edit, run the JSON validator, and commit with message `fix(hero): <specific fix>`.

---

## Success Criteria

All of the following must be true at the end of execution:

1. `npm run build` passes with no errors
2. Dev server renders the homepage with the animated hero
3. All 11 bullets in Task 10 Step 2 are confirmed
4. `prefers-reduced-motion` is respected (Task 10 Step 3)
5. No console errors or warnings in DevTools
6. JSON file is under 50KB
7. Each task has its own commit
