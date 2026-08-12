---
name: maple-mob-boss-seren-structure
description: |
  Chosen Seren multi-part boss rendering: 7 parts, 2-field-phase with time-of-day
  rotation, HP linking. Load when rendering Seren (8880600–8880612).
user-invocable: true
disable-model-invocation: false
---

# Chosen Seren — Multi-Part Boss Rendering

Chosen Seren is a **7-part, 2-field-phase boss** with a unique time-of-day rotation in Phase 2. Phase 1 is a standalone entity; Phase 2 cycles through Noon → Twilight → Midnight → Dawn, each with a distinct mob. An Avatar of Nerota appears during Dawn phase.

## Parts

| Part ID   | Label    | Role                          | noFlip |
|-----------|----------|-------------------------------|--------|
| 8880600   | P1       | Phase 1 — Weakened Seren      | 0      |
| 8880602   | P2HP     | Phase 2 HP display (invisible, 1-frame) | 1 |
| 8880607   | Noon     | Phase 2 — Midday form         | 0      |
| 8880609   | Twilight | Phase 2 — Dusk form           | 0      |
| 8880612   | Midnight | Phase 2 — Twilight form       | 0      |
| 8880603   | Dawn     | Phase 2 — Dawn form           | 0      |
| 8880605   | Nerota   | Avatar of Nerota (Dawn phase only) | 0 |

## HP Link System

All time-phase mobs link HP to the central P2 HP entity:

| Mob          | HpLinkMob | Meaning |
|--------------|-----------|---------|
| 8880607 Noon     | 8880602 | Links to P2HP |
| 8880609 Twilight | 8880602 | Links to P2HP |
| 8880612 Midnight | 8880602 | Links to P2HP |
| 8880603 Dawn     | 8880602 | Links to P2HP |

## Phase System

| Phase | Visible Parts       | Description |
|-------|---------------------|-------------|
| P1    | P1                  | Weakened Seren — solo fight |
| P2 Noon | Noon              | Midday — 3 attacks, movement, skill1+skill3 |
| P2 Twilight | Twilight      | Dusk — 5 attacks, richest moveset |
| P2 Midnight | Midnight      | Twilight — 3 attacks, movement, skill3 |
| P2 Dawn | Dawn              | Dawn — 2 attacks, movement, skill1+skill3 |
| P2 Dawn+ | Dawn + Nerota    | Dawn with Avatar of Nerota summon |

> Time phases rotate in order: NOON → TWILIGHT → MIDNIGHT → DAWN → repeat.

## Z-Order

| Part(s) | zOffset | Rule |
|---------|---------|------|
| All main forms | 0 | Same depth — only one visible at a time |
| Nerota | -1 | Renders behind Dawn form |

## Actions per Part

| Part | Actions |
|------|---------|
| P1 (8880600) | stand(16), move(16), attack1(36), attack2(27), attack3(30), die1(1), hit1(1), skill1(36) |
| P2HP (8880602) | stand(1), attack1(1), die1(1), hit1(1) |
| Noon (8880607) | stand(16), move(16), attack1(36), attack2(27), attack3(22), die1(39), hit1(1), skill1(28), skill3(53) |
| Twilight (8880609) | stand(16), move(16), attack1(36), attack2(27), attack3(38), attack4(37), attack5(40), die1(39), hit1(1), skill1(16), skill3(53) |
| Midnight (8880612) | stand(16), move(16), attack1(36), attack2(27), attack3(26), die1(39), hit1(1), skill3(53) |
| Dawn (8880603) | stand(16), move(16), attack1(36), attack2(27), die1(39), hit1(1), skill1(20), skill3(53) |
| Nerota (8880605) | stand(12), move(12), attack1(30), die1(12), hit1(1), regen(12) |

Frame counts in parentheses.

## Data Paths

CDN base: `https://resource-static.msu.io/data/`

| Resource | CDN Path |
|----------|----------|
| P1 JSON | `Mob/8880600.json` |
| P2HP JSON | `Mob/8880602.json` |
| Noon JSON | `Mob/8880607.json` |
| Twilight JSON | `Mob/8880609.json` |
| Midnight JSON | `Mob/8880612.json` |
| Dawn JSON | `Mob/8880603.json` |
| Nerota JSON | `Mob/8880605.json` |

## Related Mobs (not used in viewer)

| ID | Name | Role |
|----|------|------|
| 8880601 | Area Warning Mob | P1 attack marker |
| 8880604/8/10/13 | Warning Mobs | P2 time-phase attack markers |
| 8880606 | Nerota's Power (Wisp) | Dawn phase wisp mob |
| 8880611/618/619 | Flame Pillars | Twilight phase obstacles |
| 8880614 | Seren's Treasure Chest | Drop container |

## Notes

- P2HP (8880602) is the central HP pool entity — invisible, only 1-frame states.
- Time-phase mobs all share `skill3(53)` — a long clock/transition animation.
- Normal mode uses different IDs (8880630+) with same structure.
- `skill3` appears to be the signature clock mechanic animation.
