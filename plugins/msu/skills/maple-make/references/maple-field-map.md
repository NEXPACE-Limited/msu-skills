---
name: maple-field-map
description: |
  Map JSON structure: file path rules, info fields, mob/NPC spawns (life), portals, footholds, and ladders.
  Use when placing mobs, designing level layout, reading spawn positions, or connecting maps via portals.
---

# Map System

## File Path Rules

```
Map ID: 9-digit (e.g. 100000000)
Region: first digit → Map0(0xx), Map1(1xx), Map2(2xx), Map3(3xx), Map4(4xx), Map5(5xx), Map6(6xx), Map7(7xx), Map9(9xx)
File:   Map/Map/Map{first digit}/{mapID}.json

Examples:
  100000000 → Map/Map/Map1/100000000.json   (Henesys)
  000010000 → Map/Map/Map0/000010000.json   (Maple Island)
```

Name lookup: `String/Map.json` → key = mapID as string (no zero-pad)

## Top-Level Keys

| Key | Description |
|-----|-------------|
| `info` | Map metadata (bounds, BGM, flags) |
| `life` | Mob and NPC spawn entries |
| `portal` | Portal definitions (spawn, warp, script) |
| `foothold` | Platform/ground collision segments |
| `ladderRope` | Ladder and rope definitions |
| `back` | Background layer data |
| `0`–`7` | Visual tile/object layers (see Tile & Object Layers section) |
| `miniMap` | Minimap dimensions |
| `reactor` | Interactive objects (separate from `life`) |
| `seat` | Sit positions |

## info Fields

### Boundary (Camera & Player Clamp)

| Field | Description |
|-------|-------------|
| `VRLeft` / `VRRight` | Horizontal map boundary (pixels) |
| `VRTop` / `VRBottom` | Vertical map boundary (pixels) |

### Navigation

| Field | Description |
|-------|-------------|
| `returnMap` | Map ID to return to on death (999999999 = stay) |
| `forcedReturn` | Forced warp map ID |
| `town` | 1 = town map (safe zone) |
| `fieldType` | (optional) 0 = normal. Absent on many maps. |

### Gameplay Flags

| Field | Values | Description |
|-------|--------|-------------|
| `swim` | 0/1 | Underwater map |
| `fly` | 0/1 | Flying map |
| `fieldLimit` | bitmask | Movement restrictions (e.g. 134217728 = no teleport) |
| `mobRate` | string | Mob spawn rate multiplier ("1" = normal) |
| `noMapCmd` | 0/1 | Disable /map command |

### Atmosphere

| Field | Description |
|-------|-------------|
| `bgm` | Background music path (e.g. `"Bgm01/AncientMove"`) |
| `mapMark` | Map icon name for minimap |
| `mapDesc` | Map description text |
| `streetName` | Region/street name |
| `mapName` | Map display name |

## Coordinate System

- **X axis**: negative = left, positive = right
- **Y axis**: negative = up, positive = down (matches screen coordinates)
- `VRTop` is a large negative number (e.g. -1140), `VRBottom` is positive (e.g. 384)
- Mob spawn Y=-280 is above the ground; NPC at Y=150 is near the bottom

## back — Background Layers

Background images rendered behind terrain. Supports parallax scrolling, tiling, and animation.

```json
"back": {
  "0": {
    "bS":   "grassySoil_new",  // background set name
    "no":   0,                  // image index within the set
    "ani":  0,                  // 0=static, 1=animated
    "x":    -48,                // world X anchor
    "y":    -109,               // world Y anchor
    "rx":   0,                  // horizontal parallax factor
    "ry":   0,                  // vertical parallax factor
    "cx":   0,                  // horizontal tile interval (0 = image pixel width)
    "cy":   0,                  // vertical tile interval (0 = image pixel height)
    "type": 1,                  // tiling/scroll mode (see table)
    "front":0,                  // 0=background, 1=foreground (drawn in front of tiles)
    "a":    255,                // alpha 0–255
    "f":    0                   // horizontal flip (1=flip)
  }
}
```

### back.type Values

