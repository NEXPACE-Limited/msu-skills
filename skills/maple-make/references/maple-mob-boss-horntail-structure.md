---
name: maple-mob-boss-horntail-structure
description: |
  Horntail multi-part boss rendering: 18 parts (10 alive + 8 dead), HP-based phase transitions,
  z-order, and action mapping. Load when rendering Horntail (8810000–8810017).
user-invocable: true
disable-model-invocation: false
---

# Horntail — Multi-Part Boss Rendering

Horntail is an **18-part composite boss** — the most complex multi-part boss in MapleStory. It consists of 10 alive parts and 8 dead (destroyed) counterparts. All parts share the same world anchor point and are drawn with their per-frame `origin` offsets.

## Parts

### Alive Parts (10)

| Part ID   | Label   | Role                                  | Z-Offset |
|-----------|---------|---------------------------------------|----------|
| 8810000   | LHead   | Left Head (Phase 1 solo boss)         | 0        |
| 8810001   | RHead   | Right Head (Phase 2 solo boss)        | 0        |
| 8810002   | HeadA   | Head A — left head on full body       | 1        |
| 8810003   | HeadB   | Head B — center/back head             | 2        |
| 8810004   | HeadC   | Head C — right head on full body      | 1        |
| 8810005   | LHand   | Left Hand                             | 0        |
| 8810006   | RHand   | Right Hand                            | 0        |
| 8810007   | Wings   | Wings (heals HP, summons Cornians)    | -3       |
| 8810008   | Legs    | Legs                                  | -1       |
| 8810009   | Tails   | Tails (highest ATK)                   | -2       |

### Dead Parts (8)

| Part ID   | Label      | Replaces | Z-Offset |
|-----------|------------|----------|----------|
| 8810010   | DeadHeadA  | HeadA    | 1        |
| 8810011   | DeadHeadB  | HeadB    | 2        |
| 8810012   | DeadHeadC  | HeadC    | 1        |
| 8810013   | DeadLHand  | LHand    | 0        |
| 8810014   | DeadRHand  | RHand    | 0        |
| 8810015   | DeadWings  | Wings    | -3       |
| 8810016   | DeadLegs   | Legs     | -1       |
| 8810017   | DeadTails  | Tails    | -2       |

All parts have `info.noFlip = 1` — **never flip horizontally**.

## Phase System

Horntail has 3 game phases across separate maps, with progressive part destruction in Phase 3:

### Game Phases

| Phase | Map                 | Visible Parts | Description |
|-------|---------------------|---------------|-------------|
| 1     | The Cave of Trial I  | LHead         | Left Head solo — summons Red/Blue/Dark Wyverns |
| 2     | The Cave of Trial II | RHead         | Right Head solo — summons Wyverns |
| 3     | Horntail's Cave      | 8 body parts  | Full body — each part has independent HP |

### Phase 3 Destruction Sequence (Recommended Kill Order)

| Step | Dead Part(s)                                  | Reason |
|------|-----------------------------------------------|--------|
| 1    | Tails → DeadTails                             | Highest ATK damage |
| 2    | LHand, RHand → DeadLHand, DeadRHand          | Seduce skill |
| 3    | Legs → DeadLegs                               | |
| 4    | Wings → DeadWings                             | Heals other parts |
| 5    | HeadA, HeadC → DeadHeadA, DeadHeadC           | Side heads |
| 6    | HeadB → DeadHeadB                             | Center head (last) |

### Viewer Phases

| Phase | Name                        | Visible Parts |
|-------|-----------------------------|---------------|
| 0     | Phase 1 (Left Head)         | LHead |
| 1     | Phase 2 (Right Head)        | RHead |
| 2     | Phase 3 (Full Body)         | Wings, Tails, Legs, LHand, RHand, HeadA, HeadC, HeadB |
| 3     | Phase 3 (Tails Dead)              | Wings, DeadTails, Legs, LHand, RHand, HeadA, HeadC, HeadB |
| 4     | Phase 3 (Legs+Tails Dead)         | Wings, DeadTails, DeadLegs, LHand, RHand, HeadA, HeadC, HeadB |
| 5     | Phase 3 (Hands+Legs+Tails Dead)   | Wings, DeadTails, DeadLegs, DeadLHand, DeadRHand, HeadA, HeadC, HeadB |
| 6     | Phase 3 (Heads Only)              | DeadWings, DeadTails, DeadLegs, DeadLHand, DeadRHand, HeadA, HeadC, HeadB |
| 7     | All Parts (debug)           | All 10 alive parts (including LHead, RHead) |

## Z-Order

