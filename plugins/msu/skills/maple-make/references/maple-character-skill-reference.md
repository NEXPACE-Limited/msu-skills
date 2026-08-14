---
name: maple-character-skill-reference
description: |
  Complete skill spec field list, monster skill ID table (MobSkill enum 100–267),
  and effect animation rendering rules (layers, z-order, hit effects).
  Use when implementing mob AI skills, boss mechanics, skill effects, or need exhaustive skill field names.
---

# Skills — Full Reference

## All Skill Spec Fields

| Field | Type | Description |
|-------|------|-------------|
| `maxLevel` | int | Maximum skill level |
| `padX` | formula | Physical ATK increase |
| `madX` | formula | Magic ATK increase |
| `pddX` | formula | Physical DEF increase |
| `mddX` | formula | Magic DEF increase |
| `damage` | formula | Damage percentage |
| `attackCount` | formula | Number of attack hits |
| `mobCount` | formula | Number of targets hit |
| `range` | formula | Attack range |
| `mpCon` | formula | MP consumption |
| `hpCon` | formula | HP consumption |
| `time` | formula | Buff/effect duration (seconds) |
| `prop` | formula | Activation probability % |
| `cr` | formula | Critical rate increase |
| `criticaldamage` | formula | Critical damage % |
| `ignoreMobpdpR` | formula | Ignore monster PDR % |
| `dot` | formula | Damage-over-time value |
| `dotTime` | formula | DoT duration |
| `dotInterval` | formula | DoT tick interval |
| `dotSuperpos` | formula | DoT max stacks |
| `stanceProp` | formula | Stance activation % |
| `x` | formula | Generic variable (referenced as #x in desc) |
| `y` | formula | Generic variable (referenced as #y in desc) |
| `z` | formula | Generic variable (referenced as #z in desc) |
| `cooltime` | int | Cooldown in seconds |
| `fixdamage` | int | Fixed damage (ignores ATK) |

### Skill Info Fields

| Field | Type | Description |
|-------|------|-------------|
| `info.type` | int | 10=Buff, 50=Passive, 51=DoT |
| `info.weapon` | int | Required weapon type (WT_* code) |
| `info.elemAttr` | string | Element: "F"=Fire "I"=Ice "L"=Lightning "S"=Poison "H"=Holy |
| `info.magicSteal` | int | Magic steal flag |
| `masterLevel` | int | Master level (usually = maxLevel) |
| `combatOrders` | int | Combat Orders compatibility (0/1) |
| `psd` | int | Passive Skill Data flag (0/1) |

## Monster Skill Table (MobSkill enum)

### Self Buffs (100–115)

| ID | Name | Effect |
|----|------|--------|
| 100 | POWERUP | Physical ATK buff |
| 101 | MAGICUP | Magic ATK buff |
| 102 | PGUARDUP | Physical DEF buff |
| 103 | MGUARDUP | Magic DEF buff |
| 104 | HASTE | Speed buff |
| 105 | POWERUP_M | Area ATK buff |
| 110 | HEAL_M | Area heal |

### Debuffs (120–138)

| ID | Name | Effect |
|----|------|--------|
| 120 | SEAL | Skill seal |
| 121 | DARKNESS | Accuracy reduction |
| 122 | WEAKNESS | Slow debuff |
| 123 | STUN | Stun |
| 124 | CURSE | EXP gain reduction |
| 125 | POISON | Poison DoT |
| 126 | SLOW | Movement slow |
| 127 | DISPEL | Buff removal |
| 128 | SEDUCE | Forced movement |
| 129 | BANMAP | Map ejection |
| 131 | CRAZYSKULL | Reverse controls |
| 132 | ZOMBIFY | Healing becomes damage |
| 133 | CRITICAL_UP_M | Monster crit buff (area) |
| 134 | MISS | Player miss rate up |
| 137 | FROZEN | Freeze |
| 138 | ICE_BY_RANGE | Ice attack (ranged) |

### Immunity & Counter (140–158)

| ID | Name | Effect |
|----|------|--------|
| 140 | PHYSICALIMMUNE | Physical immunity |
| 141 | MAGICIMMUNE | Magic immunity |
| 142 | HARDENSKIN | Damage reflection |
| 143 | PCOUNTER | Physical counter |
| 144 | MCOUNTER | Magic counter |
| 145 | PMCOUNTER | Both counter |
| 146 | INVINCIBLE | Invincibility |
| 148 | SPEED | Speed change |
| 155 | BALROG_COUNTER | Balrog-specific counter |

### Special Attacks (170–199)

| ID | Name | Effect |
|----|------|--------|
| 170 | TELEPORT | Boss teleport |
| 171 | FIXEDDAMAGE | Fixed damage attack |
| 175 | DEATHMARK | Death mark |
| 177 | AURA_STAT_CHANGE | Aura stat modifier |
| 180 | AREA_DEBUFF | Area debuff field |
| 181 | MAGNET | Pull towards mob |
| 186 | KNOCKDOWN | Knockdown attack |

### Summon & Boss Mechanics (200–267)

| ID | Name | Effect |
|----|------|--------|
| 200 | SUMMON | Summon minions |
| 201 | SUMMON_CUBE | Cube summon |
| 207 | HEKATON | Hekaton boss mechanic |
| 220 | WILL | Will boss mechanic |
| 238 | LUCID | Lucid boss mechanic |
| 239 | LUCID_2 | Lucid phase 2 |
| 263 | SEREN | Seren boss |
| 264 | SEREN_2 | Seren phase 2 |
| 267 | CHOSEN_ONE | Chosen One mechanic |

---

## Effect Animation

Effects use numbered frames: `"0"`, `"1"`, `"2"` with `delay` for timing.
Loop when last frame is reached, or play once for skill effects.

- **Default delay**: 60ms when `delay` field is absent from a frame.
- **Effect positioning**: The `origin` field in effect frames is a large pixel offset (e.g., x=217, y=109) designed to center the effect at the attachment world position. Spawn the effect sprite at the target's world position and apply the origin as the anchor — the same way character parts are positioned.
- **Effect z-order**: Render effects above character parts and mobs, below UI elements.
- **Effect flip**: Effect sprites face **left by default**, the same convention as character and mob sprites. Apply the same flip rule: flip the effect horizontally when the character faces right. Use the same anchor pixel correction (`anchorX = width - origin.x`) when flipped.
- **Skill effect structure**: `skill.{skillID}.effect` contains the cast animation; `skill.{skillID}.hit.{N}` contains the on-target hit animation. `randomHit: 1` flag means a random hit variant is selected when multiple exist.
- **BasicEff.json**: `Effect/BasicEff.json` contains generic hit effects (`NoRed0`–`NoRed3`). No documented rule for which variant to use — choose by visual preference.
- **No documented mapping** between weapon types and default attack effects. Choose a skill effect from `Skill/*.json` that visually fits the weapon.

### Effect Layers (effectN naming)

A skill may have multiple effect layers: `effect`, `effect0`, `effect1`, `effect2`, etc. (up to `effect5` observed). Each layer is an independent animation with its own frames and timing. Render all layers simultaneously.

- `effect` (no number) — the primary cast effect layer
- `effect0`–`effect5` — additional effect layers (1402 skills use `effect0`, 97 use `effect1`, etc.)

### Effect z field

Each effect layer has a `z` field that controls its rendering depth relative to the caster:

| z value | Meaning | Example |
|---------|---------|---------|
| negative (−1, −2, −3) | Behind the character | effect0 commonly z=−2 (back layer) |
| 0 | At character level | Rare |
| positive (1, 2, 3+) | In front of the character | effect commonly omits z (default: front) |

When no `z` field is present on the effect layer, render in front of the character (above character parts and mobs, below UI).

### Hit Effect Fields

| Field | Description |
|-------|-------------|
| `randomHitOrigin` | Uniform random X and Y offset range (px). Each hit spawns at the target position ± randomHitOrigin on both axes independently. Common values: 10–40px. |
| `useZ` | When `1`, the hit effect uses the explicit `z` value for depth ordering instead of default front rendering. |
| `z` | Rendering depth for the hit effect (only when `useZ=1`). z=1 is most common (in front of target). |