| type | Behavior |
|------|----------|
| 0 | Single placement, no tiling |
| 1 | Tile horizontally (repeat X using `cx` interval) |
| 2 | Tile vertically (repeat Y using `cy` interval) |
| 3 | Tile both H and V |
| 4 | Scroll horizontally + tile. Continuous X-axis flow using `rx` as speed factor. Internally converts to type 1 grid after applying scroll offset. |
| 5 | Scroll vertically + tile. Continuous Y-axis flow using `ry`. Internally converts to type 2 grid. |
| 6 | Scroll horizontally + tile (variant of type 4). |
| 7 | Scroll both H and V + tile. Diagonal flow using both `rx` and `ry`. Internally converts to type 3 grid. |

### Image Lookup

```
ani=0 (static):   Map/Back/{bS}.json → ["back"][no]  → { _path, origin }
ani=1 (animated): Map/Back/{bS}.json → ["ani"][no]   → { "0": {_path, origin, delay?}, "1": ... }
```

Animated frames may have a `delay` field (ms). Frames without `delay` use the default 60 ms.
Animated frames may also have `a0`/`a1` alpha fields (0–255): linearly interpolate alpha from `a0` to `a1` over the frame's delay duration. Value `-1` = no alpha animation.

### Parallax Formula (rx / ry)

`rx`/`ry` control how far the background moves relative to camera:

| rx value | Effect |
|----------|--------|
| `0` | World-fixed — moves 100% with camera (e.g. ground tiles) |
| `-15` | Moves 85% of camera speed — distant parallax (sky, trees) |
| `-100` | Screen-fixed — never moves |

```
screenX = entry.x - cameraX * (100 + rx) / 100
screenY = entry.y - cameraY * (100 + ry) / 100
```

This is the screen-space formula. When using a rendering engine that applies its own camera transform (world → screen), adapt accordingly to avoid double-applying the camera offset.

### Tiling (cx / cy)

For `type=1`, the image repeats horizontally:
- `cx=0` → repeat interval = image pixel width
- `cx=2000` → repeat every 2000 pixels

Tiling anchor is the world position `(x, y)` — the pattern starts at `x` and repeats in both directions.

### Rendering Order

1. Render `front=0` entries first (background), in index order (0, 1, 2, …)
2. Render terrain tiles and objects (layers 0–7)
3. Render `front=1` entries last (foreground backgrounds, drawn in front of terrain)

The `a` field (0–255) controls alpha transparency.

## life — Mob & NPC Spawns

```json
"life": {
  "0": {
    "type":    "m",          // "m"=mob, "n"=NPC
    "id":      "0100000",    // 7-digit zero-padded string (e.g. "0100004" for Orange Mushroom)
    "x":       250,          // spawn X position
    "y":       300,          // spawn Y (may differ slightly from foothold Y)
    "cy":      300,          // foothold-adjusted ground Y (use this for actual ground contact)
    "fh":      42,           // foothold ID this mob stands on
    "f":       0,         // facing: 0=right, 1=left
    "rx0":     100,       // patrol range left X
    "rx1":     400,       // patrol range right X
    "mobTime": 0,         // respawn delay (ms), 0 = instant
    "hide":    0          // 1 = hidden until triggered
  }
}
```

### Key Fields

| Field | Description |
|-------|-------------|
| `type` | `"m"` = mob, `"n"` = NPC |
| `id` | 7-digit zero-padded string (e.g. `"0100004"`). To match manifest IDs (integers), prepend zeros to 7 digits |
| `x` / `y` | Spawn world position (`y` may differ slightly from ground) |
| `cy` | Foothold-adjusted ground Y — use this as the standing Y for grounded entities. For flying mobs (MOVEABILITY_FLY), use `y` instead. |
| `fh` | Foothold ID the entity stands on |
| `rx0` / `rx1` | Horizontal patrol boundary |
| `mobTime` | 0 = respawn instantly, >0 = respawn after N ms |
| `f` | Initial facing: 0=right, 1=left |

## reactor — Map Reactor Spawns

Reactor entries are stored under the `reactor` key, **not** inside `life`.

```json
"reactor": {
  "0": {
    "id":          "1002008",    // reactor ID string
    "name":        "",           // reactor name (often empty)
    "x":           500,          // world X
    "y":           -100,         // world Y (no cy — use y directly)
    "f":           0,            // facing: 0=right, 1=left
    "reactorTime": 30            // respawn interval in seconds (0 = no respawn)
  }
}
```

### Entity Z-Order on Map

