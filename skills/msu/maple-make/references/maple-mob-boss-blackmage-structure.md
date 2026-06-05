---
name: maple-mob-boss-blackmage-structure
description: |
  Black Mage multi-part boss rendering: 6 parts, 4 phases with form changes,
  HP linking. Load when rendering Black Mage (8880500–8880505).
user-invocable: true
disable-model-invocation: false
---

# Black Mage — Multi-Part Boss Rendering

Black Mage is a **6-part, 4-phase boss** with distinct visual forms per phase. Phase 1 features two knights sharing HP via `HpLinkMob` to a hidden entity; phases 2–4 are sequential form changes.

## Parts

| Part ID   | Label      | Role                          | noFlip |
|-----------|------------|-------------------------------|--------|
| 8880500   | Aion       | Phase 1 — Knight of Creation  | 0      |
| 8880501   | Yaldabaoth | Phase 1 — Knight of Destruction | 0    |
| 8880505   | Knight     | Phase 1 HP container (invisible, 1-frame stand) | 1 |
| 8880502   | Phase2     | Phase 2 — Robed Mage          | 1      |
| 8880503   | Phase3     | Phase 3 — Cosmic Form         | 0      |
| 8880504   | Phase4     | Phase 4 — Final Form          | 0      |

## HP Link System

| Mob          | HpLinkMob | Meaning |
|--------------|-----------|---------|
| 8880500 Aion       | 8880505 | Knights share HP via hidden Knight entity |
| 8880501 Yaldabaoth | 8880505 | Same — both link to 8880505 |
| 8880504 Phase4     | 8880519 | Phase 4 links HP to another hidden entity |

## Phase System

| Phase | Visible Parts       | Description |
|-------|---------------------|-------------|
| P1    | Aion + Yaldabaoth   | Two knights, paired. HP shared via 8880505 |
| P2    | Phase2              | Robed Mage — stationary, skill-based attacks |
| P3    | Phase3              | Cosmic Form — mobile, attack+skill mix |
| P4    | Phase4              | Final Form — mobile, fewer but stronger attacks |

## Z-Order

| Part(s)    | zOffset | Rule |
|------------|---------|------|
| Aion       | -1      | Left side, behind |
| Yaldabaoth | +1      | Right side, in front |
| Knight     | 0       | Hidden HP entity |
| Phase2–4   | 0       | Single entity per phase |

## Actions per Part

| Part | Actions |
|------|--------|
| Aion (8880500) | stand(16), attack1(14), attack2(45), attack3(1), attack4(48), die1(25), hit1(1), regen(40), skill1(15), skillAfter1(33) |
| Yaldabaoth (8880501) | stand(16), attack1(14), attack2(45), attack3(1), attack4(48), die1(25), hit1(1), regen(40), skill1(15), skillAfter1(33) |
| Knight (8880505) | stand(1), die1(1), hit1(1) — ⚡effect-only (dummy sprite): all actions dummy |
| Phase2 (8880502) | stand(12), skill1(37), skill2(38), skill3(39), skill4(36), skill5(36), skill6(24), die1(24), hit1(1) |
| Phase3 (8880503) | stand(20), move(20), attack1(34), skill1(20), skill2(20), skill3(20), skill4(20), die1(43), hit1(1) |
| Phase4 (8880504) | stand(20), move(20), attack1(7), skill1(14), skill2(20), die1(19), hit1(1) |

Frame counts in parentheses.

## Action → Pattern Mapping

### Aion (8880500) & Yaldabaoth (8880501) — Phase 1 Knights

| Action | Pattern | Description |
|--------|---------|-------------|
| attack1 | Chain Whip | Forward swipe, fixDamR 15%, knockback, Creation/Destruction Curse |
| attack2 | Rush / Charge | 700px forward charge, fixDamR 50%, applies curse |
| attack3 | Execution Teleport | ⚡effect-only (onlyFsm=1, dummy sprite). FSM-only trigger, teleports to other knight's position |
| attack4 | Execution Slam | Air slam, fixDamR 100%, applies curse. Also used on Wailing Wall spawn |
| regen | Shield Regeneration | Shield bar refills |
| skill1 | Teleport | MobSkill 170, reposition |
| skillAfter1 | Post-Teleport Landing | Arrival animation |

Both knights share identical attack/skill arrays. `disease=249` = Creation/Destruction curse.

Both knights share identical attack/skill arrays. `disease=249` = Creation/Destruction curse.

### Knight (8880505) — HP Container

Invisible placeholder. No attacks or skills. Pure HP link target (`hpLinkMob=8880505`).

### Phase 2 (8880502) — Robed Mage

| Action | Pattern | Description |
|--------|---------|-------------|
| skill1 | Dark Chain | Chains targeting players, 15% HP, Destruction Curse |
| skill2 | Eye of Doom | 2 tracking eyes, 5%/tick, Destruction Curse |
| skill3 | Darkness / Blind | 6s screen blackout. CD 35s |
| skill4 | Red Lightning | Map-wide, 9999%, safe zone + shield. CD 70s |
| skill5 | Shield Cast | MobSkill 136 (Barrier). skillAfter 1500ms |
| skill6 | Phase Transition | Cast animation before P3 |

