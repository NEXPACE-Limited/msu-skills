---
name: maple-character-rendering
description: |
  Character sprite assembly: socket attachment formula, z-order, VSlot mapping, flip rules,
  equipment attachment rules, animation states, and AAT (attack action type) table.
  Use when implementing character rendering, equipment display, or character animation.
user-invocable: true
disable-model-invocation: false
---

# Character Rendering (Socket Assembly)

> **ALL sprites face LEFT by default.** Flip explicitly when facing right.
> CDN, flip rules, rendering approaches, Phaser integration → see `maple-core-rendering.md`.

Characters are rendered by **overlapping matching socket points** between body and equipment sprites.

## Workflow: "Draw character with X equipment" → HTML

1. **Lookup equipment**: `maple-lookup_search("{equipment name}", "{category}")` → get item IDs
   - Categories: hair, face, cap, coat, longcoat, pants, shoes, glove, weapon, cape, shield, accessory
2. **Fetch sprite data**: `maple-lookup_get_sprite_data("{category}", "{itemID}", ["stand1"])` → get animation frames with socket data
   - Base body: `maple-lookup_get_sprite_data("body", "2000", ["stand1"])`
   - Head: `maple-lookup_get_sprite_data("body", "12000", ["stand1"])`
   - Face/Hair/Equipment: use search results' category and ID
   - Response keys for body/head/equipment are `"{frame}.{part}"` format (e.g. `"0.body"`, `"0.arm"`, `"0.head"`)
   - Each entry includes `_path`, `origin`, `delay`, `z` (layer), and `map` (socket points like navel, neck, brow, hand)
3. **Extract needed state** (e.g., stand1, walk1) — use only the frames you need
4. **Assemble via sockets** — use the socket chain below to compute draw positions
5. **Embed extracted data in HTML** — inline JSON + load PNGs from CDN

---

## 1. Data — Files & Frame Structures

### Character File IDs

| VSlot | File path | Contents | Default |
|-------|-----------|----------|---------|
| Bd (Body) | `Character/0000{skinID}.json` | body + arm (per action/frame) | `00002000` |
| Hd (Head) | `Character/0001{skinID}.json` | head + ear (per action/frame) | `00012000` |
| Hr (Hair) | `Character/Hair/{hairID}.json` | hair, hairOverHead, hairShade | `00030000` |
| Fc (Face) | `Character/Face/{faceID}.json` | face sprite per expression | `00020000` |
| Cp (Cap) | `Character/Cap/{itemID}.json` | hat | |
| Ma (Coat) | `Character/Coat/{itemID}.json` | top armor | |
| Pn (Pants) | `Character/Pants/{itemID}.json` | bottom | |
| So (Shoes) | `Character/Shoes/{itemID}.json` | shoes | |
| Gv (Glove) | `Character/Glove/{itemID}.json` | gloves | |
| Wp (Weapon) | `Character/Weapon/{itemID}.json` | weapon | |
| Ca (Cape) | `Character/Cape/{itemID}.json` | cape | |

**Body ID pattern:**
- `00002000`–`00002040`: Male skin tones 1–40

```
Load files (default combination):
  Body:  Character/00002000.json       (body + arm sprites)
  Head:  Character/00012000.json       (head + ear sprites)
  Face:  Character/Face/00020000.json  (expression sprites)
  Hair:  Character/Hair/00030000.json  (hair sprites)

Available action list: keys of bodyJson excluding 'info'
  stand1 and walk1 are guaranteed to exist in all body JSON files (base actions)

Frames per action: use only numeric keys (non-numeric meta keys may exist)
  - `delay` field in each frame is in **milliseconds**
```

### PartData Format

```json
{
  "_path": "Character/00002001/stand1/0/body.png",
  "origin": { "x": 16, "y": 31 },
  "z": "body",
  "map": {
    "navel": { "x": -8, "y": -21 },
    "neck":  { "x": -4, "y": -32 }
  },
  "delay": 500,
  "_hash": "..."
}
```