All entities on the same foothold page share a unified z-order (from back to front):

| Offset | Entity |
|--------|--------|
| +0 | Reactor |
| +1 | Mob |
| +5 | NPC |

## portal — Map Connections

```json
"portal": {
  "0": {
    "pn": "sp",          // portal name (this side)
    "pt": 0,             // portal type (see table)
    "tm": 999999999,     // target map ID
    "tn": "",            // target portal name
    "x":  250,
    "y":  300,
    "script": ""         // script to run on enter (pt=7 only)
  }
}
```

### Portal Types (pt)

| pt | Type | Description |
|----|------|-------------|
| 0 | Spawn point | Player spawn, not interactive (`pn="sp"`) |
| 1 | Hidden/disabled | Blocked portal |
| 2 | Connected | Standard warp → `tm`=target map, `tn`=target portal |
| 6 | Teleport | In-map teleport |
| 7 | Script | Triggers script on enter |
| 8 | Collision | Activated by walking into |
| 10 | Hidden portal | Invisible warp |

### Portal Connection Pattern

```
Map A portal: { pn:"east00", pt:2, tm:100000001, tn:"west00", x:..., y:... }
Map B portal: { pn:"west00", pt:2, tm:100000000, tn:"east00", x:..., y:... }

pn = portal name on this map (source)
tn = portal name on target map (must match target map's pn)
tm = target map ID
```

## foothold — Platform Collision

```json
"foothold": {
  "0": {          // layer group
    "0": {        // sub-group
      "1": {
        "x1": -500, "y1": 300,   // segment start (x1 < x2 in all observed data)
        "x2":  200, "y2": 300,   // segment end
        "next": 2,               // next foothold ID in chain
        "prev": 0,               // previous foothold ID (0 = none)
        "piece": 12,             // terrain group ID (positive = grouped; -1 = ungrouped/standalone)
        "forbidFallDown": 1      // (optional) 1 = cannot fall through with down+jump (solid floor)
      }
    }
  }
}
```

- Horizontal segment (`y1 == y2`) = flat platform
- Diagonal (`y1 != y2`) = slope; x1 is always the left endpoint (x1 < x2 in observed data — normalize if needed)
- `next` / `prev` chain footholds into continuous platforms
- `piece` = positive integer → all segments with the same piece value form one continuous terrain piece
- `piece = -1` → ungrouped / standalone segment (not part of any terrain piece)
- `forbidFallDown: 1` → solid platform; player cannot fall through with down+jump. Absent = default (can fall through)
- `life` entries reference their foothold via `fh` ID

**Foothold ID lookup:** The innermost key of the three-level nesting IS the foothold ID.
To find `fh=78`, iterate all groups and sub-groups and find the entry whose key equals `"78"`.

```js
// pseudo-code
function findFoothold(footholdData, id) {
  for (group of Object.values(footholdData))
    for (sub of Object.values(group))
      if (sub[id]) return sub[id]
}
```

## ladderRope — Climbable Surfaces

```json
"ladderRope": {
  "0": {
    "l":    1,    // 1=ladder, 0=rope
    "x":    250,  // horizontal position
    "y1":   100,  // top Y
    "y2":   400,  // bottom Y
    "uf":   1     // 1=can grab from below
  }
}
```

## Tile & Object Layers (`"0"`–`"7"`)

Each numbered layer contains the visual sprites that make up the map's terrain and decorations.

### Layer Structure

```json
"3": {
  "info": { "tS": "ancientForest" },   // tileset name for this layer
  "tile": {
    "0": { "u": "bsc", "no": 1, "x": 0, "y": 120, "zM": 0 }
  },
  "obj": {
    "0": { "oS": "acc10", "l0": "altairCamp", "l1": "plant", "l2": "1",
           "x": -428, "y": -238, "z": 9, "zM": 12, "f": 0 }
  }
}
```

### Tile Entry Fields

