---
name: maple-mob-boss-balrog-structure
description: |
  Balrog multi-part boss rendering: 7 parts, HP-based phase transitions, z-order,
  and action mapping. Load when rendering Balrog (8830000–8830006).
---

# Balrog — Multi-Part Boss Rendering

Balrog is a **7-part composite boss**. Each part is an independent mob JSON with its own animation states and sprites. All parts share the same world anchor point and are drawn with their per-frame `origin` offsets.

## Parts

| Part ID   | Label      | Role                          |
|-----------|------------|-------------------------------|
| 8830000   | Body       | Torso + wings (always visible except Spirit phase) |
| 8830001   | LeftHand   | Left hand (alive)             |
| 8830002   | RightHand  | Right hand (alive)            |
| 8830003   | Spirit     | Full upper-body spirit form (invincibility phase) |
| 8830004   | LeftDead   | Left hand (sealed/dead)       |
| 8830005   | RightDead  | Right hand (sealed/dead)      |
| 8830006   | LeftDummy  | Left hand placeholder (identical sprites to LeftDead) |

All parts have `info.noFlip = 1` — **never flip horizontally**.

## Phase System

Balrog has HP-based phases that determine which parts are visible:

| Phase | HP Range   | Visible Parts                    | Description |
|-------|------------|----------------------------------|-------------|
| 1     | 100% → 75% | Body + LeftHand + RightHand     | Both hands alive |
| 2     | 75% → 50%  | Body + LeftDead + RightHand     | Left hand sealed |
| 3     | 75% → 50%  | Body + LeftHand + RightDead     | Right hand sealed |
| 4     | 50% → 0%   | Body + LeftDead + RightDead     | Both hands sealed |
| Spirit | Periodic  | Spirit (alone)                  | Invincibility — replaces all other parts |

> Phase 2 and 3 are alternative — which hand dies first depends on gameplay. For a viewer, offer both.

## Z-Order

Parts render at the **same world anchor** with different depth:

| Part(s)          | Depth   | Rule |
|------------------|---------|------|
| Body, Spirit     | Behind  | `z_base - 1` |
| LeftHand, RightHand, LeftDead, RightDead, LeftDummy | In front | `z_base` |

Hands render **in front of** the body. In Phaser: `body.setDepth(9)`, hands `.setDepth(10)`.

## Rendering

All parts share the same world position (anchor). Per-frame `origin` handles the relative offset:

```
// For each visible part:
draw_x = anchor_x - frame.origin.x
draw_y = anchor_y - frame.origin.y
```

Body and Spirit have large origins (~324, 560) placing them with feet at the anchor. Hands have smaller/negative origins positioning them relative to the body's shoulders.

### Example: Stand Frame 0 Origins

| Part       | origin.x | origin.y |
|------------|----------|----------|
| Body       | 324      | 560      |
| LeftHand   | 376      | 209      |
| RightHand  | -188     | 208      |
| Spirit     | 324      | 560      |
| LeftDead   | 441      | 193      |
| RightDead  | -128     | 191      |

> Every frame has its own `origin`. Do not cache or reuse across frames.

## Actions per Part

| Part       | Actions |
|------------|---------|
| Body       | stand(12), attack1(24), attack2(27), attack3(23), attack4(17), die1(60), hit1(1), skill1(23), skill16(9) |
| LeftHand   | stand(12), attack1(21), attack2(29), die1(28), hit1(1), skill1(37) |
| RightHand  | stand(12), attack1(21), attack2(24), attack3(19), die1(28), hit1(1) |
| Spirit     | stand(12), die1(1), hit1(1) ⚡effect-only (dummy sprite), skill1(24), skill16(23) |
| LeftDead   | stand(1), die1(1), hit1(1) |
| RightDead  | stand(1), die1(1), hit1(1) |
| LeftDummy  | stand(1), die1(22), hit1(1) |

Frame counts in parentheses. Number = number of animation frames.