- `_path`: format is `Character/{skinID}/{action}/{frame}/{part}.png`
- `origin`: anchor pixel coordinate within the sprite image (relative to top-left)
- `map`: socket coordinates (offset from origin pixel, can be negative)
- `z`: zmap layer name → determines render order
- A frame object may contain non-PartData values mixed in (numbers, strings) such as `face: 1`
- **Every sprite carries its own `origin` value** — in animations, each frame has its own `origin`, even within the same action. Never assume a constant value; always read from the current frame's data.

### Body Frame Structure

```json
// Character/00002001.json → stand1 → 0
{
  "body": { "_path": "Character/00002001/stand1/0/body.png", "origin": {"x":16,"y":31}, "z": "body",
            "map": { "navel": {"x":-8,"y":-21}, "neck": {"x":-4,"y":-32} } },
  "arm":  { "_path": "Character/00002001/stand1/0/arm.png",  "origin": {"x":5,"y":9},   "z": "arm",
            "map": { "hand": {"x":-1,"y":5}, "navel": {"x":-13,"y":-1} } },
  "face": 1,       // number: expression index (not PartData, ignored during rendering)
  "delay": 500
}
```

- `face` field is a **number (expression index)** — not PartData; filter out during rendering with `typeof v !== 'object'`
- The expression index has no documented mapping to expression name strings. Use `'default'` as the safe fallback expression regardless of the index value.
- Some body frames also contain `lHand`, `rHand`, and `armOverHair` parts (e.g., in `alert`, `swingT1` actions). These are additional limb sprites that appear in specific action frames — render them using the same socket formula as other navel-attached parts. Safe to ignore for basic idle rendering.

### Head Frame Structure

```json
// Character/00012001.json → stand1 → 0
{
  "head":       { "_path": "Character/00012001/front/head.png", "origin": {"x":18,"y":17}, "z": "head",
                  "map": { "neck": {"x":0,"y":15}, "brow": {"x":-4,"y":-5} } },
  "ear":        { "_path": "Character/00012001/front/ear.png",  "origin": {"x":23,"y":-1}, "z": "accessoryOverHair",
                  "map": { "brow": {"x":-4,"y":-5}, "earBelowHead": {"x":0,"y":0}, "earOverHead": {"x":0,"y":0}, "neck": {"x":0,"y":15} } },
  "highlefEar": { ... },
  "humanEar":   { ... },
  "lefEar":     { ... }
}
```

- Head PNG is always fixed at `Character/{headID}/front/head.png` regardless of action
- Head JSON access: `headJson[action][frame]` — fall back to `'0'` if frame key missing; fall back to `'stand1'` if action itself is missing from head JSON
- **For basic rendering, use only `head` and `ear` keys**: `highlefEar`, `humanEar`, `lefEar` are activated only under specific hair/hat vslot conditions — rendering all causes visible ear overlap
- All ear-type parts connect to body via the `neck` socket (same as head)
- head.map.brow = reference socket for Face/Hair attachment. **Capture brow socket from the part named `'head'`** — the `z` field may differ

### Face File Structure

```json
// Character/Face/00020000.json → default → face
{
  "_path": "Character/Face/00020000/default/face.png",
  "origin": {"x":13,"y":8}, "z": "face",
  "map": { "brow": {"x":-1,"y":-12} }
}
```

- Top-level keys: expression names (`default`, `blink`, `angry`, ...)
- `default` expression key structure: `{ "face": PartData }` (no numeric index)

### Hair File Structure

- Top-level keys: action names (`stand1`, `walk1`, `default`, ...)
- Frame keys: numbers (`0`, `1`, ...)
- Parts: `hair`, `hairOverHead`, `hairShade` (all use brow socket)
- `hairShade` has a nested sub-frame structure (keys `"0"`, `"1"`, ...) — always use sub-frame `"0"`. `hair` and `hairOverHead` are direct PartData objects (no sub-frame nesting).

---

## 2. Assembly — Socket Attachment

### Socket Points

