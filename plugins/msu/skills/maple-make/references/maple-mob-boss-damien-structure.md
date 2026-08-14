---
name: maple-mob-boss-damien-structure
description: |
  Damien multi-part boss rendering: 2 parts, 2 phases (human→demon transform).
  Load when rendering Damien (8880100–8880101).
---

# Damien — Multi-Part Boss Rendering

Damien is a **2-part, 2-phase boss** with a human-to-demon transformation between phases. Each phase is a completely separate mob entity. Phase transition occurs when HP drops to 30% or the cumulative Stigma death count reaches 7.

## Parts

| Part ID   | Label | Role                   | noFlip |
|-----------|-------|------------------------|--------|
| 8880100   | Human | Phase 1 — Human form   | 0      |
| 8880101   | Demon | Phase 2 — Demon form   | 0      |

## Phase System

| Phase | Visible Parts | Description |
|-------|---------------|-------------|
| P1    | Human         | Human Damien — 6 attacks, 4 skills, directionAct cutscene. No bodyAttack. |
| P2    | Demon         | Demon Damien — 7 attacks, 11 skills. bodyAttack=1, mobZone, Abyss Crystal zones. |

## Actions per Part

| Part | Actions |
|------|--------|
| Human (8880100) | stand(8), hit1(1), die1(1), directionAct1(102), attack1(43), attack2(1), attack3(8), attack4(1), attack5(1), attack6(1), skill1(11), skill2(160), skill3(44), skill4(45), skillAfter1(16), skillAfter3(16), skillAfter4(16) |
| Demon (8880101) | stand(8), hit1(1), die1(29), attack1(14), attack2(1), attack3(41), attack4(8), attack5(1), attack6(1), attack7(21), skill1(10), skill2(56), skill3(41), skill4(10), skill5(178), skill6(10), skill7(10), skill8(127), skill9(55), skill10(8), skill11(8), skillAfter1(13), skillAfter2(7), skillAfter3(13), skillAfter4(13), skillAfter6(13), skillAfter9(13) |

Frame counts in parentheses.

## Action → Pattern Mapping — Phase 1 (Human, 8880100)

### Attacks

| Animation | Frames | Pattern | Data |
|-----------|--------|---------|------|
| `attack1` | 43 | Smoke Explosion — casts dark smoke zones across the map; zones explode after 2.73s | fixDamR=100%, cooltime=10000, magic=1, disease=237 |
| `attack2` | 1 | ⚡effect-only (onlyFsm=1, dummy sprite). Dive impact — diagonal dive landing hit, causes knockback and adds Stigma | fixDamR=100%, knockback=1, ignoreStance=100, disease=237 |
| `attack3` | 8 | Binding Hand — QTE stun from above; player must input directional keys to escape | fixDamR=50%, disease=174 (stun), cooltime=30000, magic=1 |
| `attack4` | 1 | ⚡effect-only (onlyFsm=1, dummy sprite). Dark Thrust — teleport-slash forward; also used as Sword of Destruction weak hit (15%) | fixDamR=100%/15% (dual entry), knockback=1, disease=237 |
| `attack5` | 1 | ⚡effect-only (onlyFsm=1, dummy sprite). (Unused by attack info — animation-only placeholder) | — |
| `attack6` | 1 | ⚡effect-only (onlyFsm=1, dummy sprite). Meteor Shower — rains projectiles from the air | fixDamR=90%, magic=1 |

### Skills

| Animation | Frames | Pattern | Data |
|-----------|--------|---------|------|
| `skill1` | 11 | Teleport — vanishes and reappears at a random target's position | MobSkill 170 lv44, skillForbid=3420 (3.42s) |
| `skill2` | 160 | Awakening / Phase Transition — long cutscene animation when entering Phase 2 | MobSkill 215 lv2 |
| `skill3` | 44 | Dive ascent — rises into the air before the diagonal dive attack | MobSkill 170 lv46, skillForbid=5610 |
| `skill4` | 45 | Meteor Shower ascent — ascends to rain meteors | MobSkill 170 lv45, skillForbid=5700 |

### Other

| Animation | Frames | Description |
|-----------|--------|-------------|
| `stand` | 8 | Idle |
| `hit1` | 1 | Damage flinch |
| `die1` | 1 | ⚡effect-only (dummy sprite). Phase transition trigger — Human→Demon transition |
| `directionAct1` | 102 | Entry cutscene — plays upon boss encounter start |
| `skillAfter1` | 16 | Recovery after Teleport |
| `skillAfter3` | 16 | Recovery after Dive |
| `skillAfter4` | 16 | Recovery after Meteor Shower |

## Action → Pattern Mapping — Phase 2 (Demon, 8880101)

### Attacks

