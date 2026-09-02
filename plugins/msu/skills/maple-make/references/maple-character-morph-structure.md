---
name: maple-character-morph-structure
description: Morph transformation file structure, animation states, head socket, bounding box, and info fields. Load when implementing morph rendering or transformation logic.
---

# Morph File Structure

## File Path

```
Morph/{4-digit-zero-pad}.json
```

Example: `Morph/0002.json` (ID 2), `Morph/1000.json` (ID 1000)

## Top-Level Structure

```json
{
  "info": { "speed": 110, "jump": 105, "swim": "100", "fs": "10", ... },
  "stand": { "0": {...}, "1": {...}, ... },
  "walk": { ... },
  "jump": { ... },
  "fly": { ... },
  "ladder": { ... },
  "rope": { ... },
  "prone": { ... }
}
```

Morph sprites are **single-layer** — one PNG per frame (no body/arm/head separation like Characters). Equipment is not rendered during morph.

## Animation States

179 morph files surveyed. 87 unique state names.

| State | Count | Description |
|-------|-------|-------------|
| `stand` | 178 | Idle |
| `walk` | 178 | Walking |
| `jump` | 178 | Jumping (typically 1 frame, hold for airborne duration) |
| `prone` | 178 | Lying down |
| `fly` | 177 | Flying |
| `ladder` | 111 | Ladder climbing |
| `rope` | 111 | Rope climbing |
| `sit` | 55 | Sitting |
| `hit` | 35 | Damage reaction |
| `alert` | 13 | Combat stance |
| `proneStab` | 10 | Prone attack |
| `dead` | 2 | Death |

Remaining states are skill/class-specific (e.g., `DKdragonSlash0`, `iceAttack1`, `battlePVP_Attack`). Always discover states at runtime.

## Frame Structure

```json
// Morph/0002.json → "stand" → "0"
{
  "_path": "Morph/0002/stand/0.png",
  "origin": { "x": 34, "y": 50 },
  "head": { "x": -11, "y": -37 },
  "lt": { "x": -34, "y": -49 },
  "rb": { "x": 34, "y": 0 },
  "delay": 180
}
```

| Field | Presence | Meaning |
|-------|----------|---------|
| `_path` | 100% | PNG file path (relative to `data/`) |
| `origin` | 100% | Sprite anchor point (feet position) |
| `head` | 96.7% | Face origin offset — used for name tag, speech bubble, and emotion display positioning |
| `lt` / `rb` | 95.4% | Rendering bounding box (not collision). `rb.y` is always `0` (bottom aligns with origin). |
| `delay` | 84.3% | Frame duration in ms. **Default 120ms** when absent. |
| `z` | 24% | Render layer — almost always `0`. Default `0` when absent. |
| `_inlink` | rare | Cross-frame alias — **ignore**, `_path` is already resolved |

### head Socket

The `head` field provides the face origin offset relative to the sprite origin. Used to position:
- Name tag display
- Speech bubbles
- Emotion/expression overlays

When flipped (facing right), negate `head.x`: `faceOrigin = morphOrigin + { -head.x, head.y }`.

## Info Fields

| Field | Count | Type | Meaning |
|-------|-------|------|---------|
| `speed` | 169 | number | Movement speed |
| `jump` | 168 | number | Jump power |
| `fs` | 167 | string | Face scale multiplier (parse as number, default 1.0) |
| `swim` | 167 | string | Swim speed (parse as number) |
| `noCancelDamage` | 154 | number | 1 = damage does not cancel morph actions |
| `morphEffect` | 31 | number | 1 (default) = show transformation effect, 0 = disable |
| `noMove` | 8 | number | 1 = movement disabled during morph |
| `superman` | 6 | number | Superman-type morph flag |
| `kaiser` | 4 | number | Kaiser dragon morph flag |

Note: `fs` and `swim` are stored as **strings** — always parse with `parseInt` or `parseFloat`.

## Flip Rule

Morph sprites face **left by default** (same as Mob/Character/NPC). Flip horizontally when facing right, with the same anchor correction: `anchorX = width - origin.x`.

## PNG Path Rule

```
Morph/{morphID}/{state}/{frame}.png
```

## Quick Reference

```
// loadJSON(): the JSON already inlined into the page — never a browser fetch (the CDN has no CORS)
// Render a morph
const morphData = loadJSON(`Morph/${morphId.toString().padStart(4,'0')}.json`);
const frame = morphData.stand["0"];
renderSprite(frame._path, frame.origin);
// Name tag position: morphWorldPos + frame.head
```

## Manifest

For morph discovery use `data/manifest/morphs.json` (20 curated morphs).

Fields: `id`, `speed`, `jump`, `swim`, `fs`, `states` (animation state list)