| Field | Description |
|-------|-------------|
| `u` | Unit type — sub-key in the tileset JSON (e.g. `"bsc"`, `"enH0"`, `"enV0"`) |
| `no` | Frame index — sub-key under the unit type |
| `x`, `y` | Map coordinates of the tile anchor |
| `zM` | Z modifier (added to the tileset entry's `z` for depth sorting) |

**Tileset lookup:** `Map/Tile/{tS}.json` → `[u][no]` → `{ _path, origin, z }`

```
tile entry: u="bsc", no=1
→ Map/Tile/ancientForest.json → ["bsc"]["1"]
→ { "_path": "Map/Tile/ancientForest/bsc/1.png", "origin": {x,y}, "z": 0 }
```

### Object Entry Fields

| Field | Description |
|-------|-------------|
| `oS` | Object set name — filename under `Map/Obj/` |
| `l0`, `l1`, `l2` | Three-level path key into the object set JSON |
| `x`, `y` | Map coordinates |
| `z`, `zM` | Depth values |
| `f` | Flip horizontally (1 = flip) |

**Object lookup:** `Map/Obj/{oS}.json` → `[l0][l1][l2]` → animated frames `{ "0": { _path, origin, z }, ... }`

```
obj entry: oS="acc10", l0="altairCamp", l1="plant", l2="1"
→ Map/Obj/acc10.json → ["altairCamp"]["plant"]["1"]
→ { "0": { "_path": "Map/Obj/acc10/altairCamp/plant/1/0.png", "origin": {x,y}, "z": 0 }, ... }
```

Objects can be animated (multiple numbered frames). Use frame `"0"` for static display. Object frames use default **120ms** delay when no `delay` field is present.

### Depth & Rendering Notes

- Each layer (`"0"`–`"7"`) has its own `tS`. Layers without `tS` in their `info` have no tiles.
- **Tile `z`** comes from the tileset JSON (`Map/Tile/{tS}.json → [u][no].z`), NOT from the tile entry itself. The tile entry only has `zM`. Range: -4 to 0.
- **`zM`** is a per-tile depth modifier from 0 to ~20; objects with higher `zM` render in front of those with lower `zM`.
- **Cross-layer z-sort** uses a unified formula: `sortZ = pageIdx * 30000 + 20000 - 10 * (zM + 1) + tileZ`. Each page (layer 0–7) is separated by 30000 z-units, so all content on page 0 is behind page 1 regardless of zM. Objects within the same page use `pageIdx * 30000 + 2000 + z`, placing them behind tiles of the same page.
- Tile `origin` is a pixel offset from the image top-left (same convention as character PartData). A tile placed at map coords `(x, y)` should draw so that `origin` aligns with `(x, y)` — the tile body extends above/below that point.
- Tiles sit between backgrounds (furthest back) and foreground decorations (front). Characters render in front of terrain tiles.
- The `guide` obj set is an editor/debug overlay — safe to skip if PNG is absent.

## _path Field Location

Back/Tile/Object entries in the map JSON do **not** contain `_path` fields directly.
All `_path` fields live in the **set JSON files** referenced by the map:

```
back entries  → bS values  → Map/Back/{bS}.json  → ["back"][no]._path  (ani=0)
                                                  → ["ani"][no]["0"]._path  (ani=1)
tile layers   → tS values  → Map/Tile/{tS}.json  → [u][no]._path
obj entries   → oS values  → Map/Obj/{oS}.json   → [l0][l1][l2]["0"]._path
```

The set JSONs must be loaded first (after discovering their names from the map JSON),
before `_path` values can be collected to load PNG files.

**Known data gaps:**
- `Map/Obj/connect.json` (ladder/rope visual objects) exists, but `Map/Obj/connect/` PNG directory may be absent if the .img was not exported with PNG extraction.

## Map Lookup Workflow

```
Input: Map ID (e.g. 100000000)

1. Name:    String/Map.json → key "100000000"

2. File:    first digit = 1 → Map/Map/Map1/100000000.json

3. Bounds:  info.VRLeft / VRRight / VRTop / VRBottom

4. Spawns:  life[*] where type="m" → mob spawn positions + IDs
            life[*] where type="n" → NPC positions

5. Portals: portal[*] where pt=2  → warp to other maps
            portal[*] where pt=0  → player spawn points (pn="sp")

6. Ground:  foothold → platform segments for collision
```

## Common Design Patterns

```
Town map:       info.town=1, returnMap=self ID
Dungeon map:    info.town=0, returnMap=nearest town ID
Connected maps: portal pt=2 pairs with matching pn/tn names
Boss room:      life entries with boss mob IDs, mobTime=0
Safe zone:      no life entries with type="m"
```
