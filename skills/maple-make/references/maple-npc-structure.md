---
name: maple-npc-structure
description: NPC file structure, animation states, link references, click area, condition states, and dialogue keys. Load when implementing NPC rendering, placement, or interaction.
---

# NPC File Structure

## File Path

```
Npc/{7-digit-zero-pad}.json
```

Example: `Npc/1002100.json` (Jane), `Npc/0010200.json` (Athena Pierce)

## Link Field

NPCs may use `info.link` to share animations with another NPC.

```json
// Linked NPC — only has info, no animation states
{ "info": { "link": "0002003", "speak": { "0": "n0", "1": "n1" } } }

// Target NPC (0002003) — has animation states
{ "info": {...}, "stand": {...}, "wink": {...}, "heart": {...} }
```

- `link` value: 7-digit zero-padded string (same format as NPC file name)
- ~257 NPCs (out of 8,672) use links — mainly variant NPCs sharing a base NPC's sprites
- **To render:** if `info.link` exists → load `Npc/{link}.json` for animations

## Animation States

Top-level keys other than `info` are animation states. 8,672 NPCs surveyed:

| State | Count | Description |
|-------|-------|-------------|
| `stand` | 8,417 (97%) | Idle — nearly universal |
| `say` | 3,570 | Speaking expression |
| `eye` | 2,487 | Eye movement / blink variant |
| `move` | 1,365 | Walking animation |
| `hand` | 447 | Hand gesture |
| `special` | 230 | Special animation |
| `blink` | 156 | Eye blink |
| `smile` | 151 | Smile expression |
| `attack` | 148 | Attack animation (rare — some NPCs are combat-capable) |
| `die1` / `die` | 126 / 111 | Death animation (rare) |
| `stand2` | 109 | Alternate idle |
| `action` | 87 | Generic action |

937 unique state names exist in total. Always discover states at runtime:
```
states = Object.keys(npcData).filter(k => k !== 'info')
```

## Condition States

Some NPCs (e.g., Cygnus 1101000) have `condition1`~`conditionN` states instead of or in addition to regular states. These provide quest/level/job-dependent appearances.

```json
// Npc/1101000.json → condition1
{
  "20954": { "value": "rebirth" },  // quest 20954 must have record value "rebirth"
  "stand": {
    "0": { "_path": "Npc/1101000/condition1/stand/0.png", "origin": {...}, "z": 0 }
  }
}
```

Structure:
- **Numeric keys** (e.g. `"20954"`): quest condition — quest ID as key, `value`/`state` as requirement
- **`hide`**: if present, NPC is invisible when this condition is met
- **`stand`** (nested): the animation to play when this condition is active
- **Evaluation order**: conditions are checked in order (condition1, condition2, ...); first match wins
- **Condition types**: quest state, job, gender, level range, date range, day of week
- If no condition matches → use the default `stand` state

## Frame Structure

Each animation state contains numbered frames:

```json
// Npc/1002100.json → "blink" → "0"
{
  "_path": "Npc/1002100/blink/0.png",
  "origin": { "x": 38, "y": 74 },
  "delay": 150,
  "z": 0
}
```

| Field | Meaning |
|-------|---------|
| `_path` | PNG file path (relative to `data/`) |
| `origin` | Sprite anchor point (pixel coordinate within image) |
| `delay` | Frame duration in ms. May be string or number → `parseInt(delay, 10)`. **Default 180ms** when absent. |
| `z` | Render layer — typically `0` for NPCs. Rare exceptions exist (z=1 or z=-1 in ~0.1% of frames) |
| `_hash` | File checksum — ignore |
| `_inlink` | Cross-frame alias — **ignore**, `_path` is already resolved |
| `_filepath` | Export metadata — ignore |

### Differences from Mob frames

- **No `lt` / `rb`**: NPCs do not have per-frame bounding boxes
- **No `head`**: NPCs do not have head attachment points
- **Default delay**: 180ms (vs Mob 150ms)

## Click Area (dcRange)

NPC click/interaction area is defined in `info`, not in individual frames:

```json
// info fields
{ "dcLeft": -22, "dcTop": -65, "dcRight": 22, "dcBottom": 0 }
```

- World coordinates: `left = npcX + dcLeft`, `top = npcY + dcTop`, etc.
- **Defaults** when fields are absent: `dcLeft=-22, dcTop=-65, dcRight=22, dcBottom=0`
- These define the rectangle within which the player can click to interact with the NPC

## PNG Path Rule

```
Npc/{npcID}/{state}/{frame}.png
```

- Uses the **animation file ID** (after following link), same as Mob
- Example: linked NPC 0002004 → link 0002003 → PNGs at `Npc/0002003/stand/0.png`

## Info Fields

| Field | Meaning |
|-------|---------|
| `link` | 7-digit string pointing to animation source NPC |
| `script` | Server script entries with date ranges (rendering-irrelevant) |
| `speak` | Dialogue line references — numbered indices mapping to String/Npc.json keys |
| `dcLeft/dcTop/dcRight/dcBottom` | Click area rectangle offsets from NPC position |

## String Lookup (Dialogue)

```
String/Npc.json → key = npcID (no zero-pad) → { name, func, d0, d1, n0, n1, s0, ... }
```

### Dialogue Key Prefixes

| Prefix | NPCs using | Description |
|--------|-----------|-------------|
| `d` | 3,406 | Default/done dialogue lines |
| `n` | 2,707 | Normal informational lines |
| `s` | 258 | Ambient speech lines |
| `f` | 14 | Gameplay tips (tutorial NPCs) |
| `h` | 9 | Hello/greeting |
| `w` | 7 | Welcome lines |

Pattern: `{prefix}{index}` → e.g., `d0`, `d1`, `n0`, `n1`, `s0`

Special keys (not prefix-indexed):
- `dialogue`: object mapping quest/state IDs to strings (74 NPCs)
- `bubble`: nested speech bubble dialogue for quest cutscenes (37 NPCs)
- `exchange`: shop/exchange interaction lines (24 NPCs)

### info.speak → String cross-reference

`info.speak` maps numbered indices to String key names:
```json
// NPC file: info.speak
{ "0": "n0", "1": "n1", "2": "n2" }
// → look up "n0", "n1", "n2" in String/Npc.json[npcID]
```

## Flip Rule (Facing Direction)

- NPC sprites face **left by default** (same as Mob/Character)
- NPCs **do not** auto-face the player — direction is server-controlled
- When flipping: `anchorX = width - origin.x` (see rendering.md flip rules)

## Map Placement Z-Order

NPCs on the map use a z-offset of **+5** above the base character z-order layer. This places NPCs slightly in front of player characters by default.

## Frame Iteration

Non-numeric keys in animation states are **flags, not frames**. Filter with `!isNaN(Number(key))`.

Example: Kyrin's `say` state contains a `speak` key (non-numeric) — skip it.

## Quick Reference

```
// Render an NPC
const npcData = loadJSON(`Npc/${npcId.toString().padStart(7,'0')}.json`);
const animId = npcData.info.link ?? npcId.toString().padStart(7,'0');
const animData = npcData.info.link ? loadJSON(`Npc/${animId}.json`) : npcData;
const frame = animData.stand["0"];
renderSprite(frame._path, frame.origin);
```

## Manifest

For NPC discovery use `data/manifest/npcs.json` (25 curated NPCs) instead of scanning `String/Npc.json`.

Fields: `id`, `name`, `func`, `states` (animation state list)
