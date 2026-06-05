---
name: maple-character-install-structure
description: |
  Install item (chair/furniture) file structure, effect animation layers, bodyRelMove seat positioning,
  group chair multi-seat layout, TamingMob link, and rendering z-order.
  Use when rendering chairs or implementing chair-sitting logic.
---

# Install Item Structure

## File Path

`Item/Install/{prefix}.json` where prefix = first 4–6 digits of 8-digit zero-padded item ID.

Examples:
- 3010205 → `Item/Install/03010.json` → key `"03010205"`
- 3016200 → `Item/Install/03016.json` → key `"03016200"`

3679 items across 31 JSON files. No link system.

## Name Lookup

`String/Ins.json` → key `"{itemID}"` → `{ "name": "...", "desc": "..." }`

## Top-Level Keys

| Key | Always | Description |
|-----|--------|-------------|
| `effect` | yes | Main visual animation layer |
| `info` | yes | Metadata: bodyRelMove, group, icon, recovery |
| `effect2` | 331 items | Secondary effect layer (front layer) |

## Effect Layer

```json
"effect": {
  "0": { "_path": "...effect/0.png", "delay": 300, "origin": {"x":107,"y":108}, "z": 0 },
  "1": { "_path": "...effect/1.png", ... },
  "z": -1
}
```

| Field | Description |
|-------|-------------|
| `"0"`, `"1"`, ... | Animation frames (1–32 observed) |
| `z` | Layer-level z-order: negative = behind character, positive = in front |
| Frame `_path` | PNG path relative to data/ root |
| Frame `origin` | Anchor point (same convention as character/mob) |
| Frame `delay` | Frame duration in ms. Default 60ms when absent |
| Frame `z` | Per-frame z within the layer (usually 0) |

### Effect2 Layer

Same frame structure as `effect`. Typically `effect2.z` is positive (e.g. 3), placing it in front of the character.

Rendering order: `effect` (z=-1, behind) → character → `effect2` (z=3, in front).

## Seat Positioning — bodyRelMove

`info.bodyRelMove` = offset from the effect origin to the character's **navel** position.

```json
"bodyRelMove": { "x": 0, "y": -14 }
```

- y is typically negative (character sits above the effect origin)
- Offset is flipped when character faces right
- 474 items have this field

## Character Direction While Sitting

### Single-seat chairs

| Field | Value | Meaning |
|-------|-------|---------|
| `info.sitLeft` | 1 | Force character to face left |
| `info.sitRight` | 1 | Force character to face right |
| (neither) | - | Default direction |

### Group chairs (per-seat)

`info.group.sit.{N}.dir`:

| Value | Meaning |
|-------|---------|
| -1 (default) | Normal direction |
| 0 | Force face right |
| 1 | Force face left |

## Group Chair (Multi-Seat)

```json
"info": {
  "group": {
    "info": { "height": 400, "width": 265, "invite": 1, "randomSit": 1 },
    "sit": {
      "0": { "bodyRelMove": {"x":25,"y":-258}, "dir": 1, "tamingMobF": "01983279", "tamingMobM": "01983279" },
      "1": { "bodyRelMove": {"x":-125,"y":-110}, "dir": 1, ... },
      ...
    }
  }
}
```

| Field | Description |
|-------|-------------|
| `group.info.width/height` | Group interaction area (px) |
| `group.info.invite` | Allow inviting others to sit |
| `group.info.randomSit` | Random seat assignment |
| `group.sit.{N}.bodyRelMove` | Per-seat navel offset |
| `group.sit.{N}.dir` | Per-seat forced direction (-1/0/1) |
| `group.sit.{N}.tamingMobF` | TamingMob ID for female character |
| `group.sit.{N}.tamingMobM` | TamingMob ID for male character |

When `group` exists, use `group.sit.{N}.bodyRelMove` instead of `info.bodyRelMove`.

## TamingMob Link

Some chairs use TamingMob sprites for the character's sitting animation body:

- Single seat: `info.tamingMob` = TamingMob ID
- Group seat: `group.sit.{N}.tamingMobF` / `tamingMobM` (gender-specific)

When `tamingMob` is present, load the TamingMob JSON for the character's riding/sitting body sprite. When absent, the character uses its default sit pose.

## Info Fields

| Field | Description |
|-------|-------------|
| `bodyRelMove` | Character navel offset (see above) |
| `sitLeft` / `sitRight` | Force sitting direction |
| `tamingMob` | TamingMob ID for riding sprite |
| `group` | Multi-seat layout |
| `icon` / `iconRaw` | Inventory icon sprites |
| `recoveryHP` / `recoveryMP` | HP/MP recovery while sitting |
| `price` | NPC sell price |
| `slotMax` | Max per inventory slot |
| `weapon` | Show weapon sprite while sitting |
