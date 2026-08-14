---
name: maple-mob-structure
description: |
  Mob file structure, stats, animation states, rendering workflow, and combat rules.
  Load when implementing mob spawning, rendering, or combat. For CDN/Phaser/flip → see maple-core-rendering.md.
---

# Mob File Structure & Rendering

## File Types: Stats vs Animation

Each mob ID has **two kinds of files**:

| Type | Path | Contains |
|------|------|---------|
| Stats file | `Mob/0{mobID}.json` | `info` with stats + `link` pointing to animation file |
| Animation file | `Mob/0{linkedID}.json` | `info` (copy) + animation states (stand, move, hit1, die1...) |

### How to identify

```json
// Stats file — has info.link
{ "info": { "level": 1, "maxHP": 15, "exp": 3, "link": "0100100", ... } }

// Animation file — no link, has animation states
{ "info": { "level": 1, "maxHP": 15, ... }, "stand": {...}, "move": {...}, "hit1": {...}, "die1": {...} }
```

**To render a mob:**
1. Load `Mob/0{mobID}.json` → read `info.link`
2. If `link` exists → load `Mob/{link}.json` for animations
3. If no `link` → the file itself contains animations

## Animation States

Verified against full dataset (~5,100 animation files).

| State | % present | Description |
|-------|-----------|-------------|
| `die1` | 99% | Death |
| `hit1` | 96% | Damage reaction |
| `stand` | 93% | Idle |
| `move` | 67% | Walking/Moving |
| `attack1` | 58% | Primary attack |
| `skill1` | 19% | Special skill |
| `attack2` | 15% | Secondary attack |
| `regen` | 10% | Respawn effect |
| `fly` | 9% | Flying movement (replaces `move`) |
| `attack3` | 7% | Tertiary attack |
| `jump` | 5% | Jump (flying/jumping mobs) |
| `chase` | 1% | Pursuit behavior (play when mob is chasing player) |
| `die2` / `dieF` | 2% | Alt death animations |
| `patrol*` | 2% | Patrol AI states (`patrolSense`, `patrolAttractdetect`, etc.) |

**Always check which states exist before playing** — iterate `Object.keys(animData).filter(k => k !== 'info')` at runtime.

## Frame Structure

Each animation state contains numbered frames:

```json
// Mob/0100100.json → "stand" → "0"
{
  "_path": "Mob/0100100/stand/0.png",
  "origin": { "x": 18, "y": 26 },
  "head": { "x": -13, "y": -24 },
  "lt": { "x": -18, "y": -26 },
  "rb": { "x": 19, "y": 0 }
}
```

| Field | Meaning |
|-------|---------|
| `_path` | PNG file path (relative to `data/`) |
| `origin` | Sprite anchor point — **every sprite has its own value; in animations, each frame has its own `origin`** |
| `head` | Head attachment offset (for some mobs) |
| `lt` / `rb` | Bounding box corners relative to the mob's origin pixel. World coords: `worldLeft = mobX + lt.x`, `worldRight = mobX + rb.x`, `worldTop = mobY + lt.y`, `worldBottom = mobY + rb.y`. Use for hitbox/collision detection. |
| `delay` | Frame duration in ms. **May be a string or number** — always parse with `parseInt(delay, 10)`. Default 150ms when absent. |
| `_inlink` | Cross-frame sprite alias (e.g. `"move/3"`). **Ignore** — `_path` is already resolved to the correct PNG. |
| `a0` / `a1` | Alpha fade range (0–255). Used in die1 last frame. See die1 Playback Rule. |

> **Every sprite carries its own `origin` value.** In animations, this means each frame has its own `origin` — image dimensions (and therefore `origin`) can differ between frames within the same state and across different states. Do not reuse or share `origin` values across sprites or frames.

## PNG Path Rule

```
Mob/{linkedID}/{state}/{frame}.png
```

Example: `Mob/0100100/stand/0.png`

Note: PNG folder uses the **animation file ID** (after following link), not the stats file ID.

## Mob Stats (info fields)

| Field | Meaning |
|-------|---------|
| `level` | Mob level |
| `maxHP` | Max HP |
| `exp` | EXP on kill |
| `PADamage` | Physical attack |
| `MADamage` | Magic attack |
| `PDRate` | Physical defense % |
| `MDRate` | Magic defense % |
| `speed` | Move speed — range -70 (slowest) ~ +50 (fastest). See Movement Speed below. |
| `boss` | Present if boss mob |
| `link` | Points to animation file ID |
| `mobType` | Type string (e.g. "1N" = normal) |

## Movement Speed

`info.speed` is an offset from the base speed of 100.

```
effectiveSpeed = 100 + info.speed    // e.g. Snail: 100 + (-65) = 35
```

