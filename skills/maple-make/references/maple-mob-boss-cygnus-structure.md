---
name: maple-mob-boss-cygnus-structure
description: |
  Cygnus single-part boss rendering: 1 part, 6 attacks + 7 skills + sleep/wakeup.
  Load when rendering Cygnus (8850011).
user-invocable: true
disable-model-invocation: false
---

# Cygnus — Single-Part Boss Rendering

Cygnus (Empress) is a **single-part boss** with 6 attacks, 7 skills, and unique `sleep`/`wakeup` state transition animations. Her fight includes Cygnus Knight summons (separate mob entities).

## Part

| Part ID   | Name   | noFlip | bodyAttack |
|-----------|--------|--------|------------|
| 8850011   | Cygnus | 0      | 1          |

## Actions

| Action | Frames |
|--------|--------|
| stand | 8 |
| move | 8 |
| sleep | 8 |
| wakeup | 7 |
| attack1 | 44 |
| attack2 | 21 |
| attack3 | 24 |
| attack4 | 38 |
| attack5 | 44 |
| attack6 | 44 |
| die1 | 29 |
| hit1 | 1 |
| skill1 | 18 |
| skill2 | 24 |
| skill3 | 25 |
| skill4 | 21 |
| skill5 | 26 |
| skill6 | 22 |
| skill7 | 22 |

## Action → Pattern Mapping

| Action | Pattern | Description |
|--------|---------|-------------|
| sleep | Dormant | Rest phase during knight summon sequence |
| wakeup | Activation | Transition from sleep to active |
| attack1 | Dark Genesis / BANMAP | fixDamR 100%, ground column beams. Also used for BANMAP (129) cast |
| attack2 | Darkness Ball / SUMMON2 | fixDamR 100%, slow skull projectile. Also used for SUMMON2 (201) cast |
| attack3 | Flame Floor / UNDEAD | Firebird dive + fire DOT (AREA_POISON 131). Also used for UNDEAD (133) cast |
| attack4 | Abyss Tornado / USER_MORPH | fixDamR 10%, tornado debuff (DARKTORNADO 173). Also used for USER_MORPH (172) cast |
| attack5 | Dark Genesis (Rage) / Knight Summon | fixDamR 90%, triggered on knight death. Also used for SUMMON (200) / SUMMON2 (201) cast |
| attack6 | Dark Genesis (Sustained) / PMCOUNTER | fixDamR 100%. Also used for PMCOUNTER (145) cast |
| skill1–6 | Server-triggered | Server FSM animations (no info.skill mapping in data) |
| skill7 | Debuff/Buff | Used for USER_BOMB (171) and HEAL_M (114) casts |

### MobSkill Mapping (info.skill)

| Entry | MobSkill | ID | Level | Action | skillAfter | Description |
|-------|----------|----|-------|--------|------------|-------------|
| 0 | UNDEAD | 133 | 27 | attack3 | 1760ms | Undead debuff: potion effects halved, healing deals damage. |
| 1 | BANMAP | 129 | 13 | attack1 | 990ms | Banishment: teleports 1 player to garden map (field 271041300). |
| 2 | SUMMON2 | 201 | 159 | attack2 | 1440ms | Summon: senior knights + divine bird. |
| 3 | USER_MORPH | 172 | 1 | attack4 | 1260ms | Morph: transforms player into ribbon pig. effectAfter 1260ms. |
| 4 | PMCOUNTER | 145 | 38 | attack6 | — | Attack reflect. Easy: 10s duration / 100s CD. Normal: 15s / 80s CD. Reflects to lowest-HP party member. |
| 5 | SUMMON | 200 | 222 | attack5 | 1440ms | Awakened knight summon. preSkillCount=5 (requires 5 normal knights summoned first). HP ≤20%. onlyFsm. |
| 6 | USER_BOMB | 171 | 1 | skill7 | 630ms | User bomb: marks 1 player, explodes after delay with AoE stun. effectAfter 630ms. |
| 7 | SUMMON2 | 201 | 158 | attack5 | 1440ms | Normal knight summon (one at a time, 5 total). HP ≤70%. |
| 8 | SUMMON2 | 201 | 160 | attack2 | 1440ms | Additional summon wave (green whirlwind animation). |
| 9 | HEAL_M | 114 | 43 | skill7 | 630ms | Boss heal (triggered via Shinsoo interaction). onlyFsm. |