| Animation | Frames | Pattern | Data |
|-----------|--------|---------|------|
| `attack1` | 14 | Rush — fast forward charge with sword, causes knockback and Stigma | fixDamR=70%, rush=1, rushSpeed=3000, cooltime=7000, disease=237 |
| `attack2` | 1 | ⚡effect-only (onlyFsm=1, dummy sprite). Dive impact — upgraded landing hit, now an instant-kill tier | fixDamR=100%, disease=237 |
| `attack3` | 41 | Flame Storm — fires 20 flame orbs left and right in 5 waves | fixDamR=60%, bulletPattern=2, bulletSpeed=220, cooltime=20000, disease=237 |
| `attack4` | 8 | Binding Hand — same QTE stun as Phase 1 | fixDamR=50%, disease=174 (stun), cooltime=30000, magic=1 |
| `attack5` | 1 | ⚡effect-only (onlyFsm=1, dummy sprite). Sword of Destruction weak hit — auxiliary flying sword damage | fixDamR=15% |
| `attack6` | 1 | ⚡effect-only (onlyFsm=1, dummy sprite). Meteor Shower — fires red energy projectiles from the air | fixDamR=90%, magic=1 |
| `attack7` | 21 | World Tree Rampage blast — full-screen explosion if Rampage is not prevented | fixDamR=200%, disease=237 |

### Skills

| Animation | Frames | Pattern | Data |
|-----------|--------|---------|------|
| `skill1` | 10 | Teleport to target — vanishes with a shout, reappears at random target | MobSkill 170 lv44, skillForbid=3420 |
| `skill2` | 56 | Dive ascent — rises into the air before the diagonal dive | MobSkill 170 lv42, skillForbid=5640 |
| `skill3` | 41 | Sword of Destruction dash — dashes forward leaving 3 slash marks in the air | MobSkill 170 lv47, skillForbid=5640 |
| `skill4` | 10 | Teleport to left — silently warps to the left side of the map | MobSkill 170 lv48, skillForbid=3390 |
| `skill5` | 178 | Awakening cutscene — plays during Phase 2 entry transformation | MobSkill 215 lv4, onlyFsm=1 |
| `skill6` | 10 | Teleport to left B — secondary silent left-side teleport | MobSkill 170 lv49, skillForbid=3390 |
| `skill7` | 10 | Sword of Destruction appear — emerges from vanish to begin slash combo | MobSkill 170 lv50, skillForbid=1080 |
| `skill8` | 127 | World Tree Rampage cast — charges power at left side of map; players must deal damage to prevent blast | MobSkill 214 lv14, onlyFsm=1 |
| `skill9` | 55 | World Tree Rampage groggy — stunned state after Rampage is prevented | MobSkill 170 lv51, onlyFsm=1, skillForbid=6280 |
| `skill10` | 8 | Abyss Crystal spawn — short cast to create a tracking crystal zone | MobSkill 201 lv182 |
| `skill11` | 8 | Abyss Crystal enlarge — expands existing crystal zone size | MobSkill 201 lv183 |

### Other

| Animation | Frames | Description |
|-----------|--------|-------------|
| `stand` | 8 | Idle |
| `hit1` | 1 | Damage flinch |
| `die1` | 29 | Death — demon aura dissipates, wings disappear, Damien collapses |
| `skillAfter1` | 13 | Recovery after Teleport to target |
| `skillAfter2` | 7 | Recovery after Dive |
| `skillAfter3` | 13 | Recovery after Sword of Destruction dash |
| `skillAfter4` | 13 | Recovery after Teleport to left |
| `skillAfter6` | 13 | Recovery after Teleport to left B |
| `skillAfter9` | 13 | Recovery after World Tree Rampage groggy |

## Key Mechanics

- **Stigma** — Periodic marking every 28s (HP > 50%) or 18s (HP ≤ 50%). 7 marks = instant death ignoring revival. Cleansable at World Tree Altar. Certain attacks (Dive, Rush, Flame Storm, Smoke Explosion, Sword of Destruction) add extra Stigma on hit.
- **Sword of Destruction** — P1 only: a large flying sword roams the map (15% contact damage), locks onto targets, then plants into the ground creating Contaminated Zones (90% damage per explosion ×5). Small swords spawn per Stigma death.
- **Abyss Crystal** — P2 only: tracking crystal zones follow players. Standing inside reduces damage dealt to 10% and inflicts DoT. Grows larger and spawns a second crystal as Damien's HP decreases. Disappears during Bind.
- **World Tree Rampage** — P2 only at HP ≤ 15%: Damien warps left and begins charging. Players are petrified + knocked back. Must deal enough damage within 10s to prevent a 200% full-screen blast. Success puts Damien in groggy for ~4.4s. Cooltime 120s.
- **Binding Hand** — Both phases: spheres appear overhead, then hands descend to stun. Directional QTE to escape. Cooltime 30s.
- **disease=237** — Adds Stigma on hit. **disease=174** — Stun.