| Mob | speed | effectiveSpeed |
|-----|-------|---------------|
| Stump | -70 | 30 |
| Snail | -65 | 35 |
| Fast mob | +50 | 150 |

**Frame iteration:** Non-numeric keys (e.g. `zigzag: 1`) in animation states are **flags, not frames**. Filter with `!isNaN(Number(key))` when iterating frames.

### Mob Zigzag (Ping-Pong) Playback

Some mob animation states contain a `zigzag: 1` flag. When present, play frames in ping-pong order (0→1→…→N-1→N-2→…→1→0→…) instead of sequential loop. About 0.8% of mob stand states and 0.6% of move states use zigzag. Default (no flag) is sequential loop.

## Placeholder PNGs and Spine Mobs

Some mobs (~234) have **1x1 transparent placeholder PNGs** (70 bytes) instead of real sprite images. These fall into two categories:

1. **Spine-animated mobs**: Modern bosses that use Spine skeletal animation (atlas + skeleton data) instead of per-frame PNGs. Their JSON may contain `aniName` strings instead of normal frame data. Rendering these requires a Spine runtime — standard PNG rendering will show nothing.

2. **Multi-part assembled mobs**: Large bosses composed of multiple separate mob IDs. The "main" mob ID has placeholder sprites, while the actual visible parts are stored as independent mob IDs with their own animations. Example: Horntail (8810018) is the main ID with placeholder stand PNG; the actual visible parts are separate mobs (8810000–8810009: heads, wings, tails, legs) each with 10–60 frame stand animations.

**Detection**: If a loaded PNG is 1x1 pixels or its file size is ≤ 70 bytes, treat it as a placeholder.

## Effect-Only Actions (`onlyFsm=1`)

Some boss attack actions have `info.onlyFsm: 1` in their action data. These are **FSM-only triggers** — the body sprite is a tiny dummy (typically 4×4 px, 1 frame) and the visual attack is rendered entirely through effect layers.

### How the Client Handles It

1. **Attack selection**: `bOnlyFsm` attacks fire only when the FSM explicitly forces them via `nForceAttackIdx` — they never trigger from normal target-range detection.
2. **Body sprite**: The 4×4 dummy canvas is loaded into the animation layer normally — C++ does **not** skip rendering it. It's simply invisible due to size.
3. **Skill animation**: The FSM transitions the mob to a paired `skill{N}` action, which has real multi-frame sprites. This is the visible "cast" animation.
4. **Effect layers**: Separate effect animations (`info/effect/`, `info/hit/`, `info/ball/`) render as independent `IWzGr2DLayer` instances at specified delays.

### Effect Data Location — Two Patterns

| Pattern | Effect Source | Example |
|---------|--------------|---------|
| **Inline** | `Mob/{id}.img/attackN/info/effect/` — embedded in the mob's own WZ data | Many regular mobs (e.g. 8130100, 8220023) |
| **Boss-specific Etc file** | `Etc/Boss{Name}.img` — dedicated effect file separate from `Mob/*.img` | Lucid, Damien, Will, Black Mage, Darknell, Seren, etc. |

High-tier bosses use the **Boss-specific Etc pattern**. Their `Mob/*.img/attackN/info/` contains only `hit`, `range`, `attackAfter`, `onlyFsm` — no `effect` node. The actual effect animations (projectiles, dragons, lasers, etc.) are stored in `Etc/Boss{Name}.img` and referenced by hard-coded paths in `Field_{BossName}.cpp`.

**Known Boss Etc effect files:**

| Etc File | Boss | Key Effect Assets |
|----------|------|-------------------|
| `Etc/BossLucid.json` | Lucid | Dragon, Shoot, Butterfly, LaserRain, RushLucid, Fury |
| `Etc/BossDemian.json` | Damien | flyingSword, flyingSword2 |
| `Etc/BossWill.json` | Will | Beholder, Infection, Web, NarrowWeb, ObstacleTrigger |
| `Etc/BossBlackMage.json` | Black Mage | Bullet (hard, story) |
| `Etc/BossDunkel.json` | Darknell | AreaWarning |
| `Etc/BossGorgon.json` | Seren | CurseBlade, SnakeHead, Stone, StoneChange, Finish |
| `Etc/BossGuardianSlime.json` | Guardian Angel Slime | slimeWave, holyGate, magmaSlime, multiTrack, etc. |
| `Etc/BossPapulatus.json` | Papulatus | ticktockCrane, ticktockLaser, heal_Mission |

All are exported as JSON + PNG folders under `data/Etc/`.

### Hit Effect Data (`info.hit`)

Regardless of the effect source pattern, most attack actions include `info.hit` in the Mob JSON — an animated hit effect played at the damage target's position.

