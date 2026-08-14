---
name: maple-mob-boss-hilla-structure
description: |
  Hilla single-part boss rendering: 1 part, 5 attacks + 4 skills.
  Load when rendering Hilla (8870000).
---

# Hilla — Single-Part Boss Rendering

Hilla is a **single-part boss** with 5 attack actions and 4 skill actions. This is the Easy/Normal version; Verus Hilla (진힐라) is a separate multi-part boss.

## Part

| Part ID   | Name | noFlip | bodyAttack |
|-----------|------|--------|------------|
| 8870000   | Hilla | 0     | 1          |

## Actions

| Action | Frames |
|--------|--------|
| stand | 8 |
| move | 8 |
| attack1 | 18 |
| attack2 | 15 |
| attack3 | 22 |
| attack4 | 22 |
| attack5 | 46 |
| die1 | 23 |
| hit1 | 1 |
| skill1 | 18 |
| skill2 | 18 |
| skill3 | 16 |
| skill4 | 20 |

## Action → Pattern Mapping

| Action | Pattern | Description |
|--------|---------|-------------|
| attack1 | Dark Flame / Mob Summon | Frontal dark flame (attackRatio 150%, magic). Also used for SUMMON (200) casts |
| attack2 | Staff Slam / Damage Reflect | Staff slam + knockback (fixDamR 15% Hard). Also used for PMCOUNTER (145) cast |
| attack3 | Tombstone / Area Heal | Tombstone area (fixDamR 40/50%, areaWarning 17f). Also used for HEAL_M (114) cast |
| attack4 | Lightning + STUN / Pain Mark | Lightning strike (STUN, disease 123). Also used for PAINMARK (179) cast |
| attack5 | Eraser Laser | Eraser laser (fixDamR 50/100%, areaWarning 47f) |
| skill1 | Self-Heal | HP ≤30%(N)/20%(H): heals 5M/10M HP, nearby fixed damage. CD 30s |
| skill2 | Curse Debuff | Up to 3 stacks, increases damage taken. CD 15s |
| skill3 | Potential Seal | Hard only. 8s duration. CD 5min |
| skill4 | Forced Movement | ATTRACT (Hard only). 4s duration. CD 3min |

### Hard Hilla (8870100) — Additional Attacks

Hard Hilla has 6 attack actions (attack1–6). attack5 is a faster eraser variant, attack6 replaces the original eraser.

| Action | Frames | Description |
|--------|--------|-------------|
| attack5 | 34 | Fast eraser variant. attackRatio 400%, deadlyAttack=1 (HP−1 damage). 2.40s cast. |
| attack6 | 46 | Full eraser. fixDamR 100%, type=3. Same areaWarning as Normal attack5. |

### MobSkill Mapping (info.skill)

| Entry | MobSkill | ID | Level | Action | skillAfter | Description |
|-------|----------|----|-------|--------|------------|-------------|
| 0 | PMCOUNTER | 145 | 12 | attack2 | 990ms | Damage reflect. HP ≤90%. 15s duration. Reflects 50000 damage. CD 80s. Medisa warns (Normal only). |
| 1 | HEAL_M | 114 | 58 | attack3 | 960ms | Area heal. Summons minion mobs and heals self. CD 90s (N) / 70s (H). |
| 2 | PAINMARK | 179 | 1 | attack4 | 1440ms | Pain mark debuff (Hard only). 60s duration. CD 50s. |
| 3 | SUMMON | 200 | 254 | attack1 | 1080ms | Mob summon (Deadly Alta). 1 mob, despawns after 90s. CD 90s. |
| 4 | SUMMON | 200 | 255 | attack1 | 1760ms | Mob summon (additional, level 255). |

### Server-Side Mechanics (Field_Hillah.cpp)

**HILLAH_VAMPIRIC_PACT (265, Hard only)**
- Activated at HP ≤90%. 25s duration.
- Drains summoned mobs' HP (`fDrainLifeRate`) to heal Hilla (`nHealAmountPerMob` per mob).
- Heals Hilla on any player hit (`nHealAmountByUser`).
- Forces SUMMON (200, level 256) to spawn additional mobs during drain.
- Heals from living mobs every `nHealFrequency` ms.
- Packets: `LP_Hillah_VampiricPact_Cast`, `LP_Hillah_VampiricPact_Drain_Mob`, `LP_Hillah_VampiricPact_Drain_User`.

**Hard Hilla Additional Mechanics (data-driven, not in mob JSON):**
- Ghost summon — HP ≤50%, 1 time only. 10 mobs. Hilla untargetable until all killed.
- Bloodtooth summon — HP ≤45%. 2 mobs. CD 90s.
- Life drain — Passive. Death counter increases Hilla's non-% attack damage.

## Data Path

CDN: `https://resource-static.msu.io/data/Mob/8870000.json`

## Notes

- Body attack enabled — deals contact damage.
- `attack5` (46 frames) is the eraser laser with areaWarning (47 warning frames).
- Hard Hilla (8870100) adds attack5 (fast eraser, 34f, deadlyAttack) and attack6 (full eraser, 46f), totaling 6 attacks.
- Verus Hilla (8880405+) is a separate boss with different mechanics (SoulCripple, Altar system — see `Field_HillahRemake.cpp`).
- Hard mode: HP ≤50% changes appearance. Returning above 50% via vampiric pact reverts.
- Server code: `Field_Hillah.cpp` handles Normal/Hard. `Field_HillahRemake.cpp` handles Verus Hilla.
- NPC Medisa provides in-battle `speak` / `floatNotice` announcements for major patterns.
