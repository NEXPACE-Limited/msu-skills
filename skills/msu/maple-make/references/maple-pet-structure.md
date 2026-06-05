---
name: maple-pet-structure
description: |
  Pet file structure, animation states, frame fields (origin, lt/rb, delay, z, zigzag),
  interaction system (food, interact, slang), and info metadata.
  Use when rendering pets or implementing pet interaction logic.
---

# Pet Structure

## File Path

`Item/Pet/{petID}.json` (7-digit ID, e.g. `5000000.json`)

474 pet files in data. No link system — each pet file is self-contained.

## Name & Dialogue

- Name: `String/Pet.json` -> key `"{petID}"` -> `{ "name": "Brown Kitty", "desc": "..." }`
- Dialogue: `String/PetDialog.json` -> key `"{petID}"`

## Top-Level Keys

| Key | Type | Description |
|-----|------|-------------|
| `{stateName}` | object | Animation state (stand0, move, jump, etc.) |
| `info` | object | Pet metadata (see Info Fields) |
| `food` | object | Feeding reactions by closeness tier |
| `interact` | object | Command interactions with success/fail |
| `slang` | object | Idle monologue triggers |

## Animation States

### Core States (all 474 pets)

| State | Description | Typical frames |
|-------|-------------|---------------|
| stand0 | Primary idle | 3–6 |
| stand1 | Secondary idle (e.g. tail wag) | 4–9 |
| move | Walking | 3–4 |
| jump | Jumping (hold frame) | 1 |
| fly | Flying | 1–2 |
| hang | Hanging from rope/ladder | 1 |
| hungry | Hungry expression | 3–4 |

### Common Emotion States (400+ pets)

| State | Pets | Description |
|-------|------|-------------|
| rest0 | 454 | Resting |
| chat | 451 | Chatting |
| eat | 448 | Eating |
| cry | 446 | Crying |
| angry | 442 | Angry |
| dung | 438 | Defecating |
| love | 430 | Love expression |
| sleep | 429 | Sleeping |
| sit | 365 | Sitting |
| roll | 206 | Rolling |
| what | 171 | Confused |
| no | 154 | Refusing |

115 unique state names exist across all pets. States beyond the core 7 vary per pet — enumerate keys at runtime.

### TransformAction

Some pets (e.g. Demon Lux 5001000) have a `TransformAction` key containing a full alternate state set (stand0, move, jump, fly, hang, etc.). This represents the pet's transformed appearance. Each sub-state has the same frame structure as top-level states.

## Frame Structure

```json
{
  "_path": "Item/Pet/5000000/stand0/0.png",
  "origin": { "x": 19, "y": 39 },
  "lt": { "x": -19, "y": -39 },
  "rb": { "x": 19, "y": 0 },
  "delay": 1200
}
```

`z` field is optional (absent on ~6300 frames, present on ~37200 frames).

| Field | Description |
|-------|-------------|
| `_path` | PNG path relative to data/ root |
| `origin` | Anchor point (from image top-left). y = ground contact point |
| `lt` | Bounding box left-top (relative to origin, negative = left/up) |
| `rb` | Bounding box right-bottom (relative to origin, positive = right, y=0 = origin height) |
| `delay` | Frame duration in ms. **Default 180ms** when absent |
| `z` | (optional) Rendering depth. Numeric (not string like Character). 0 = default (36645/37215 frames). z=2 used in ~568 frames |

### Single-Frame States

States like `jump` and `hang` have 1 frame with no `delay` field. Hold the frame for the duration of the state (controlled by game logic, not animation timing).

## Zigzag (Palindrome Playback)

Per-state flag, not per-pet. Check `{state}.zigzag` field:

- `zigzag: 1` on a state -> play frames as palindrome: 0, 1, 2, 1, 0, 1, 2, ...
  (first and last frames are not duplicated at the turn)
- Only 6 states across all pets use zigzag (4x rest0, 2x cry)
- `manifest/pets.json` has a pet-level `zigzag: true` flag that indicates "this pet has at least one zigzag state" — it is an index hint, not a rendering directive

## Flip Rule

Same as Mob/Character: sprites face **left by default**. Flip horizontally when facing right. When flipped: `anchorX = width - origin.x`.

## Info Fields

| Field | Count | Description |
|-------|-------|-------------|
| `cash` | 474 | Cash item flag (always 1) |
| `hungry` | 474 | Hunger rate tier |
| `icon` | 474 | Inventory icon (has _path, origin) |
| `iconD` | 474 | Disabled icon |
| `iconRaw` | 474 | Raw icon |
| `iconRawD` | 474 | Raw disabled icon |
| `life` | 474 | Life duration (0 = permanent) |
| `chatBalloon` | 455 | Chat balloon style |
| `nameTag` | 455 | Name tag style |
| `multiPet` | 469 | Multi-pet summon allowed |
| `noHungry` | 472 | Disable hunger |
| `msnGrade` | 472 | Mission grade |
| `nomiraclepet` | 472 | Miracle pet exclusion flag |

## Interaction System

### food — Feeding Reactions

Indexed by closeness tier (`l0`–`l1` range):

```
food["0"] = { l0: 1, l1: 9, success: { "0": { act: "rest0", "0": "f1_s" } }, fail: { "0": { act: "cry", "0": "f1_f" } } }
```

- `l0`/`l1`: closeness range for this tier
- `success`/`fail`: reaction variants. Each has `act` (animation state to play) and numbered dialogue keys (reference PetDialog.json)

### interact — Command Interactions

```
interact["0"] = { command: "c1", l0: 1, l1: 9, prob: 30, inc: 1,
                  success: { "0": { act: "rest0", "0": "c1_s1", "1": "c1_s2" } },
                  fail: { "0": { act: "stand1", "0": "c1_f1", "1": "c1_f2" } } }
```

- `command`: command ID (c1–c28)
- `prob`: success probability (%)
- `inc`: closeness increment on success
- `l0`/`l1`: closeness range
- `success`/`fail`: same structure as food

### slang — Idle Monologue

```
slang["0"] = { act: "rest0", l0: 1, l1: 9, "0": "s1" }
```

- `act`: animation state to play
- `l0`/`l1`: closeness range
- Numbered keys: dialogue references