| Socket | Connected to | Files used |
|--------|-------------|------------|
| **navel** | Body ↔ Arm (within same frame) | body, arm |
| **neck** | Body → Head attachment | body.map.neck → head.map.neck |
| **brow** | Head → Face, Hair, Cap attachment | head.map.brow → face/hair.map.brow |
| **hand** / **handMove** | Arm → Weapon, Glove | arm.map.hand ↔ weapon.map.hand |
| **earBelowHead** / **earOverHead** | Ear z-ordering | head, ear |
| **muzzle** | Ranged weapon firing point | Weapon |

| Socket | SID | Used for | Common equipment |
|--------|-----|----------|-----------------|
| navel | 1828 | Torso anchor | ALL equipment |
| brow | 1827 | Forehead/eyebrow | Hat, Hair, Face acc |
| hand | 1830 | Hand grip | Weapon, Glove |
| handMove | — | Hand (move state) | Weapon during walk |
| head | — | Head top | Mount positioning |
| muzzle | 1829 | Barrel/mouth | Gun, Crossbow fire point |
| face | — | Face center | Face accessories |

### Attachment Formula

`map` coordinates are **offsets relative to the origin pixel** (can be negative).

```
childOriginWorld = parentOriginWorld + parentSocket - childSocket
```

> **Scale warning:** The formula above is in sprite pixel units. When rendering at N× scale, multiply offsets:
> ```
> childOriginWorld = parentOriginWorld + (parentSocket - childSocket) * SCALE
> ```
> Forgetting `* SCALE` causes all parts to overlap at nearly the same position.

- `childOriginWorld` = world coordinate where the child sprite's **origin pixel** is placed (target for setPosition)
- Each socket is a relative coordinate from the origin pixel. Attachment is complete when the same socket of two parts coincides in world coordinates.
- World coordinate of arm's hand socket = `armOriginWorld + arm.map.hand * SCALE` (weapon attachment reference point)

### Ready-to-Use Socket Function (Phaser / JS)

```javascript
function socketAttach(parentWorld, parentSocket, childSocket, flip, SCALE) {
  var sx = flip ? -1 : 1;
  return {
    x: parentWorld.x + (parentSocket.x * sx - childSocket.x * sx) * SCALE,
    y: parentWorld.y + (parentSocket.y      - childSocket.y)      * SCALE,
  };
}
```

When `flip=true`, socket X values are negated (mirrored) — this matches the rule `mirroredSocket = { x: -socket.x, y: socket.y }`.

### Socket Combination Table

All attachments follow the same formula:
```
childWorld = socketAttach(parentWorld, parent.map.{socket}, child.map.{socket}, flip, SCALE)
```

| Parent | Child | Socket |
|------|------|--------|
| body | arm | navel |
| body | head | neck |
| body | ear | neck |
| head | face | brow |
| head | hair | brow |
| arm | weapon | hand |

> **❌ DO NOT** `Object.values(bodyFrame).forEach(p => addPart(bodyWorld, p))`
> `bodyFrame` contains both `body` and `arm`, but `arm` must be attached separately via the navel socket.

---

## 3. Rendering — Z-Order, Flip, Phaser

### Z-Order (zmap.json)

Z-order is determined by key position in `data/zmap.json`: index 0 = closest to viewer, higher index = further back. Sort parts by descending index (draw furthest-back first).

For unknown layer names encountered in part data, render at the very back (lowest priority).

> **Z-order is mandatory — do not skip it.** Without sorting, arm renders over head, hair renders under body, etc.

### Pattern: Collect → Sort → Render

Never render each part immediately as you compute its position. Instead:

1. **Collect** all parts into a list: `{ worldPos, partData }`
2. **Sort** by z-depth (descending index = furthest back first)
3. **Render** in sorted order

### Horizontal Flip Rendering Rules

Full flip rules (anchor correction + socket mirroring) → see `maple-core-rendering.md`.

Character assembly requires **both** steps:
1. **Anchor Pixel Correction** — when placing each part image:
   - No flip: `img.x = worldPos.x - origin.x * SCALE`
   - Flip: `img.x = worldPos.x - (texW - origin.x) * SCALE` (where `texW` = original texture width)
