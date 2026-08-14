---
name: maple-core-folder-guide
description: data directory map, file naming conventions, JSON schema, data lookup workflows.
---

# Folder Guide & JSON Schema

## data Directory Map

```
data/
├── smap.json                 ← Sprite layer → VSlot mapping (CRITICAL)
├── zmap.json                 ← Z-order render sequence (CRITICAL)
│
├── String/                   ← Name/description tables (25 files)
│   ├── Skill.json            ← Skill names & descriptions
│   ├── Eqp.json              ← Equipment names (nested by category)
│   ├── Mob.json              ← Monster names (7565 entries)
│   ├── Consume.json          ← Consumable names
│   ├── Etc.json              ← Etc item names
│   ├── Npc.json              ← NPC names
│   ├── Pet.json              ← Pet names
│   └── Map.json              ← Map names
│
├── Skill/                    ← Skill definitions (280 files)
│   ├── 000.json              ← Beginner skills
│   ├── 100.json              ← Swordsman skills
│   ├── 434.json              ← Dual Blade skills
│   └── ...
│
├── Character/                ← Character sprites (276 files, with socket data)
│   ├── Accessory/            ← Accessories (01010000.json~)
│   ├── Cap/                  ← Hats (01000000.json~)
│   ├── Cape/                 ← Capes
│   ├── Coat/                 ← Tops (ID 104xxxx)
│   ├── Face/                 ← Faces
│   ├── Glove/                ← Gloves
│   ├── Hair/                 ← Hairstyles
│   ├── Longcoat/             ← Full-body coats (ID 105xxxx) — separate from Coat/
│   ├── Pants/                ← Bottoms
│   ├── Shield/               ← Shields
│   ├── Shoes/                ← Shoes
│   ├── Weapon/               ← Weapons
│   └── 00002000.json ...     ← Base body sprites
│
├── Item/                     ← Item definitions (~560 files)
│   ├── Consume/              ← Consumables (0200.json~)
│   ├── Etc/                  ← Etc items (0400.json~)
│   ├── Install/              ← Install items (03010.json~)
│   ├── Pet/                  ← Pets (5000000.json~)
│   └── Cash/                 ← Cash items (0501.json~)
│
├── Mob/                      ← Monsters (7362 files)
│   ├── 0100000.json          ← Snail (stats, link→0100100)
│   ├── 0100100.json          ← Snail (animations)
│   └── ...
│
├── Npc/                      ← NPCs (8672 files)
├── Effect/                   ← Skill/Item effects (79 files)
├── Map/                      ← Map data (~12,800 files)
│   ├── Back/                 ← Background images
│   ├── Map/                  ← Map definitions (core)
│   │   ├── Map0/             ← Region 0: Maple Island (87 files, 000xxxxxx)
│   │   ├── Map1/             ← Region 1: Victoria (724 files, 100xxxxxx)
│   │   ├── Map2/             ← Region 2: Ludibrium etc (1616 files, 200xxxxxx)
│   │   ├── Map3/             ← Region 3: Leafre etc (1739 files, 300xxxxxx)
│   │   ├── Map4/             ← Region 4 (1357 files, 400xxxxxx)
│   │   ├── Map9/             ← Region 9: Events/Special (7189 files, 900xxxxxx)
│   │   └── AreaCode.json, FieldGenerator.json, Graph.json
│   ├── Obj/                  ← Map objects
│   ├── Tile/                 ← Tilesets
│   └── WorldMap/             ← World map UI
├── Morph/                    ← Transformation data (179 files)
├── Reactor/                  ← Interactive objects (780 files)
└── TamingMob/                ← Mounts (23 files)
```

**Total**: ~25,000 JSON files, ~11,600 with canvas properties (socket/origin/map/z)

## File Name → Entity ID Conversion

| Data type | Filename | ID extraction | Example |
|-----------|----------|--------------|---------|
| Character | `01010000.json` | Full 8-digit = equip ID (with leading 0) | ID=01010000 |
| Mob | `0100000.json` | Full 7-digit = mob ID (with leading 0) | ID=0100000 |
| NPC | `0002000.json` | Full 7-digit = NPC ID | ID=0002000 |
| Morph | `0001.json` | Filename = morph ID (4-digit) | ID=0001 |
| Reactor | `0100000.json` | Full 7-digit = reactor ID | ID=0100000 |
| Pet | `5000000.json` | Full 7-digit = pet ID | ID=5000000 |
| Skill | `434.json` | Filename = skill_root (skillID / 10000) | Root=434 |
| Item/Consume | `0200.json` | Filename = first 4 digits of 8-digit item ID | Contains 02000000+ |
| Item/Etc | `0400.json` | Same 4-digit prefix pattern | Contains 04000000+ |
| Map | `000010000.json` | 9-digit map ID, first 3=region. Located in `Map/Map/MapX/` | Region=000, Map=010000 |

## JSON Value Type Detection

```
When parsing any JSON value:

├─ typeof === "string"
│  ├─ Ends with ".png" → PNG sprite path (no socket data)
│  ├─ Contains operators (+, -, *, u(, d() → Skill formula string
│  └─ Otherwise → Regular string value
│
├─ typeof === "object"
│  ├─ Has "_path" key → Canvas with socket data
│  │   ├─ _path: string     → PNG path relative to data/ — always use this
│  │   ├─ _inlink: string   → Cross-frame sprite alias (e.g. "walk1/1/weapon") — IGNORE; _path is already resolved
│  │   ├─ _filepath: string → Original .img source path — IGNORE (export metadata only)
│  │   ├─ origin: {x, y}    → Anchor/pivot point
│  │   ├─ map: object        → Socket points {navel, brow, hand, ...}
│  │   ├─ z: string|int      → Render layer (→ zmap.json)
│  │   ├─ delay: int         → Frame duration in ms
│  │   ├─ a0, a1: int        → Alpha blend (start, end, 0-255)
│  │   └─ lt, rb: {x, y}    → Bounding box (left-top, right-bottom)
│  │
│  └─ No "_path" key → Regular property group (recurse into it)
│
├─ typeof === "number" → Numeric value
└─ typeof === "boolean" → Boolean flag
```

