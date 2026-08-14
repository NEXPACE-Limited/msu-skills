---
name: maple-mob-boss-lotus-structure
description: |
  Lotus multi-part boss rendering: 4 parts, 3 phases with form evolution.
  Load when rendering Lotus (8950000–8950006).
---

# Lotus — Multi-Part Boss Rendering

Lotus is a **4-part, 3-phase boss** where each phase uses a different mob entity representing Lotus's evolving power state. The Black Heaven Core is an additional environmental part.

## Parts

| Part ID   | Label | Role                          | noFlip |
|-----------|-------|-------------------------------|--------|
| 8950000   | Core  | Black Heaven Core (environmental) | 1 |
| 8950001   | P1    | Phase 1 — Tethered Lotus      | 0      |
| 8950002   | P2    | Phase 2 — Freed Lotus         | 0      |
| 8950006   | P3    | Phase 3 — Rampaging (placeholder) | 0  |

## Phase System

| Phase | Visible Parts | Description |
|-------|---------------|-------------|
| P1    | P1            | Tethered — attached to machine, 2 attacks + 5 skills |
| P2    | P2            | Freed — more mobile, 2 attacks + 8 skills |
| P3    | P3            | Rampaging — stand-only in data (boss=0) |
| Core  | Core          | Black Heaven Core — environmental object |

> Phase 3 (8950006) has `boss=0` and only a 1-frame `stand` action in data. In-game it may use a different rendering approach.

## Actions per Part

| Part | Actions |
|------|---------|
| Core (8950000) | stand(1) ⚡, die1(54), hit1(1) ⚡, laserAttack(0), laserAttackFront(0), regen(1) ⚡, skill1(1) ⚡, skill2(1) ⚡ — ⚡effect-only (dummy sprite) |
| P1 (8950001) | stand(8), move(8), attack1(31), attack2(1), die1(34), hit1(1), skill1(24), skill2(26), skill3(1), skill4(16), skillAfter4(16) |
| P2 (8950002) | stand(12), move(12), attack1(35), attack2(1), die1(41), hit1(1), skill1(25), skill2(8), skill3(17), skill4(26), skill5(22), skill6(1), skill7(20), skillAfter7(20) |
| P3 (8950006) | stand(1) |

Frame counts in parentheses.

## Action Descriptions

### Core (8950000)

| Action | Description |
|--------|-------------|
| stand | Idle — Core eye blinks |
| die1 | Core destruction (54 frames) |
| hit1 | Damage react |
| laserAttack | Tracking Laser side — JSON structure is `{end, hit, loop, pre}` (no numeric frame keys). `getFrameData` returns empty array → exclude from action dropdown. |
| laserAttackFront | Tracking Laser front — JSON structure is `{end, loop, pre}` (no `hit`, no numeric frame keys). No renderable frames. |
| regen | Shield regeneration pulse |
| skill1 | Saw Blade left/right — eye flash, floor sawblades rise from one side |
| skill2 | Saw Blade center — both eyes flash, sawblades rise from center |

### P1 — Phase 1 Tethered (8950001)

| Action | Description |
|--------|-------------|
| stand | Idle — Lotus tethered to Black Heaven Core |
| move | Limited movement while tethered |
| attack1 | Energy Sweep — body attack (25% fixDamR, knockback, ignoreStance, magic) |
| attack2 | Body Contact — passive FSM-only touch damage |
| die1 | Phase 1 defeat transition (34 frames) |
| hit1 | Damage react |
| skill1 | Energy Compression — TOOS(226). Gathers energy 1.38s, then blasts up or down. 35–40% damage, 2s stun |
| skill2 | Suppression Robot — BOUNCE_ATTACK(217) from center. Summons 1–3 flying chase-bots that self-destruct (15–20% damage, 4s slow) |
| skill3 | Saw Blade / Electric Field trigger — BOUNCE_ATTACK(217) + AREA_POISON(131) overlay. 1-frame data-driven trigger for left/right saw blades with electric field follow-up |
| skill4 | Shield / Mine Deploy — TELEPORT(170). 16-frame cast + 16-frame sustain |
| skillAfter4 | Post-deploy sustain animation |

**P1 Attack Array (from data):**
- attack[0]: action=attack1, fixDamR=25%, knockback, ignoreStance, magic
- attack[1]: inactive — electric field damage reference dummy (info: data-internal)
- attack[2]: action=attack2, FSM-only contact

**P1 Skill Array (from data):**
- skill[0]: skill1 → TOOS(226), level 1, skillAfter=990ms
- skill[1]: skill3 → BOUNCE_ATTACK(217), level 6
- skill[2]: skill3 → AREA_POISON(131), level 24, onlyOtherSkill, skillAfter=2000ms
- skill[3]: skill2 → BOUNCE_ATTACK(217), level 7, skillAfter=2520ms
- skill[4]: skill4 → TELEPORT(170), level 52

### P2 — Phase 2 Freed (8950002)