2. **Socket Coordinate Mirroring** — in `socketAttach`, negate socket X when flipped:
   - `mirroredSocket.x = flip ? -socket.x : socket.x` (Y is unchanged)

### Phaser Implementation — placeSpritePart

> Do NOT use `setOrigin(fraction, fraction)` — Phaser's `setOrigin` controls the pivot point, NOT the draw offset.
> Using `origin.x / width` as fraction causes misalignment, especially after `setScale`.
> Always use `setOrigin(0, 0)` and compute `img.x`, `img.y` manually.

```javascript
var SCALE = 2;

function placeSpritePart(scene, worldPos, partData, flip, depth) {
  var key = partData._path;
  if (!scene.textures.exists(key)) return null;

  var img = scene.add.image(0, 0, key).setOrigin(0, 0).setScale(SCALE).setDepth(depth);
  img.setFlipX(flip);

  var texW = img.width;  // Phaser img.width = frame.realWidth = original texture pixel width (unaffected by scale)
  var ox = partData.origin.x, oy = partData.origin.y;

  if (flip) {
    img.x = worldPos.x - (texW - ox) * SCALE;
  } else {
    img.x = worldPos.x - ox * SCALE;
  }
  img.y = worldPos.y - oy * SCALE;
  return img;
}
```

---

## 4. Animation

### Animation States — Character

| State | Description | Typical frames |
|-------|-------------|---------------|
| stand1, stand2 | Idle | 3 frames (body: 500ms each, total loop 1500ms) |
| walk1, walk2 | Walking | 4 frames (body: 180ms each, total loop 720ms) |
| alert | Combat stance | 3 frames |
| swingO1, swingO2 | 1H attack | 3 frames |
| swingT1, swingT2 | 2H attack | 3 frames |
| stabO1, stabO2 | Stab | 3 frames |
| shoot1, shoot2 | Ranged attack | 3 frames |
| jump | Jumping | 1 frame (hold the single frame for the entire airborne duration — do not loop) |
| fly | Flying | 4 frames |
| hide | Dark Sight stealth | 1+ frame |
| ladder, rope | Climbing | 2 frames |
| prone | Lying down | 1 frame |
| proneStab | Prone attack | 2 frames |
| heal | Healing pose | 3 frames |

### Animation Frame Playback Mode (isZigZag)

Each action uses either **sequential loop** or **ping-pong** frame playback:

- `isZigZag=false` (sequential): frames play 0→1→2→…→N-1→0→1→… (loop)
- `isZigZag=true` (ping-pong): frames play 0→1→…→N-1→N-2→…→1→0→1→… (reverse at end, never repeat endpoints)

For N source frames, the expanded ping-pong sequence has `N*2-2` steps (e.g. 3 frames → 0,1,2,1 = 4 steps).

| isZigZag | Actions |
|---------|---------|
| **true** (ping-pong) | `stand1`, `stand2`, `alert`, `ghoststand` |
| **false** (sequential loop) | All other actions: `walk1`, `walk2`, `jump`, `ladder`, `rope`, `prone`, `proneStab`, `heal`, `fly`, all attack actions (`swingO*`, `swingT*`, `swingP*`, `stabO*`, `stabT*`, `shoot*`, etc.) |

---

## 5. Equipment

### Equipment Socket Attachment Rules

#### Common Rules (all equipment)

- **Action fallback**: requested action → `stand1` → `walk1`
- **Frame fallback**: if the matching frame key is missing, use frame `'0'`

#### Coat / Pants / Shoes / Cape / Shield
Attach via the body's `navel` socket:
```
equipOriginWorld = socketAttach(bodyOriginWorld, body.map.navel, equip.map.navel)
```

#### Cap
- `info.vslot` lists the VSlot codes this cap occupies (e.g. `"CpH1H5"`). To determine hair masking, check if a hair part's VSlot code appears in this string.