### Action Fallback

Not all parts have every action. When playing an action:
1. If the part has the action → play it
2. If not → fallback to `stand`

Example: Playing `attack3` — Body and RightHand have it, but LeftHand does not → LeftHand stays on `stand`.

## Data Paths

CDN base: `https://resource-static.msu.io/data/`

| Resource | CDN Path (append to base) |
|----------|---------------------------|
| Body JSON | `Mob/8830000.json` |
| LeftHand JSON | `Mob/8830001.json` |
| RightHand JSON | `Mob/8830002.json` |
| Spirit JSON | `Mob/8830003.json` |
| LeftDead JSON | `Mob/8830004.json` |
| RightDead JSON | `Mob/8830005.json` |
| LeftDummy JSON | `Mob/8830006.json` |

PNG paths come from each frame's `_path` field (already CDN-relative):

```
Mob/8830000/stand/0.png   → Body stand frame 0
Mob/8830001/stand/0.png   → LeftHand stand frame 0
Mob/8830003/stand/0.png   → Spirit stand frame 0
```

Full URL: `CDN + frame._path`

## Quick Implementation

```js
const CDN = "https://resource-static.msu.io/data/";

// 1. Define parts and phases
const PARTS = [
  { id: '8830000', label: 'Body',      zOffset: -1 },
  { id: '8830001', label: 'LeftHand',   zOffset: 0 },
  { id: '8830002', label: 'RightHand',  zOffset: 0 },
  { id: '8830003', label: 'Spirit',     zOffset: -1 },
  { id: '8830004', label: 'LeftDead',   zOffset: 0 },
  { id: '8830005', label: 'RightDead',  zOffset: 0 },
  { id: '8830006', label: 'LeftDummy',  zOffset: 0 },
];

const PHASES = [
  { name: 'Phase 1', partLabels: ['Body', 'LeftHand', 'RightHand'] },
  { name: 'Phase 2', partLabels: ['Body', 'LeftDead', 'RightHand'] },
  { name: 'Phase 3', partLabels: ['Body', 'LeftHand', 'RightDead'] },
  { name: 'Phase 4', partLabels: ['Body', 'LeftDead', 'RightDead'] },
  { name: 'Spirit',  partLabels: ['Spirit'] },
];

// 2. Part JSONs — fetch each through maple-lookup and inline the result here.
//    Browser fetch() of CDN JSON is blocked (no CORS headers); PNGs still load via <img>.
const partJsons = { /* '8830000': { …get_sprite_data output… }, … */ };

// 3. Create animator per part
const animators = PARTS.map(part => ({
  label: part.label,
  zOffset: part.zOffset,
  json: partJsons[part.id],
  visible: false,
}));

// 4. Set phase → toggle visibility
function setPhase(phase) {
  animators.forEach(a => {
    a.visible = phase.partLabels.includes(a.label);
  });
}

// 5. Load PNG: CDN + frame._path
function loadImage(path) {
  const img = new Image();
  // No crossOrigin — the CDN sends no CORS headers, so 'anonymous' fails the load outright.
  // The canvas is tainted as a result: draw only, no getImageData()/toDataURL().
  img.src = CDN + path;
  return img;
}

// 6. Render: all visible parts at same anchor
function draw(anchorX, anchorY) {
  // Sort by zOffset (lower = behind)
  const sorted = animators.filter(a => a.visible).sort((a, b) => a.zOffset - b.zOffset);
  for (const a of sorted) {
    const frame = getCurrentFrame(a);
    const x = anchorX - frame.origin.x;
    const y = anchorY - frame.origin.y;
    ctx.drawImage(textures[frame._path], x, y);
  }
}
```

## Notes

- 8830007 exists in data but has **no actions** — ignore it.
- LeftDummy (8830006) has identical stand sprite to LeftDead (8830004). It is used as a placeholder during transition animations.
- Spirit has no `lt`/`rb` bounding box — it is invincible and has no hitbox.