### Difficulty Variants

| Variant | Mob ID | Level | Max HP (finalmax) | PADamage | MADamage | PDRate | MDRate |
|---------|--------|-------|-------------------|----------|----------|--------|--------|
| Easy | 8850111 | 140 | 2.1B (10.5B) | 20,000 | 25,000 | 100% | 100% |
| Normal | 8850011 | 190 | 2.1B (63B) | 30,400 | 38,400 | 100% | 100% |

### Banishment & Potion Cooldown

- **ban**: Field 271041300 (garden). Message: "Cygnus has banished you to an unknown location."
- **Potion cooldown**: 6s (map-wide debuff, both Easy and Normal).

### Related Mobs (Summons)

| ID | Name | HP (Easy) | HP (Normal) | Role |
|----|------|-----------|-------------|------|
| 8850000–8850004 | Cygnus Knights (Normal) | 1.05B | 2.1B | Knight summons (Mihile, Oz, Irena, Eckhart, Hawkeye). HP ≤70%. |
| 8850005–8850009 | Cygnus Knights (Awakened) | — | 6.3B | Normal only. All 5 at once when HP ≤20%. |
| 8850010 / 8850110 | Divine Bird (Shinsoo) | 400M | 2.1B | Grants INVINCIBLE (146) buff to Cygnus + HEAL_M (114). |
| Senior Knights A–E | — | 250M–305M | 250M–305M | Generic melee mobs, summoned via green whirlwind. |

## Data Path

CDN: `https://resource-static.msu.io/data/Mob/8850011.json`

## Effect-Only Action Rendering

`attack5` has `onlyFsm=1` but is **not a dummy sprite** — it has real 44-frame sprites (~30KB each). The `onlyFsm` flag means this attack only fires via FSM `nForceAttackIdx`, not from normal target-range detection.

| attack | onlyFsm | Sprite | Pattern | Hit Effect |
|--------|---------|--------|---------|------------|
| attack5 | 1 | **real** (44f, ~30KB each) | Dark Genesis (Awakened Summon variant) | 6f, attackAfter 3510ms |

`info.skill[]` has two entries for `action: 5`: MobSkill 200 lv222 (SUMMON — knight spawn trigger) and MobSkill 200 lv221. `attack5` doubles as both a visible Dark Genesis attack animation and an awakened knight summon trigger.

No `Etc/BossCygnus` file exists — all effects are inline in `Mob/8850011.json`.

### Web Implementation

1. **attack5**: Play body animation normally (real sprites, not dummy) — the visual is the Dark Genesis wave
2. **Hit overlay**: `attack5/info/hit/` has 6 real-PNG frames — overlay at `attackAfter: 3510ms` (delayed because the summon + cast takes time)
3. **Knight summon** (optional): spawns separate mob entities (8850005–8850009 for awakened) at server-specified positions

## Notes

- Three attacks (`attack1`, `attack5`, `attack6`) are 44 frames each — all Dark Genesis variants.
- `sleep`/`wakeup` controls dormant→active state transition (rest phase during knight summon sequence).
- MA Damage > PA Damage (38,400 vs 30,400) — primarily magic-based.
- Easy mode uses ID 8850111; Normal uses 8850011 (animation-only, stats server-side).
- All element half-resist: `P2H2F2I2S2L2D2`.
- Cygnus Knights (8850000–8850009) and Divine Bird (8850010) are separate mobs, not viewer parts.
- Mihile (knight) has its own attack reflect (separate from Cygnus PMCOUNTER).
