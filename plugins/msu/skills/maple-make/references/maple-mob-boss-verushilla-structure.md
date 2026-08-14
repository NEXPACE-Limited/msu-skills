---
name: maple-mob-boss-verushilla-structure
description: |
  Verus Hilla multi-part boss rendering: 3 parts, 3 phases with specter summons.
  Load when rendering Verus Hilla (8880405–8880409).
---

# Verus Hilla — Multi-Part Boss Rendering

Verus Hilla (진힐라) is a **3-part, 3-phase boss** with progressive specter summons. In later phases, Necro Lotus and Necro Damien appear alongside Hilla.

## Parts

| Part ID   | Label       | Role                          | noFlip |
|-----------|-------------|-------------------------------|--------|
| 8880405   | Hilla       | Verus Hilla — main boss       | 0      |
| 8880408   | NecroLotus  | Necro Lotus — specter summon  | 0      |
| 8880409   | NecroDamien | Necro Damien — specter summon | 0      |

## Phase System

| Phase | Visible Parts            | Description |
|-------|--------------------------|-------------|
| P1-P2 | Hilla                   | Solo Hilla — 10 attacks, 5 skills |
| P3    | Hilla + NecroLotus      | Necro Lotus joins as specter |
| P4    | Hilla + NecroLotus + NecroDamien | Both specters active |

## Z-Order

| Part        | zOffset | Rule |
|-------------|---------|------|
| NecroLotus  | -1      | Renders behind Hilla |
| Hilla       | 0       | Center |
| NecroDamien | +1      | Renders in front |

## Actions per Part

| Part | Actions |
|------|---------|
| Hilla (8880405) | stand(8), move(8), regen(34), attack1(21), attack2(1) ⚡, attack3(52), attack4(31), attack5(32), attack6(32), attack7(21), attack8(1) ⚡, attack9(21), attack10(1) ⚡, die1(16), hit1(1), skill1(16), skill2(9), skill3(8), skill4(8), skill5(16), skillAfter3(8), skillAfter4(1) ⚡ — ⚡effect-only (dummy sprite) |
| NecroLotus (8880408) | stand(12), move(12), regen(15), attack1(35), die1(18), hit1(1), skill1(7), skill2(26), skillAfter1(7) |
| NecroDamien (8880409) | stand(8), regen(15), attack1(14), attack2(1), die1(29), hit1(1), skill1(10), skill2(41), skillAfter1(10), skillAfter2(13) |

Frame counts in parentheses.

### Notable Actions

- **Hilla `attack3`** — 52 frames, long signature attack.
- **Hilla** has 10 attack actions — by far the largest attack set of any boss.
- **NecroLotus** acts as a melee specter (skill2 = 26 frames).
- **NecroDamien** mirrors Damien's demon form with simplified moveset.

## Data Paths

CDN base: `https://resource-static.msu.io/data/`

| Resource | CDN Path |
|----------|----------|
| Hilla JSON | `Mob/8880405.json` |
| NecroLotus JSON | `Mob/8880408.json` |
| NecroDamien JSON | `Mob/8880409.json` |
| Hilla Config JSON | `Etc/JinHillah.json` |

## Effect-Only Action Rendering

### Hilla (8880405)

Hilla has `attack2` and other attacks marked as effect-only.

### NecroDamien (8880409)

`attack2` is `onlyFsm=1` with a 1×1 dummy sprite (70B). This mirrors Damien's demon form dive attack.

| Part | attack | Paired Skill | Hit Effect | attackAfter |
|------|--------|-------------|------------|-------------|
| Hilla (8880404/405) | attack2 | skill2 | 5f real PNGs (11–15KB) | 30ms |
| NecroDamien (8880409) | attack2 | skill2 | 5f real PNGs (11–15KB) | 30ms |

MobSkill 170 lv61 — teleport-type attack.

### Effect Data Sources

`Etc/JinHillah.json` contains **configuration data only** (HP display colors, Soul Cripple level thresholds) — no animation frames or effect PNGs. There is no `Etc/BossVerusHilla` file.

Effect-only attacks use `Effect/JinHillah.img` for candle and sandglass animations (loaded by `Field_HillahRemake.cpp` via `CAnimationDisplayer::LoadLayer`), but these are **field gimmick objects**, not attack overlays.

### Web Implementation

1. **attack2 (both Hilla and NecroDamien)**: hide dummy body → play `skill2` as visible cast → overlay `attack2/info/hit/` 5f at `attackAfter` delay
2. **Candle/Sandglass** (optional): field gimmick objects from `Effect/JinHillah.img` — requires separate entity rendering, not attack overlays

## Difficulty Variants

| Mode       | Hilla | Hand | Energy | NecroLotus | NecroDamien |
|------------|-------|------|--------|------------|-------------|
| Vision     | 8880400 | 8880401 | 8880402 | 8880403 | 8880404 |
| **Hard (used)** | **8880405** | **8880406** | **8880407** | **8880408** | **8880409** |
| Dead       | 8880410 | 8880411 | 8880412 | 8880413 | 8880414 |
| Story      | 8880415 | 8880416 | 8880417 | 8880418 | 8880419 |
| Normal     | 8880450 | 8880451 | — | 8880453 | 8880454 |

## Notes

- Each difficulty tier reuses the same 5-mob offset pattern: Hilla(+0), Hand(+1), Energy(+2), Lotus(+3), Damien(+4).
- Evil Hand (8880406) and Sinister Energy (8880407) are gimmick mobs, not rendered as boss parts.
- The viewer uses Hard mode IDs (8880405/408/409) for the richest visual content.
- No HP linking between Hilla and specters — they have independent HP pools.