| Action | Description |
|--------|-------------|
| stand | Idle — Lotus freed from Core, hovering |
| move | Walk/hover movement |
| attack1 | Wire Push — body attack (40% fixDamR, knockback, ignoreStance, magic) |
| attack2 | Body Contact — passive FSM-only touch damage |
| die1 | Phase 2 defeat (41 frames), clutches head in pain |
| hit1 | Damage react |
| skill1 | Wire Discharge — TOOS(226). Blue circle → 1.14s cast → cables push enemy direction. 15–20% damage, knockback. Cooldown 3–5s |
| skill2 | Position Control Protocol — AREA_FORCE_FROM_USER(227). Blue dome → 10% damage, spawns blackhole on hit (5–10% detonation + stun 1s) |
| skill3 | Slow Barrier — AREA_ABNORMAL(211). Creates 4–8 blue barriers, passage causes 1s slow. 20–25% damage on contact |
| skill4 | Part Fall — BOUNCE_ATTACK(217). Debris falls around Lotus. 10% damage, 1s stun |
| skill5 | Bombardment Protocol — FIRE_AT_RANDOM_ATTACK(230). Sphere robot on cape fires at player every 2s for 30s. 20–30% damage |
| skill6 | Electric Field trigger — BOUNCE_ATTACK(217) + AREA_POISON(131). 1-frame data-driven trigger |
| skill7 | Teleport — TELEPORT(170). Warps to player position. Cooldown 8s |
| skillAfter7 | Post-Teleport arrival animation |

**P2 Attack Array (from data):**
- attack[0]: action=attack1, fixDamR=40%, knockback, ignoreStance, magic
- attack[1]: inactive — electric field damage reference dummy
- attack[2]: action=attack2, FSM-only contact

**P2 Skill Array (from data):**
- skill[0]: skill5 → FIRE_AT_RANDOM_ATTACK(230), level 1, skillAfter=2100ms
- skill[1]: skill6 → BOUNCE_ATTACK(217), level 13
- skill[2]: skill6 → AREA_POISON(131), level 25, onlyOtherSkill, skillAfter=2000ms
- skill[3]: skill4 → BOUNCE_ATTACK(217), level 8, skillAfter=2520ms
- skill[4]: skill1 → TOOS(226), level 2, skillAfter=660ms
- skill[5]: skill2 → AREA_FORCE_FROM_USER(227), level 1, skillAfter=600ms
- skill[6]: skill3 → AREA_ABNORMAL(211), level 13, skillAfter=810ms
- skill[7]: skill7 → TELEPORT(170), level 52

### P3 — Phase 3 Rampaging (8950006)

P3 has only `stand(1)` in sprite data. In-game Phase 3 uses separate rendering logic. Attack patterns documented from game behavior:

| Pattern | Description |
|---------|-------------|
| Gravity Push | Lateral gravity device, pushes enemy direction. 20–25% damage, knockback, 1s stun. Cooldown 5s |
| Suppression Bunker | Horizontal drill, forward then rear strike. 25–30% damage, knockback, 1s stun. Dodge by crouching |
| Omni-directional Gravity Bind | Wide-area restraint. 25–30% damage, 3s special bind (ignores status immunity). Always followed by Dark Energy |
| Dark Energy | Follows Gravity Bind. 70% damage (100% if bound). Stay close to Lotus or far away to avoid |
| Platform Destruction | Breaks upper floor into 3 debris pieces targeting players. 20–25% damage, knockback, 1s stun |
| Impact Teleport | Teleport with damage on departure and arrival. 10% each hit. Cooldown 8s |
| Cannon | Summons cannon, orange area warning, bombardment. 25–30% damage |
| Indiscriminate Bombardment | Core device fires 6–9 explosions ×3 rounds. 20–25% damage, 1s stun |

## MobSkill Mapping

| MobSkill ID | Enum Name | Usage in Lotus |
|-------------|-----------|----------------|
| 131 | AREA_POISON | Electric Field Installation — drone deploys electric field |
| 170 | TELEPORT | P1: Shield / Mine Deploy. P2/P3: Teleport to player |
| 211 | AREA_ABNORMAL | Slow Barrier Generation — blue barriers, 1s slow |
| 217 | BOUNCE_ATTACK | P1: Saw Blade / Suppression Robot. P2: Part Fall / Electric Field trigger |
| 226 | TOOS | P1: Energy Compression. P2: Wire Discharge |
| 227 | AREA_FORCE_FROM_USER | Position Control Protocol — blue dome + blackhole |
| 230 | FIRE_AT_RANDOM_ATTACK | Bombardment Protocol — cape sphere robot |

## Annihilation System

Lotus uses a unique **Annihilation Gauge** system across all phases.

- The gauge increases over time (rate varies by phase and difficulty).
- **Co-destruction patterns** (Tracking Laser, Mechanical Arm Rush, Guided Missiles) affect the gauge: player hit = gauge rises; Lotus hit = gauge drops.
- When the gauge fills → **Annihilation Mode** activates with additional Horizontal Barrage, Electric Field, and Intruder Elimination Protocol patterns.
- Phase 3 starts in permanent Annihilation Mode; co-destruction patterns hitting Lotus triggers **Safe Mode**.