#### Weapon
```
armOriginWorld = socketAttach(bodyOriginWorld, body.map.navel, arm.map.navel)
weaponOriginWorld = socketAttach(armOriginWorld, arm.map.hand, weapon.map.hand)
```
- Attack states (swingO1, swingT1, etc.): weapon.map switches to `navel` only → attach relative to body.map.navel instead
- If the current action is missing from weapon JSON, fall back to `walk1`

**Weapon-driven action selection** — the equipped weapon's `info` fields determine the body action state:
- `info.walk  == 1` → `walk1`,  else `walk2` (no weapon: `walk1`)
- `info.stand == 1` → `stand1`, else `stand2` (no weapon: `stand1`)
- `info.attack` → AAT code → defines the normal attack animation pool (see Attack Action Type table below)

#### Weapon Sticker (ID 170xxxx)
Cash cosmetic overlay rendered on top of a base weapon. Requires a base weapon to be present.
- Sticker JSON top-level keys = weapon type codes (e.g., `30` for 1H Sword). Select the sub-tree using the **base weapon's type code**.
- Sprite path inside the selected sub-tree: `{action}/{frame}/weapon`
- Walk/stand/attack action types all derive from the **base weapon's** `info` fields — not the sticker.

#### Belt / Medal / Ring
`info`-only files — no sprite parts, no rendering needed.

### VSlot Mapping

For the full VSlot code list, see `data/smap.json` (object mapping `layerName → VSlotCode`).

#### Hat Masking Rule

Cap VSlot string: `CpHdH1H2H3H4H5H6HsHfHbAfAyAsAe`
When cap is worn, it can mask these VSlots:
- `Hd` = Head, `H1-H6` = Hair variants, `Hs/Hf/Hb` = Hair sub-types
- `Af/Ay/As/Ae` = All accessory types

### Attack Action Type (AAT)

`weapon.info.attack` value is the AAT code. One action is randomly selected from the pool below on each normal attack.

| AAT | Weapon type | Normal attack action pool |
|-----|----------|-----------------|
| 1 (OneHand) | 1H Sword/Axe/Mace | swingO1, swingO2, swingO3, stabO1, stabO2 |
| 2 (Spear_PoleArm) | Spear, Polearm | swingT2, swingP1, swingP2, stabT1, stabT2 |
| 3 (Bow) | Bow | swingT1, swingT3 |
| 4 (CrossBow) | Crossbow | swingT1, stabT1 |
| 5 (TwoHand) | 2H Sword/Axe/Mace | swingT1, swingT2, swingT3, stabO1, stabO2 |
| 6 (Staff_Wand) | Staff, Wand, Rod | swingO2 |
| 7 (ThrowingGloves) | Throwing Gloves | stabO1, stabO2 |
| 8 (Knuckle) | Knuckle | stabO1, stabO2 |
| 9 (Gun) | Gun | swingT1, swingT2 |
| 10 (DualDagger) | Dual Dagger | swingD1, swingD2, stabD1 |
| 11 (DualBow) | Dual Bowgun | swingDB1, swingDB2 |
| 12 (HandCannon) | Hand Cannon | swingC1, swingC2 |
| 13 (Cane) | Cane (Phantom) | stabO1, stabO2 |
| 14 (Soul_Shooter) | Soul Shooter | stabO1 |
| 15 (Katana) | Katana (Hayato) | swingO1, swingO3, stabO1 |
| 16 (Fan) | Fan (Hoyoung/Kanna) | swingO1, swingO2, swingO3, stabO1 |
| 17 (BreathShooter) | Breath Shooter (Kain) | swingO1, swingO2 |

- Ranged weapons (Bow/CrossBow/Gun/ThrowingGloves, etc.) switch to separate shoot actions (shoot1, shoot2, shoot3–5, shot, etc.) when using ranged attack skills.
- `info.attack` absent or 0: no normal attack (special items, defense-only equipment, etc.).
- `info.walk` / `info.stand` absent or 0: use walk2 / stand2 (`== 1` is the only condition for walk1 / stand1).