```json
// Mob/8880140.json → attack1.info.hit
{
  "0": { "_path": "Mob/8880140/attack1/info/hit/0.png", "delay": 75, "origin": {"x":126,"y":107}, "z": 0 },
  "1": { "_path": "...", "delay": 75, "origin": {"x":126,"y":100}, "z": 0 }
}
```

Frame structure is identical to standard mob animation frames (`_path`, `delay`, `origin`, `z`).

### Web Implementation

1. **Detect**: `onlyFsm: 1` in action info, OR all body frames ≤ 4px → mark as effect-only
2. **Body**: Hide or skip the dummy body sprite
3. **Skill anim as body**: Look up `info.skill[]` where `action == attackIdx` → play `skill{action}` frames as the visible cast
4. **Hit overlay**: If `attackN/info/hit/` exists → render as a separate layer at `attackAfter` delay
5. **Boss effects** (optional): Load from `Etc/Boss{Name}.json` for full visual (projectiles, environmental effects, etc.)

### MobSkill Parameter Data

Attack effects may reference `Skill/MobSkill/{skillId}.img` for trajectory and timing parameters. These contain level-keyed entries with fields like `Circle` (trajectory), `ball` (projectile canvas), timing values, etc. The `info.skill[].skill` field in the mob JSON indicates which MobSkill ID is used, and `info.skill[].level` selects the level entry.

## Flip Rule (Facing Direction)

All mob sprites face **left by default**.

| Movement | Facing | Transform |
|----------|--------|-----------|
| Moving left | Left (default) | No transform |
| Moving right | Right | Flip horizontally around `origin.x` |
| Standing / hit / die | Keep last direction | Same as previous state |

When flipping: apply horizontal mirror around the mob's world X position. Anchor correction: `anchorX = width - origin.x` when facing right. Full flip rules → `maple-core-rendering.md`.

## bodyAttack (Contact Damage)

Mobs with `info.bodyAttack = 1` deal damage through **body collision** — no attack animation required.

- The mob stays in its current state (stand/move) during contact damage.
- Damage is calculated from `info.PADamage` using the `bodyAttackIdx` attack data.
- Collision detection: rectangular intersection between player body rect and mob body rect (lt/rb bounding box).
- 47% of mobs have `attack1` animation, but bodyAttack mobs without it still deal damage on contact.

## die1 Playback Rule

- `die1` plays **once** — do not loop.
- The last frame may contain `a0` / `a1` fields for an alpha fade effect:
  - `a0`: starting alpha (0–255), `a1`: ending alpha (0–255)
  - Example: `a0: 255, a1: 0` → fade from opaque to transparent during that frame's `delay`
  - Linearly interpolate alpha from `a0` to `a1` over the frame duration.
  - If absent → no fade, the frame renders at full opacity.
- **Entity removal**: server-controlled. The client keeps the mob in its final state after the last frame completes. For offline/standalone implementations, remove after the last frame's delay finishes.

## hit1 Playback Rule

- `hit1` plays once and returns to the **previous movement state**: if the mob was moving → `move`, otherwise → `stand`. No loop.

## Quick Reference

```
// Spawn a mob
const statsData = loadJSON(`Mob/${mobId.toString().padStart(7,'0')}.json`);
const animId = statsData.info.link ?? mobId.toString().padStart(7,'0');
const animData = loadJSON(`Mob/${animId}.json`);

// Every frame has its own origin — do not reuse origin values across frames.
const frame = animData[currentState][currentFrameIdx];
renderSprite(frame._path, frame.origin);
```

---

## Mob Rendering Workflow

Mobs are single-sprite entities. Each frame has `_path`, `origin`, `delay` — draw at origin offset.
For CDN, flip rules, rendering approaches, and Phaser integration → see `maple-core-rendering.md`.

> **Every sprite carries its own `origin` value.** In animations, this means each frame has its own `origin` — image dimensions (and therefore `origin`) can differ between frames within the same state and across different states. Do not reuse or share `origin` values across sprites or frames.

### Workflow: "Draw mob X" → HTML

1. **Lookup**: `maple-lookup_search("{mob name}")` → get mob ID and category
2. **Fetch**: `maple-lookup_get_sprite_data("mob", "{mobID}", ["stand", "move"])` → get animation frames
3. **Extract**: Each state (stand/move/attack1/die1) has numbered frames with `_path`, `origin`, `delay`
4. **Render**: Load PNGs from CDN, cycle frames using `delay` timing

### Mob JSON Structure
```json
// Mob/{mobID}.json — e.g. Mob/5100203.json (Goblin)
{
  "stand": {
    "0": { "_path": "Mob/5100203/stand/0.png", "origin": {"x":52,"y":118}, "delay": 200 },
    "1": { ... }
  },
  "move": { ... },
  "attack1": { ... },
  "die1": { ... },
  "info": { ... }
}
```