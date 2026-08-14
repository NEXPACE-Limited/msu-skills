---
name: maple-character-tamingmob-structure
description: |
  TamingMob (mount/riding) file structure: stats vs sprite file distinction,
  multi-layer z-ordering, character attachment via navel socket, and animation states.
  Use when implementing mount riding, character-on-mount rendering, or mount selection.
---

# TamingMob (Mount/Riding) Structure

## File Types: Stats vs Sprites

| Type | Path | Contains |
|------|------|---------|
| Stats file | `TamingMob/{statID}.json` | Movement stats (speed, jump, swim, fatigue) |
| Sprite file | `Character/TamingMob/{tamingMobID}.json` | Animation frames with socket data |

900 sprite files exist. 23 stats files exist.

## Stats File Structure

```json
// TamingMob/0001.json
{
  "info": {
    "speed": 150,
    "jump": 120,
    "swim": "100",
    "fatigue": 5,
    "fs": "10"
  }
}
```

| Field | Meaning |
|-------|---------|
| `speed` | Movement speed modifier |
| `jump` | Jump height modifier |
| `swim` | Swimming speed (may be string) |
| `fatigue` | Fatigue cost per use |
| `fs` | Frame style preset (may be string) |

## Sprite File Structure

Frame hierarchy: `action → frameNum → partNum → PartData`

```json
// Character/TamingMob/01902000.json → stand1 → frame 0
{
  "stand1": {
    "0": {
      "0": {
        "_path": "Character/TamingMob/01902000/stand1/0/0.png",
        "origin": { "x": 34, "y": 50 },
        "z": "tamingMobMid",
        "map": { "navel": { "x": 3, "y": -51 } }
      },
      "delay": 180
    }
  }
}
```

Each part's **`z` field** is the z-name used for z-ordering against `zmap.json` (e.g. `"z": "tamingMobMid"`).

**Parts are usually numbered** (0, 1, 2...). Filter with `!isNaN(Number(key))` to skip `delay` and other metadata.

**Edge cases**: `origin` may be null (5 mounts: 01932249, 01983375–01983378) → default to `{x:0, y:0}`. `map` may be null/absent (no navel) — see Socket Merge section for fallback.

**Structural variants** (3 types):
- **Numeric keys** (most common): frame keys are `"0"`, `"1"`, `"2"` → each is PartData
- **Z-name keys** (8 mounts): frame keys are z-names like `"tamingMobFront"`, `"tamingMobRear"` → each is PartData
- **partN keys** (1 mount: 01932249): frame keys are `"part0"`, `"part1"`, ... → each contains sub-frame numbers (`"0"`~`"12"`) with PartData per sub-frame

Part detection: try numeric keys first, then z-name keys (`tamingMob*`, `saddle*`, `backTamingMob*`, `backMobEquip*`), then `part*` keys.

Multi-layer mounts have multiple parts per frame:
```json
// 01902001 → stand1 → frame 0 (two layers, same navel)
{
  "0": { "z": "tamingMobFront", "map": { "navel": { "x": 3, "y": -53 } }, ... },
  "1": { "z": "tamingMobMid",   "map": { "navel": { "x": 3, "y": -53 } }, ... },
  "delay": 180
}
```

Parts may have **different** `map.navel` coordinates. Some mounts (e.g., 01902001) share the same navel across parts; others (e.g., 01902002) have distinct navel per part.

## Multi-Part Alignment (Socket Merge)

The engine aligns all parts via shared `map.navel` socket, not by assuming identical coordinates. Each part starts at position `{-origin.x, -origin.y}`, then parts are shifted so their navels coincide:

```
// Reference part (part 0) establishes navel world position
navelWorld = part0.map.navel   // (relative to part0 origin at 0,0)

// Each subsequent part is shifted to align its navel with navelWorld
for each partN (N > 0):
    partN.shift = part0.map.navel - partN.map.navel
    partN.worldPos = {-partN.origin.x + partN.shift.x, -partN.origin.y + partN.shift.y}
```

**Navel fallback**: Part 0 may lack `map.navel` (6 mounts). Use the first part that HAS a navel as reference. If no part has navel (1 mount: 01932290), fall back to `{x:0, y:0}`.

The character attaches to the shared `navelWorld` position regardless of which part provided it.

## Saddle Mounts (vslot: Sd)

9 mounts are **saddle** type — they overlay on an existing base mount instead of being standalone. Identified by `info.vslot = "Sd"` and top-level keys being numeric mount IDs (without zero-pad).

```json
// Character/TamingMob/01912000.json — saddle mount
{
  "1902000": {           // base mount ref (no zero-pad)
    "stand1": {
      "0": {
        "0": { "z": "saddleFront", "map": { "navel": { "x": 3, "y": -51 } }, ... },
        "1": { "z": "saddleRear",  "map": { "navel": { "x": 3, "y": -51 } }, ... }
      }
    }
  },
  "1902001": { ... },    // another base mount ref
  "info": { "vslot": "Sd", ... }
}
```

**Rendering**: Saddle parts use `saddleFront` (IN FRONT, zmap 3) and `saddleRear` (BEHIND, zmap 121). They are merged with the base mount's parts — the saddle's navel aligns with the base mount's navel via the same socket merge algorithm.

**Detection**: If top-level keys (excluding `info`) are all numeric, it is a saddle mount.