Parts render at the **same world anchor** with different depth values:

| Z-Offset | Parts                        | Layer |
|----------|------------------------------|-------|
| -3       | Wings, DeadWings             | Farthest back |
| -2       | Tails, DeadTails             | Behind body |
| -1       | Legs, DeadLegs               | Behind hands |
| 0        | LHead, RHead, LHand, RHand, DeadLHand, DeadRHand | Mid |
| 1        | HeadA, HeadC, DeadHeadA, DeadHeadC | Front |
| 2        | HeadB, DeadHeadB             | Frontmost |

In Phaser: `sprite.setDepth(10 + zOffset)` — so Wings at depth 7, HeadB at depth 12.

## Rendering

All parts share the same world position (anchor). Per-frame `origin` handles the relative offset:

```
draw_x = anchor_x - frame.origin.x
draw_y = anchor_y - frame.origin.y
```

### Stand Frame 0 Origins (Alive Parts)

| Part    | origin.x | origin.y |
|---------|----------|----------|
| LHead   | 297      | 467      |
| RHead   | 170      | 467      |
| HeadA   | 243      | 505      |
| HeadB   | 81       | 628      |
| HeadC   | 10       | 505      |
| LHand   | 210      | 321      |
| RHand   | 0        | 321      |
| Wings   | 287      | 363      |
| Legs    | 257      | 183      |
| Tails   | -21      | 144      |

### Stand Frame 0 Origins (Dead Parts)

| Part       | origin.x | origin.y |
|------------|----------|----------|
| DeadHeadA  | 243      | 505      |
| DeadHeadB  | 81       | 629      |
| DeadHeadC  | 10       | 505      |
| DeadLHand  | 210      | 321      |
| DeadRHand  | 0        | 321      |
| DeadWings  | 287      | 364      |
| DeadLegs   | 257      | 183      |
| DeadTails  | -20      | 140      |

> Every frame has its own `origin`. Do not cache or reuse across frames.

## Actions per Part

### Alive Parts

| Part    | Actions (frames) |
|---------|------------------|
| LHead   | stand(10), attack1(24), attack2(16), attack3(16), die1(41), hit1(1), regen(41), skill1(16), skill2(17), skill3(17) |
| RHead   | stand(10), attack1(23), attack2(16), attack3(16), die1(41), hit1(1), regen(41), skill1(16), skill2(17), skill3(17) |
| HeadA   | stand(40), attack1(23), attack2(17), attack3(17), die1(13), hit1(1), regen(1) ⚡effect-only (dummy sprite), skill1(16), skill2(14) |
| HeadB   | stand(50), attack1(26), attack2(15), attack3(15), die1(12), hit1(1), regen(37), skill1(14), skill2(14), skill3(13) |
| HeadC   | stand(60), attack1(24), attack2(17), attack3(17), die1(13), hit1(1), regen(1) ⚡effect-only (dummy sprite), skill1(16), skill2(14) |
| LHand   | stand(36), attack1(18), die1(15), hit1(1), regen(1) ⚡effect-only (dummy sprite), skill1(17), skill2(16), skill3(16) |
| RHand   | stand(42), attack1(18), die1(15), hit1(1), regen(1) ⚡effect-only (dummy sprite), skill1(17), skill2(16), skill3(16) |
| Wings   | stand(32), die1(13), hit1(1), regen(1) ⚡effect-only (dummy sprite), skill1(21), skill2(18), skill3(17) |
| Legs    | stand(3), attack1(14), attack2(17), attack3(14), attack4(17), die1(12), hit1(1), regen(1) ⚡effect-only (dummy sprite) |
| Tails   | stand(4), attack1(20), die1(9), hit1(1), regen(1) ⚡effect-only (dummy sprite), skill1(15) |

### Dead Parts

All dead parts share the same minimal action set:

| Part       | Actions (frames) |
|------------|------------------|
| DeadHeadA  | stand(1), die1(1), hit1(1) |
| DeadHeadB  | stand(1), die1(1), hit1(1) |
| DeadHeadC  | stand(1), die1(1), hit1(1) |
| DeadLHand  | stand(1), die1(1), hit1(1) |
| DeadRHand  | stand(1), die1(1), hit1(1) |
| DeadWings  | stand(1), die1(1), hit1(1) |
| DeadLegs   | stand(1), die1(1), hit1(1) |
| DeadTails  | stand(1), die1(1), hit1(1) |

Each dead part has its **own** `_path` field — `_inlink` is absent. Use `_path` directly.

### Action Fallback

Not all parts have every action. When playing an action:
1. If the part has the action → play it
2. If not → fallback to `stand`

