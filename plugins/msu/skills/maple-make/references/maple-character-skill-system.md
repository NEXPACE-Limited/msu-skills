---
name: maple-character-skill-system
description: |
  Skill JSON structure, formula syntax, and damage calculation.
  Use when reading skill specs, calculating damage/buff values at a given skill level, or rendering skill icons.
---

# Skill System

## Skill JSON Structure

```json
// Skill/434.json → ["skill"]["4340007"]
{
  "skill": {
    "4340007": {
      "common": {
        "maxLevel": 20,
        "padX": "10+x",
        "stanceProp": "20+2*x"
      },
      "icon": { "_path": "Skill/434/skill/4340007/icon.png", "origin": {"x":0,"y":32} },
      "info": { "type": 10 },       // 10=Buff, 50=Passive, 51=DoT
      "masterLevel": 20,
      "psd": 1                      // Passive skill flag
    }
  }
}
```
## Skill Root Extraction

```cpp
LONG get_skill_root_from_skill(LONG nSkillID) {
    LONG root = nSkillID / 10000;
    if (root == 8000 || root == 8001)  // Common skills
        root = nSkillID / 100;         // More granular
    return root;
}
```

## Formula Syntax

| Element | Meaning | Example |
|---------|---------|---------|
| `x` | Current skill level | `"10+x"` → Lv10 = 20 |
| `u(expr)` | Ceiling (round up) | `"u(x/3)"` → Lv10 = 4 |
| `d(expr)` | Floor (round down) | `"d(x/5)"` → Lv10 = 2 |
| `*`, `+`, `-`, `/` | Arithmetic | No other functions exist |

### Common Patterns

| Pattern | Behavior |
|---------|----------|
| `"10+x"` | +1 per level |
| `"10+2*x"` | +2 per level |
| `"30+10*u(x/5)"` | +10 per 5 levels |
| `"90+20*d(x/5)"` | +20 per 5 levels |

### Calculation Example

```
Skill 4340007 (Final Cut), Level 10:
  padX       = 10 + 10       = 20
  stanceProp = 20 + 2*10     = 40%
  mpCon      = 30 + 10*⌈10/5⌉ = 50
  time       = 90 + 20*⌊10/5⌋ = 130s
```

## Key Spec Fields

| Field | Type | Description |
|-------|------|-------------|
| `maxLevel` | int | Max skill level |
| `damage` | formula | Damage % |
| `attackCount` | formula | Number of attacks |
| `mobCount` | formula | Number of targets |
| `mpCon` / `hpCon` | formula | MP / HP cost |
| `time` | formula | Duration (seconds) |
| `prop` | formula | Activation probability % |
| `padX` / `madX` | formula | Phys / Magic ATK increase |
| `cr` | formula | Critical rate |
| `dot` / `dotTime` | formula | DoT damage / duration |
| `cooltime` | int | Cooldown (seconds) |
| `info.type` | int | 10=Buff, 50=Passive, 51=DoT |
| `info.weapon` | int | Required weapon type (WT_* code) |
| `psd` | int | Passive Skill Data flag |

For the complete spec field list → see `maple-character-skill-reference.md`.

## Skill Calculator (Python)

```python
import math
def calc(formula: str, level: int) -> float:
    x = level
    expr = formula.replace('u(', 'math.ceil(').replace('d(', 'math.floor(')
    return eval(expr)
```

## Icon References

- `icon` — Default icon
- `iconDisabled` — Greyed-out (not available)
- `iconMouseOver` — Hover state

Each has `_path` (PNG path) and `origin` (anchor point).

## Effect Assets

```
Skill/{root}/skill/{skillID}/effect/{frame}.png
```

- `root` = `skillID / 10000` (e.g. skill 4001003 → root 400)
- Iterate `skill[skillID].effect` object keys at runtime to find available frames — do not hardcode frame count
- The `action` field (`skill[skillID].action`) contains the character animation state name triggered by the skill

**Claw weapon (WT_THROWINGGLOVE=47, ID prefix 1472xxx):**
- Does NOT have `shoot1`/`shoot2` action in weapon JSON → falls back to `walk1` per maple-character-rendering.md fallback rule
- Use body `shoot1` action for the throwing animation

## Effect Direction

Skill effects and projectiles must flip to match character facing:

- Character sprites default to **facing left**. When facing right, flip effect images horizontally.
- **Projectile velocity X**: negate when character faces left (default direction is rightward).
- Spawn offset: use `±offset` from character origin depending on facing direction.

## Skill Description Templates

In `String/Skill.json`, the `"h"` field uses template variables:
```
"h": "Damage: #damage%, Number of Attacks: #attackCount, MP Cost: #mpCon"
```

Replace `#fieldName` with the calculated value from `common`.