## Animation States

| State | Description |
|-------|-------------|
| `stand1` | Primary idle (6 frames typical, 180ms). 549 mounts. |
| `sit` | Seated idle. **351 mounts** (0198xxxx series) have sit as their only action. |
| `stand2` | Secondary idle |
| `walk1` | Walking |
| `walk2` | Alt walking |
| `fly` | Flying |
| `jump` | Jumping. 502 mounts have 1 frame (hold), 47 have multi-frame (2–17 frames, sequential loop). |
| `ladder` | Climbing ladder |
| `rope` | Hanging on rope |
| `prone` | Lying down |
| `tired` | Exhaustion/fatigue |

## Character Action While Riding

When mounted, the character switches to the **`sit`** action (not stand1). Body, head, and hair all have a `sit` action with different socket positions than standing:

```
// body sit vs stand1 comparison
sit:    body.map.navel = {x:-2, y:-17}, origin = {x:19, y:28}
stand1: body.map.navel = {x:-8, y:-21}, origin = {x:16, y:31}
```

The `sit` navel offset is higher (y:-17 vs y:-21), positioning the character correctly on the mount.

**Action conversion rule**:
- stand1, stand2, walk1, walk2, prone → character uses **`sit`**
- ladder, rope, fly, jump, tired → character uses **the same action as the mount** (not sit)

## Character Attachment

The character attaches to the mount's **shared navel position** (after multi-part alignment), using the **sit action** socket values:

```
// After aligning all mount parts, navelWorld = part0.map.navel
charBodyOrigin = navelWorld - charBody.sit.map.navel

// When flipped (facing right):
charBodyOrigin.x = -(navelWorld.x - charBody.sit.map.navel.x)
charBodyOrigin.y = navelWorld.y - charBody.sit.map.navel.y
```
Where `charBody.sit.map.navel` comes from `body.sit["0"].body.map.navel`.

Then build the rest of the character normally (head via neck, face/hair via brow), also using their `sit` action frames.

## Z-Order (Two-Canvas System)

When rendering mount with character (or pet, etc.), **`zmap.json` key order is the authoritative source** for all z-ordering. Parse `zmap.json` at runtime — never hardcode z-order values.

**Rule**: Look up each part's z-name in `zmap.json`. If it appears above `characterStart` → **OverCharacter** (in front). If it appears below `characterEnd` → **UnderCharacter** (behind). Higher in `zmap.json` = closer to the viewer.

Mount parts use these z-names: `tamingMobFront`, `tamingMobMid`, `tamingMobRear`, `saddleFront`, `saddleRear`, `backMobEquipFront`, `backTamingMobFront`, `backSaddle`, `backTamingMobMid`.

**z-names not in `zmap.json`** — fallback rules:
- `tamingMobBack` → treat as same z-order as `tamingMobRear` (UnderCharacter)
- `tamingMob`, `backTamingMobRear`, `backTamingMobBack`, `character` → treat as furthest back (behind all other mount parts)

Numeric z-values (0, 1, 2, 3) appear before `characterStart` in zmap order, so treat as OverCharacter.

**Rendering order**: UnderCharacter (behind) → Character parts → OverCharacter (front).

**Z-value distribution** (across 900 mounts): tamingMobRear 35%, tamingMobFront 33%, tamingMobMid 12%, saddleRear 8%, saddleFront 6%.

## Flip Rule

All mount sprites face **left by default**. When facing right, flip the entire rendered result (whole-canvas mirror), not individual sprites. All position calculations use non-flipped coordinates; the flip is applied as a final transform wrapping all draws.

For the mount navel used in character attachment: `flippedNavel.x = -navel.x` (negate X only).

## Quick Reference

```
// Render character on mount
mountJson = loadJSON(`Character/TamingMob/${tamingMobID}.json`)
// Action fallback: stand1 → sit → fly → walk1 → stand2
// (351 mounts in 0198xxxx series have only 'sit')
action = mountJson.stand1 || mountJson.sit || mountJson.fly || mountJson.walk1 || mountJson.stand2
frame = action["0"]
// Part keys: numeric ("0","1"), z-name ("tamingMobFront"), or partN ("part0")
parts = getPartKeys(frame)
delay = frame.delay || 180

// Align multi-part mounts via navel socket merge
refNavel = parts[0].map.navel
for each partN:
    shift = { refNavel.x - partN.map.navel.x, refNavel.y - partN.map.navel.y }
    partN.worldPos = { -partN.origin.x + shift.x, -partN.origin.y + shift.y }

// Character uses 'sit' action while riding
charFrame = bodyJson.sit["0"]

// Split mount parts into two canvases by z-name
behindParts = parts where z ∈ {tamingMobRear, saddleRear, back*}              // behind character
frontParts  = parts where z ∈ {tamingMobFront, tamingMobMid, saddleFront}     // in front

// Render order: behindParts → character (sit) → frontParts
// Attach character body to mount via navel socket (using sit body navel)
navelWorld = refNavel  // shared navel position after alignment
charBodyOrigin = { navelWorld.x - charBody.sit.map.navel.x,
                   navelWorld.y - charBody.sit.map.navel.y }

// Flip (facing right): mirror entire canvas, all coordinates stay non-flipped
// Game uses whole-canvas flip (translate + scale -1), not per-sprite calculation
```
