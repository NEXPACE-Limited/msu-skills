---
name: maple-mob-boss-vonleon-structure
description: |
  Von Leon single-part boss rendering: 1 part, 6 attacks + 7 skills + summon.
  Load when rendering Von Leon (8840000).
user-invocable: true
disable-model-invocation: false
---

# Von Leon — Single-Part Boss Rendering

Von Leon is a **single-part boss** with a large moveset: 6 attacks, 7 skills, and a summon action. He also has unique `filpL`/`filpR` directional flip animations.

## Part

| Part ID   | Name     | noFlip | bodyAttack |
|-----------|----------|--------|------------|
| 8840000   | Von Leon | 0      | 1          |

## Actions

| Action | Frames |
|--------|--------|
| stand | 6 |
| move | 18 |
| filpL | 6 |
| filpR | 6 |
| attack1 | 17 |
| attack2 | 15 |
| attack3 | 18 |
| attack4 | 34 |
| attack5 | 16 |
| attack6 | 18 |
| die1 | 90 |
| hit1 | 1 |
| skill1 | 22 |
| skill2 | 15 |
| skill3 | 15 |
| skill4 | 16 |
| skill5 | 15 |
| skill6 | 16 |
| skill7 | 16 |
| skillAfter3 | 15 |
| summon | 41 |

## Action → Pattern Mapping

| Action | Pattern | Description |
|--------|---------|-------------|
| filpL / filpR | Directional Flip | Turn left / right |
| attack1 | Double-Claw Swipe | attackRatio 200%, jump ≥224px to dodge |
| attack2 | Single-Claw Swipe / BANMAP | attackRatio 150%, knockback. Also used for BANMAP (129) cast |
| attack3 | Roar / TELEPORT | STUN (70% 3s, disease 123). Also used for TELEPORT (170) cast |
| attack4 | Shockwave Slam / SUMMON | fixDamR 100%, 7 random areas. Also used for SUMMON (200) cast |
| attack5 | Lightning Strike / PMCOUNTER | attackRatio 100%, knockback. Also used for PMCOUNTER (145) cast |
| attack6 | Eye Laser / POWERUP_M | fixDamR 70/80%, magic. Also used for POWERUP_M (105) cast |
| skill1 | (unmapped) | No info.skill mapping |
| skill2 | Prison Exile | BANMAP (129). Teleports to aerial prison. CD 5min |
| skill3 | Teleport | TELEPORT (170). Warps to highest-threat player. CD 30s |
| skill4 | Damage Reflect | PMCOUNTER (145). 7s duration, reflects 20000. HP ≤70%. CD 70s |
| skill5 | Potential Seal | DISPEL_ITEMOPTION (138). 8s duration. CD 5min |
| skill6 | Mob Consume | POWERUP_M (105). Absorbs golems, heals 1M/3M/10M. 1 use |
| skill7 | (unmapped) | No info.skill entry |
| summon | Summon | Castle Golems (lv212) or Wardens (lv213) |

### MobSkill Mapping (info.skill)

| Entry | MobSkill | ID | Level | Action | skillAfter | Description |
|-------|----------|----|-------|--------|------------|-------------|
| 0 | BANMAP | 129 | 12 | attack2 | 1200ms | Prison exile. Sends player to aerial prison (field 211070550). CD 5min. |
| 1 | TELEPORT | 170 | 1 | attack3 | — | Teleport to highest-threat player. onlyFsm. CD 30s. |
| 2 | SUMMON | 200 | 212 | attack4 | 1200ms | Castle Golem summon. HP ≤40%: 4/10/10 mobs (E/N/H). CD 5min/60s/60s. |
| 3 | PMCOUNTER | 145 | 7 | attack5 | 1320ms | Damage reflect. HP ≤70%. 7s duration. Reflects 20000 damage. CD 70s. |
| 4 | DISPEL_ITEMOPTION | 138 | 1 | skill5 (action 7) | 1200ms | Potential seal. 8s duration. CD 5min. |
| 5 | POWERUP_M | 105 | 1 | attack6 | 960ms | Mob consume + self-heal. 1 use. onlyFsm. |
| 6 | TELEPORT | 170 | 3 | attack3 | — | Teleport (duplicate, level 3). onlyFsm. CD 30s. |
| 7 | SUMMON | 200 | 213 | attack4 | 1200ms | Warden summon. HP ≤60%: 2/3/4 pairs (Boar+Rhino) (E/N/H). CD 5min/90s/90s. |

### Difficulty Variants

| Variant | Mob ID | Level | Max HP | PADamage | MADamage | PDRate | MDRate |
|---------|--------|-------|--------|----------|----------|--------|--------|
| Easy | 8840007 | 120 | 700M | 5,000 | 5,000 | 50% | 50% |
| Normal | 8840000 | 129 | 2.1B (finalmax 6.3B) | 10,000 | 10,000 | 80% | 80% |
| Hard | 8840014 | 150 | 2.1B (finalmax 10.5B) | 25,000 | 15,000 | 90% | 90% |

### Revive & Minions

- **revive**: 8840006 — Von Leon transforms after first defeat (same attacks, different fixDamR values).
- **ban**: Field 211070550 (aerial prison). Message: "You are expelled to other place because of Von Leon's power."
- **Minions**: 8840001 (Mini Castle Golem, HP 575K), 8840002 (Warden type, HP 190K), 8840003 (Warden Boar, HP 30M), 8840004 (Warden Rhino, HP 31.25M)

## Data Path

CDN: `https://resource-static.msu.io/data/Mob/8840000.json`

## Notes

- `die1` has **90 frames** — the longest death animation of any boss (cinematic death sequence).
- Has unique `filpL`/`filpR` actions for directional turning (note: typo "filp" in data, not "flip").
- `summon` (41 frames) is a dedicated minion-summoning animation.
- Category 1 (not 8) — different from most endgame bosses.
- No element resistance (`elemAttr` is empty).
