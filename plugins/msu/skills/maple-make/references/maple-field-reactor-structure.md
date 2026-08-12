---
name: maple-field-reactor-structure
description: Reactor file structure, state machine, event transitions, hit animations, and z-order rules. Load when implementing reactor rendering, placement, or interaction.
---

# Reactor File Structure

## File Path

```
Reactor/{7-digit-zero-pad}.json
```

Example: `Reactor/0100014.json` (Treasure Chest), `Reactor/0200000.json` (Silver Vein)

## Link Field

Reactors may use `info.link` to share animations with another reactor (same pattern as Mob/NPC).

- 117 out of 780 reactors use links
- `link` value: 7-digit zero-padded string
- Linked reactor has only `info` (no state keys) → load `Reactor/{link}.json` for animations

## Top-Level Structure

```json
{
  "info": { "viewName": "Treasure Chest", "level": 1, "resetTime": 5, ... },
  "action": "gather0",
  "0": { /* state 0 */ },
  "1": { /* state 1 */ },
  ...
}
```

- Numbered keys (`"0"`, `"1"`, ...) = states in the state machine
- `info` = metadata
- `action` = server-side action handler reference (rendering-irrelevant)

## State Structure

Each state contains animation frames, event transitions, and an optional hit animation:

```json
// State "0" of Treasure Chest (100014)
{
  "0": { "_path": "Reactor/0100014/0/0.png", "origin": {"x":50,"y":169}, "delay": 150, "z": 0 },
  "1": { "_path": "...", "origin": {...}, "delay": 150, "z": 0 },
  // ... more frames
  "event": {
    "0": { "state": 1, "type": 8 },
    "1": { "state": 5, "type": 101 },
    "timeout": 1800
  },
  "hit": {
    "0": { "_path": "...", "origin": {...}, "delay": 120, "z": 0 },
    // ... hit animation frames (may use _inlink to regular frame PNGs)
  },
  "repeat": 1
}
```

### Frame Fields

| Field | Meaning |
|-------|---------|
| `_path` | PNG file path (relative to `data/`) |
| `origin` | Sprite anchor point |
| `delay` | Frame duration in ms. **Default 120ms** when absent. |
| `z` | Render layer — always `0` for reactors |
| `lt` / `rb` | Bounding box (rare — 26 out of 780 reactors). Same semantics as Mob lt/rb. |
| `a0` / `a1` | Alpha fade (0–255). Found in 69 frames, typically on the last state. Example: `a0: 255, a1: 0` → fade out during frame delay. |
| `_inlink` | Cross-frame alias — **ignore**, `_path` is already resolved |

### repeat Field

- `repeat: 1` = loop the state animation continuously
- Absent = play once and stop
- Only value `1` is used (596 states across all reactors)

## Event System (State Transitions)

Events define how the reactor transitions between states:

```json
"event": {
  "0": { "state": 1, "type": 8 },       // event 0: on GATHER → go to state 1
  "1": { "state": 5, "type": 101 },      // event 1: on TIMEOUT → go to state 5
  "timeout": 1800                         // timeout duration in ms
}
```

### Event Type Codes (measured values)

| Type | Name | Description |
|------|------|-------------|
| 0 | HIT | General hit by player attack |
| 1 | HIT_LEFT | Hit from left direction |
| 2 | HIT_RIGHT | Hit from right direction |
| 5 | HIT_SKILL_CHECK | Skill-based hit |
| 8 | GATHER | Gathering interaction |
| 9 | CLICK_CHECK | Mouse click detection |
| 10 | MOB_CHECK | Mob proximity check |
| 11 | CHARACTER_ACT | Character action trigger |
| 100 | FINDITEM_UPDATE | Find item event |
| 101 | TIMEOUT_RESET | Auto-reset after timeout (no player interaction) |
| 200–201 | KEY_CHECK | Key press events |
| 300–302 | NPC_TALK / GATHER variants | NPC interaction variants |

State transitions are **server-controlled**. The client plays animations based on server state change packets.

### timeout Field

- Duration in milliseconds
- If no player interaction occurs within this period, the type 101 event triggers
- Typically resets the reactor back to state 0

### Terminal States

States without an `event` object are terminal — the reactor stays in that state until server resets it.

## Hit Animation

The `hit` sub-object contains animation frames played as visual feedback when the player interacts with the reactor.

- Structure: numbered frame keys with `_path`, `origin`, `delay`, `z` (same as regular frames)
- Played on successful interaction (hit, gather, click)
- Hit animation plays, then the event triggers state transition
- Per-event hit overrides (`event/N/hit`) take priority over state-level hit

### Hit Area (Interaction Detection)

Reactor interaction area is determined by:
1. **`info.lt` / `info.rb`** — if present in info, defines the common hit rect
2. **Hit animation frames** — union of all canvas dimensions in the hit animation
3. **`event/clickArea/lt,rb`** — per-event click area (for type 9 CLICK_CHECK)

Most reactors rely on method 2 (hit animation dimensions).

## Info Fields

| Field | Count | Meaning |
|-------|-------|---------|
| `viewName` | common | Display name |
| `level` | common | Required gathering level |
| `resetTime` | common | Reset delay in seconds |
| `frontTile` | common | See Z-Order below |
| `notFatigue` | some | Gathering fatigue exemption (gameplay) |
| `link` | 117 | Animation source reactor ID |
| `name` | some | Internal name |
| `dcMark` | some | Display mark/icon type |
| `removeInFieldSet` | rare | Auto-remove flag |
| `lt` / `rb` | rare | Common hit rect at info level |

## Z-Order on Map

| frontTile | backTile | Rendering Layer |
|-----------|----------|----------------|
| 0 (or absent) | 0 (or absent) | Normal — same layer as characters |
| 1 | — | Front — **above characters** (+5 z-offset) |
| — | 1 | Back — **behind ground tiles** |

## PNG Path Rule

```
Reactor/{reactorID}/{state}/{frame}.png
Reactor/{reactorID}/{state}/hit/{frame}.png   (hit animation)
```

## Frame Iteration

Non-numeric keys (`event`, `hit`, `repeat`) are **not frames**. Filter with `!isNaN(Number(key))`.

## Quick Reference

```
// Render a reactor
const data = loadJSON(`Reactor/${reactorId.toString().padStart(7,'0')}.json`);
const animId = data.info?.link ?? reactorId.toString().padStart(7,'0');
const animData = data.info?.link ? loadJSON(`Reactor/${animId}.json`) : data;
const state = animData["0"];
const frame = state["0"];
renderSprite(frame._path, frame.origin);
```

## Manifest

For reactor discovery use `data/manifest/reactors.json` (26 curated reactors).

Fields: `id`, `name`, `action`, `states` (state count), `level`