No `info.attack` — all combat via FieldSkill system. Body attack: 3%.

### Phase 3 (8880503) — Cosmic Form

| Action | Pattern | Description |
|--------|---------|-------------|
| attack1 | Knockback / Slap | fixDamR 30%, Creation Curse, 3.66s cycle. Duck to dodge |
| skill1 | Absorb / Pull | Pulls players to BM position, resets aggro. CD 20s |
| skill2 | Enhanced Laser | Pink lasers, 50–60% HP, Destruction Curse |
| skill3 | Authority | 9999% instant kill + shield. CD 65s |
| skill4 | Secondary Cast | Authority/shield variant |

Zone shrinks at 67%/31% HP. Orca attacks managed by server.

### Phase 4 (8880504) — Final Form

| Action | Pattern | Description |
|--------|---------|-------------|
| attack1 | Bullet Source | Places Power Source, 10 bullet patterns, 10%/bullet by color |
| skill1 | Explosion | White/black explosions, 50% HP by color |
| skill2 | Authority | Layered lasers, 9999%, shield. CD 30s |

Players choose Creation/Destruction alignment; same-color attacks deal no damage.

## Data Paths

CDN base: `https://resource-static.msu.io/data/`

| Resource | CDN Path |
|----------|----------|
| Aion JSON | `Mob/8880500.json` |
| Yaldabaoth JSON | `Mob/8880501.json` |
| Phase2 JSON | `Mob/8880502.json` |
| Phase3 JSON | `Mob/8880503.json` |
| Phase4 JSON | `Mob/8880504.json` |
| Knight JSON | `Mob/8880505.json` |
| Boss Effects JSON | `Etc/BossBlackMage.json` |
| Boss Effects PNGs | `Etc/BossBlackMage/` |

Sprite PNGs follow: `Mob/8880500.img/{action}.{frame}.png`

## Effect-Only Action Rendering

### Phase 1 Knights — Aion (8880500) / Yaldabaoth (8880501)

`attack3` is the only `onlyFsm=1` action. Body is a 1×1 dummy sprite (70B). This is the "Execution" teleport-slash — the FSM triggers it via `nForceAttackIdx` when the knight targets a player.

| attack | Paired Skill | Pattern | Hit Effect |
|--------|-------------|---------|------------|
| attack3 | skill1 (cast) | Execution / Teleport Slash | **9f real PNGs** (38–71KB each) — renders at mob position |

`info.skill[].action: 1` → MobSkill 170, levels 62–66. The `skill1` animation is the visible cast, and `attack3/info/hit/` has substantial (real) hit effect images.

### Boss Effect Assets (`Etc/BossBlackMage`)

The C++ client loads `Etc/BossBlackMage.img` with difficulty-keyed sub-paths (`hard/`, `story/`). These control Phase 4 bullet patterns.

| Asset | Path | Content |
|-------|------|--------|
| `Bullet/effect/pre` | `Etc/BossBlackMage/Bullet/effect/pre/` | Bullet spawn fade-in, 4f 90ms (alpha 0→60) |
| `Bullet/effect/loop` | `Etc/BossBlackMage/Bullet/effect/loop/` | Bullet active loop, 8f 90ms |
| `Bullet/effect/end` | `Etc/BossBlackMage/Bullet/effect/end/` | Bullet despawn fade, 4f 90ms (alpha 255→180) |
| `Bullet/Image/1/Loop` | `Etc/BossBlackMage/Bullet/Image/1/Loop/` | Bullet type 1 projectile, 6f 60ms |
| `Bullet/Image/1/Hit` | `Etc/BossBlackMage/Bullet/Image/1/Hit/` | Bullet type 1 hit burst, 6f 60ms |
| `Bullet/Image/2/Loop` | `Etc/BossBlackMage/Bullet/Image/2/` | Bullet type 2 (same layout) |
| `hard/BulletAfterObtacleCollision/Ball` | `Etc/BossBlackMage/hard/...` | Post-collision bullet, 17f |
| `hard/BulletAfterObtacleCollision/End` | `Etc/BossBlackMage/hard/...` | Post-collision end, 10f |

Bullet patterns are Phase 4 mechanics — trajectories defined in `Bullet/Config` and `Bullet/Pattern`. Color (white/black) determines which alignment takes damage.

### Web Implementation

1. **Phase 1 attack3**: hide dummy body → play `skill1` as visible cast → overlay `attack3/info/hit/` 9f at mob position
2. **Phase 4 bullets** (optional): load `Bullet/Image/{type}/Loop` as projectile animation, `Hit` as impact. Trajectory from `Bullet/Pattern` data. Complexity: requires pattern parsing + movement simulation

## Notes

- Phase 2 (8880502) has `noFlip = 1` — never flip horizontally.
- Knight (8880505) is an invisible HP container — only 1 frame for stand/die/hit. Not rendered in viewer.
- Aion and Yaldabaoth have identical action sets (mirrored knights).
- Sub-boss mobs 8880506–8880511 are summons/effects (Red Lightning, Shrieking Wall, Kamael) — not boss parts.
- 8880512 is another Black Mage variant; 8880518 is Genesis Crux; 8880519 is another hidden HP entity.