Example: Playing `attack1` — Wings does not have attack1 → Wings stays on `stand`.

## Data Paths

CDN base: `https://resource-static.msu.io/data/`

### JSON Paths

| Resource | CDN Path (append to base) |
|----------|---------------------------|
| LHead JSON     | `Mob/8810000.json` |
| RHead JSON     | `Mob/8810001.json` |
| HeadA JSON     | `Mob/8810002.json` |
| HeadB JSON     | `Mob/8810003.json` |
| HeadC JSON     | `Mob/8810004.json` |
| LHand JSON     | `Mob/8810005.json` |
| RHand JSON     | `Mob/8810006.json` |
| Wings JSON     | `Mob/8810007.json` |
| Legs JSON      | `Mob/8810008.json` |
| Tails JSON     | `Mob/8810009.json` |
| DeadHeadA JSON | `Mob/8810010.json` |
| DeadHeadB JSON | `Mob/8810011.json` |
| DeadHeadC JSON | `Mob/8810012.json` |
| DeadLHand JSON | `Mob/8810013.json` |
| DeadRHand JSON | `Mob/8810014.json` |
| DeadWings JSON | `Mob/8810015.json` |
| DeadLegs JSON  | `Mob/8810016.json` |
| DeadTails JSON | `Mob/8810017.json` |

PNG paths come from each frame's `_path` field:

```
Mob/8810007/stand/0.png   → Wings stand frame 0
Mob/8810002/stand/0.png   → HeadA stand frame 0
Mob/8810017/stand/0.png   → DeadTails stand frame 0
```

Full URL: `CDN + frame._path`

## Important Notes

- **LHead (8810000) and RHead (8810001)** are standalone bosses for Phases 1 and 2. They are NOT used in Phase 3 — HeadA/HeadB/HeadC replace them.
- **Dead parts have matching z-offsets** to their alive counterparts, ensuring seamless visual replacement.
- All 18 parts have `noFlip = 1`.
- Wings has **no attack action** — it only uses skill actions (heal, summon).
- Legs has **4 attack variants** (attack1–attack4) but no skill actions.

## Quick Implementation

```js
const CDN = "https://resource-static.msu.io/data/";

// 1. Define parts
const PARTS = [
  { id: '8810000', label: 'LHead',     zOffset: 0 },
  { id: '8810001', label: 'RHead',     zOffset: 0 },
  { id: '8810007', label: 'Wings',     zOffset: -3 },
  { id: '8810009', label: 'Tails',     zOffset: -2 },
  { id: '8810008', label: 'Legs',      zOffset: -1 },
  { id: '8810005', label: 'LHand',     zOffset: 0 },
  { id: '8810006', label: 'RHand',     zOffset: 0 },
  { id: '8810002', label: 'HeadA',     zOffset: 1 },
  { id: '8810004', label: 'HeadC',     zOffset: 1 },
  { id: '8810003', label: 'HeadB',     zOffset: 2 },
  { id: '8810015', label: 'DeadWings', zOffset: -3 },
  { id: '8810017', label: 'DeadTails', zOffset: -2 },
  { id: '8810016', label: 'DeadLegs',  zOffset: -1 },
  { id: '8810013', label: 'DeadLHand', zOffset: 0 },
  { id: '8810014', label: 'DeadRHand', zOffset: 0 },
  { id: '8810010', label: 'DeadHeadA', zOffset: 1 },
  { id: '8810012', label: 'DeadHeadC', zOffset: 1 },
  { id: '8810011', label: 'DeadHeadB', zOffset: 2 },
];

// 2. Phase definitions
const PHASES = [
  { name: 'Phase 1 (Left Head)',  partLabels: ['LHead'] },
  { name: 'Phase 2 (Right Head)', partLabels: ['RHead'] },
  { name: 'Phase 3 (Full Body)',  partLabels: ['Wings','Tails','Legs','LHand','RHand','HeadA','HeadC','HeadB'] },
  // ... additional destruction phases
];

// 3. Load all part JSONs
const partJsons = {};
for (const part of PARTS) {
  partJsons[part.id] = await fetch(CDN + `Mob/${part.id}.json`).then(r => r.json());
}

// 4. Render at same anchor, sorted by zOffset
function draw(anchorX, anchorY, visibleParts) {
  const sorted = visibleParts.sort((a, b) => a.zOffset - b.zOffset);
  for (const part of sorted) {
    const frame = getCurrentFrame(part);
    ctx.drawImage(textures[frame._path], anchorX - frame.origin.x, anchorY - frame.origin.y);
  }
}
```