## Data Paths

CDN base: `https://resource-static.msu.io/data/`

| Resource | CDN Path |
|----------|----------|
| Human JSON | `Mob/8880100.json` |
| Demon JSON | `Mob/8880101.json` |
| Boss Effects JSON | `Etc/BossDemian.json` |
| Boss Effects PNGs | `Etc/BossDemian/` |

## Effect-Only Action Rendering

### Human Phase (8880100)

`attack2`, `attack4`, `attack5`, `attack6` are all `onlyFsm=1` with 1-frame 1×1 dummy sprites (70B placeholders). The visible animation comes from the paired skill action.

| attack | Paired Skill | Pattern | Hit Effect | attackAfter |
|--------|-------------|---------|------------|-------------|
| attack2 | skill3 (Dive) | Dive/Swooping Strike | 5f real PNGs (9–16KB) | 30ms |
| attack4 | skill1 (Teleport) | Ground → Teleport | none | 30ms |
| attack5 | — | Impact Frame | none | 30ms |
| attack6 | skill4 (Meteor) | Meteor Shower Ascent | none | 30ms |

Skill mapping: `info.skill[].action` value matches `attackN`'s N. MobSkill 215 (lv2) for attack2 (Dive), MobSkill 170 (lv44–46) for others.

### Demon Phase (8880101)

`attack2`, `attack5`, `attack6` are dummy (70B). `attack3` and `attack7` have `onlyFsm=1` but **real sprites** (157–256KB) — the body animation plays normally.

| attack | Sprite | Paired Skill | Pattern | Hit Effect | attackAfter |
|--------|--------|-------------|---------|------------|-------------|
| attack2 | dummy | skill2 (Dive) | Dive/Swooping Strike | 5f real PNGs | 30ms |
| attack3 | **real** (multi-frame) | skill3 (Flame Storm) | Flame Storm | 6f real PNGs | 480ms |
| attack5 | dummy | skill5 (Sword Slash) | Sword of Destruction | none | 30ms |
| attack6 | dummy | skill6 | Impact/Sword Sweep | none | 30ms |
| attack7 | **real** (multi-frame) | skill7 | Charge/Rush Attack | 5f (placeholder check needed) | 510ms |

### Boss Effect Assets (`Etc/BossDemian`)

Effects loaded by the client via server packets (`LP_DemianFlyingSwordCreate` etc.). The C++ code specifies the UOL path dynamically — no fixed attack→effect mapping in client code.

| Asset | Path | Content |
|-------|------|--------|
| `flyingSword/` | `Etc/BossDemian/flyingSword/` | Original Sword: stand(8f), move(8f), create(14f), remove(11f), particle(4 variants), lockon_create(15f), lockon_loop(14f) |
| `flyingSword2/` | `Etc/BossDemian/flyingSword2/` | Replica Sword: same sub-structure as flyingSword |

Flying Sword is a persistent field object (not tied to a single attack). It stands/moves independently, locks onto targets, then attacks. Rendering requires spawn/move/remove lifecycle, not a single overlay.

### Web Implementation

1. **effect-only attacks (dummy)**: `attack2/4/5/6` (Human), `attack2/5/6` (Demon) → hide body, play paired `skillN` as visible cast
2. **effect-only attacks (real sprite)**: `attack3/7` (Demon) → play body animation normally (onlyFsm just means FSM-triggered, not invisible)
3. **Hit overlay**: attack2 (both phases) and attack3 (Demon) have real hit PNGs → overlay at `attackAfter` delay
4. **Flying Sword** (optional): requires independent animated entity from `Etc/BossDemian/flyingSword/` with state machine (stand→move→lockon→attack→remove)

## Related Mobs

| ID | Name | Role |
|----|------|------|
| 8880102 | Shadow Zone | Abyss Crystal inner zone entity (cat=1) |
| 8880103 | Damien | Revive variant |
| 8880110/111 | Normal Damien P1/P2 | Normal difficulty |
| 8880130/131 | Easy Damien P1/P2 | Easy difficulty |

## Notes

- 1-frame attacks (attack2, attack4–6 in P1; attack2, attack5–6 in P2) are server-driven impact frames — the visual animation is handled by the preceding skill animation.
- Skill–Attack pairs: `skill3 → attack2` (Dive), `skill4 → attack6` (Meteor) in P1. `skill2 → attack2` (Dive), `skill3 → attack5` (Sword slash) in P2.
- `onlyFsm=1` skills (skill5, skill8, skill9 in P2) are FSM-only transitions that cannot be interrupted by normal gameplay.
- Phase 2 `mobZone` provides environmental hazard data for Abyss Crystal visual areas.
- No HP linking between phases — each mob entity manages its own HP.