| Gauge Rate (per sec) | Normal | Hard | Extreme |
|---------------------|--------|------|---------|
| Phase 1 | 0.6% | 0.8% | 2.0% |
| Phase 2 | 1.8% | 2.3% | 2.7% |
| Phase 3 | 0.0% (always active) | 0.0% | 0.0% |

## Common Map Patterns (All Phases)

| Pattern | Code | Description |
|---------|------|-------------|
| Tracking Laser | 1001/1003/1005-000 | Mechanical arms fire 2–3 lasers tracking player. 15% damage. Cooldown 10–12s |
| Small Mechanical Arm Rush | 1001/1003/1005-001 | Arms strike player position 12 times per set. 5–8% gauge per hit |
| Large Mechanical Arm Rush | Extreme only | Pattern: 10 small → 1 large → 2 small. 25% gauge per hit, 16–22% gauge reduction on Lotus |
| Horizontal Barrage | 1006/1008/1009-000 | Annihilation Mode. Creates barrier + instant-kill laser zone |
| Electric Field Installation | 1006/1008/1009-002 | Drone follows player 3s, then deploys field. Ticks every 0.36s |
| Vertical Bombardment | 1008/1009-003 | Not in P1. Red vertical targeting, 30% damage. 3–4 rounds |
| Guided Missile | 1005-002 | P3 only. Edge-launched missiles, 8% damage. 2–3 per salvo |

## Phase 1 Map Patterns

| Pattern | Code | Description |
|---------|------|-------------|
| Explosive Drop | 1007-000 | Red debris falls in 4 of 6 sectors, explodes after 3s. 40–60% damage |
| Electric Discharge | 1007-001 | Floor-wide electric pulse. Jump to avoid. 100% damage + 2s stun |

## Phase 1 Body Patterns — Shield & Mine

| Pattern | Code | Description |
|---------|------|-------------|
| Shield | 1000-006 | Blue forcefield, reduces incoming damage by 90%. Lasts ~20s. Co-destruction patterns remove shield (small arm 4–8%, laser 15–80%, large arm 50%). Cooldown 40s |
| Self-destruct Mine | 1000-007 | 6–8 floor mines. Detonate on contact (1.5s fuse) or after 5s. 20–25% damage |

## Difficulty Variants

| Difficulty | Entry Level | Defense Rate | Potion Cooldown | Death Count | Max Party |
|------------|-------------|-------------|-----------------|-------------|-----------|
| Story | Player level | 30% | - | 5 | 6 |
| Normal | 190 | 300% | 5s | 5 | 6 |
| Hard | 190 | 300% | 5s | 5 | 6 |
| Extreme | 190 | 380% | 10s | 5 | 2 |

**HP per phase (Normal / Hard / Extreme):**
- Phase 1: 472.5B / 9.99T / 543.3T (+shield every ~40s)
- Phase 2: 472.5B / 9.99T / 543.3T
- Phase 3: 630.0B / 13.31T / 724.4T

**Extreme-only changes:** Large Mechanical Arm Rush added, Small Arm Rush cycle 0.60s (from 0.80s), Annihilation Gauge fills 2.5× faster in P1.

## Data Paths

CDN base: `https://resource-static.msu.io/data/`

| Resource | CDN Path |
|----------|----------|
| Core JSON | `Mob/8950000.json` |
| P1 JSON | `Mob/8950001.json` |
| P2 JSON | `Mob/8950002.json` |
| P3 JSON | `Mob/8950006.json` |

## Related Mobs

| ID | Name | Role |
|----|------|------|
| 8950003 | Self-destructive Red | P2 summon |
| 8950004 | Self-destructive Blue | P2 summon |
| 8950005 | Self-destructive Yellow | P2 summon |
| 8950007 | Self-destructive Chaos | Chaos mode summon |
| 8950108 | Revive target | P1 revive entity |
| 8881100 | Lotus P1 (Normal/Hard/Extreme) | Live server Phase 1 variant |
| 8881101 | Lotus P2 (Normal/Hard/Extreme) | Live server Phase 2 variant |
| 8881102 | Lotus P3 (Normal/Hard/Extreme) | Live server Phase 3 variant |

## Rendering Notes

> **Core (8950000)**: `stand(1)` is ⚡effect-only — cannot be displayed as a standalone entity. The only real animation is `die1` (54 frames).
>
> **P3 (8950006)**: Only `stand(1)` exists in sprite data — effectively invisible in a game or viewer.
> Use **P1 (8950001) or P2 (8950002)** when displaying Lotus as a single character.
>
> | Use case | ID to use | Reason |
> |----------|----------|--------|
> | Single character (recommended) | **8950001** (P1) | stand 8 frames, move 8 frames, attack + skill actions |
> | Alternative | **8950002** (P2) | stand 12 frames, move 12 frames, more skill actions |

## Notes

- Core (8950000) has `noFlip = 1` and unique `laserAttack`/`laserAttackFront` actions (0 frames — possibly programmatic).
- P3 (8950006) data is a minimal placeholder; the actual Phase 3 rendering may differ in-game.
- Each phase is a completely separate mob entity — no HP linking between phases.
- P1 is tethered to the Core and stationary. P2 and P3 are mobile.
- No dedicated Field_ server file for Lotus — logic is data-driven.