## Data Lookup Workflows

### Skill Info Lookup

```
Input: Skill ID (e.g., 4340007)

1. Name/Desc: String/Skill.json → key "4340007"
   → { "name": "Final Cut", "desc": "...", "h": "Damage: #damage%" }

2. Spec: Skill/{4340007 / 10000}.json = Skill/434.json
   → ["skill"]["4340007"] → { "common": {...} }

3. Icon: skill.4340007.icon._path
   → "Skill/434/skill/4340007/icon.png"  (note: no .json in Skill PNG paths)
```

### Equipment Info Lookup

```
Input: Equip ID (e.g., 1010000)

1. Name: String/Eqp.json → Eqp.Accessory.1010000
   → { "name": "Long Brown Beard" }

2. Sprite: Character/Accessory/01010000.json
   → Contains animation states with socket data

3. Icon: Character/Accessory/01010000.json → info.icon._path
   (or Item/Equip/ if separate item data exists)
```

### Monster Info Lookup

```
Input: Mob ID (e.g., 100000)

1. Name: String/Mob.json → key "100000"
   → { "name": "Snail" }

2. Stats: Mob/0100000.json → info section
   → { "level": 1, "maxHP": 15, "exp": 3, ... }

3. Visual: If info.link exists → Mob/{link}.json
   → Mob/0100100.json → { "stand": {...}, "move": {...}, "die1": {...} }
   If no link → animations are in the same file
```

### Item Info Lookup

```
Input: Item ID (e.g., 2000000)

1. Name: String/Consume.json → key "2000000"
   → { "name": "Red Potion", "desc": "Recovers 50 HP." }

2. Spec: Item/Consume/{first 4 digits}.json = Item/Consume/0200.json
   → key "02000000" → { "info": { "price": 3 }, "spec": { "hp": 50 } }

3. Icon: Item/Consume/0200.json → 02000000.info.icon._path
```

### NPC Info Lookup

```
Input: NPC ID (e.g., 2100)

1. Name/Dialogue: String/Npc.json → key "2100"
   → { "name": "Sera", "n0": "The laundry just never ends." }

2. Visual: Npc/0002100.json
   → Animation states: stand, blink, smile, alert, ...
   → If info.link exists → use linked NPC's animations

3. PNG: Npc/0002100/{state}/{frame}.png
```

### Morph Info Lookup

```
Input: Morph ID (e.g., 1)

1. Data: Morph/0001.json
   → { "info": { "speed": 80, "jump": 100 }, "stand": {...}, "walk": {...} }

2. PNG: Morph/0001/{state}/{frame}.png

3. Animation states: stand, walk, jump, fly, ladder, rope, prone
```

### Reactor Info Lookup

```
Input: Reactor ID (e.g., 100000)

1. Data: Reactor/0100000.json
   → States "0" through "N", each with animation frames + event transitions
   → info: { "viewName": "Silver Herb", "level": 1, "resetTime": 5 }

2. PNG: Reactor/0100000/{state}/{frame}.png

3. Action type: "gather0" (gathering), or other interaction types
```

### Pet Info Lookup

```
Input: Pet ID (e.g., 5000000)

1. Name: String/Pet.json → key "5000000"
   → { "name": "Brown Kitty", "desc": "They are quiet and gentle in nature..." }

2. Data: Item/Pet/5000000.json
   → Animation states: stand0, move, jump, fly, rest0, hang, alert, ...
   → info: { "cash": 1, "hungry": 2, "icon": {...} }

3. PNG: Item/Pet/5000000/{state}/{frame}.png

4. Dialogue: String/PetDialog.json → key "5000000"
```

## Asset Path Convention

All `_path` values are relative to the `data/` root:
```
"_path": "Character/Accessory/01010000/angry/0/default.png"

Actual file: data/Character/Accessory/01010000/angry/0/default.png
```

PNG folders use the JSON filename **without the `.json` extension**:

```
Skill/434.json  → PNGs at  Skill/434/skill/{skillID}/icon.png
Character/...   → PNGs at  Character/.../01010000/...
Mob/...         → PNGs at  Mob/0100100/...
```

General rule for Character assets — a frame splits into parts:
```
00002001/             ← PNG folder (no .json extension)
├── stand1/0/
│   ├── body.png
│   └── arm.png
├── walk1/0/
│   └── ...
└── ...
```

Mob, NPC, Pet, Morph, and Reactor usually carry one PNG per frame instead, with no part
split — `{file}/{state}/{frame}.png`, e.g. `Mob/0100100/hit1/0.png`. Effect groups its
own way (`Effect/BasicEff/0/cardGet/0.png`), boss effect sub-trees go deeper
(`Mob/8880140/attack1/info/hit/0.png`), and Map back, tile, and object PNGs come from
set files — see `maple-field-map.md`.

**Only the folder rule is universal.** Every `_path` in a file sits under that file's own
folder, but the depth below it is not fixed, and an aliased frame carries the path of the
frame it copies rather than its own key path (`blink/3` → `.../blink/0.png`). Use the
`_path` the JSON gives you; never assemble one from a template.
