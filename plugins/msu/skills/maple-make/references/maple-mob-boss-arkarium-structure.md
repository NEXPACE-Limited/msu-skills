---
name: maple-mob-boss-arkarium-structure
description: |
  Arkarium single-part boss rendering: 1 part, 4 attacks + 11 skills + summon.
  Load when rendering Arkarium (8860000).
---

# Arkarium — Single-Part Boss Rendering

Arkarium is a **single-part boss** with the largest skill set among single-part bosses: 4 attacks and 11 skills plus a summon action.

## Part

| Part ID   | Name     | noFlip | bodyAttack |
|-----------|----------|--------|------------|
| 8860000   | Arkarium | 0      | 1          |

## Actions

| Action | Frames |
|--------|--------|
| stand | 6 |
| move | 6 |
| attack1 | 20 |
| attack2 | 20 |
| attack3 | 28 |
| attack4 | 23 |
| die1 | 39 |
| hit1 | 1 |
| skill1 | 20 |
| skill2 | 20 |
| skill3 | 26 |
| skill4 | 24 |
| skill5 | 33 |
| skill6 | 23 |
| skill7 | 19 |
| skill8 | 26 |
| skill9 | 18 |
| skill10 | 18 |
| skill11 | 27 |
| summon | 32 |

## Action → Pattern Mapping

| Action | Pattern | Description |
|--------|---------|-------------|
| attack1 | Cobra Shot | Forward snake charge, knockback |
| attack2 | Energy Ball | Ranged projectile, 40% HP damage |
| attack3 | Fire Brazier | Area flame columns (HP-ratio damage) |
| attack4 | Darkness Thunder | Front+rear dark lightning |
| skill1 | Physical Immunity | Blue barrier, 10s. HP < 99% |
| skill2 | Magic Immunity | Purple barrier, 20s. HP < 80% |
| skill3 | Seduce | 4s forced movement |
| skill4 | Attack Reflect | 15s reflect, 50000 damage |
| skill5 | Death Curse | +100% damage taken, stacks ×3 |
| skill6 | Summon Priests | 3× Otherworld Priest |
| skill7 | Petrification | Mash arrows to break free |
| skill8 | Mutation | Snake form 8s |
| skill9 | Potential Lock | 8s potential seal |
| skill10 | Spatial Banishment | Exile to shadow realm |
| skill11 | Spatial Collapse | 999999 damage, 5-wave pattern |
| summon | Summon Minions | Minion spawning |

## Data Path

CDN: `https://resource-static.msu.io/data/Mob/8860000.json`

## Notes

- 11 skill actions — the most of any single-part boss.
- Category 1 (like Von Leon, not 8).
- `skill11` is the signature Spatial Collapse — 5 chained waves (orbs break one by one before final wave).
- `skill5` (33 frames) is the longest skill animation (Death Curse debuff).
- `skill1`/`skill2` are two types of attack nullification barriers (physical/magic).
- Has `summon` action (32 frames) for minion spawning, separate from `skill6` (Summon Priests via MobSkill).
- On death, revives to mob 8860004 (defeated/fleeing form).
- No element resistance.
