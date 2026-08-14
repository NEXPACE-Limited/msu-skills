---
name: maple-mob-boss-darknell-structure
description: |
  Darknell single-part boss rendering: 1 part (Guard Captain Darknell 8645009),
  12 attacks + 4 skills. Load when rendering Darknell.
---

# Darknell — Single-Part Boss Rendering

Darknell (BOSS_DUNKEL) is a **single-part boss** with the largest attack set among single-part bosses (12 attacks).
Single phase with **Elite Boss** summons that scale by remaining HP%.

## Part

| Part ID   | Name                   | noFlip | bodyAttack |
|-----------|------------------------|--------|------------|
| 8645009   | Guard Captain Darknell | 0      | 0          |

## Actions

| Action | Frames |
|--------|--------|
| stand | 13 |
| move | 13 |
| regen | 32 |
| attack1 | 45 |
| attack2 | 29 | ⚡effect-only (dummy sprite) |
| attack3 | 73 |
| attack4 | 1 | ⚡effect-only (dummy sprite) |
| attack5 | 1 | ⚡effect-only (dummy sprite) |
| attack6 | 1 | ⚡effect-only (dummy sprite) |
| attack7 | 1 | ⚡effect-only (dummy sprite) |
| attack8 | 1 | ⚡effect-only (dummy sprite) |
| attack9 | 1 | ⚡effect-only (dummy sprite) |
| attack10 | 1 | ⚡effect-only (dummy sprite) |
| attack11 | 1 | ⚡effect-only (dummy sprite) |
| attack12 | 1 | ⚡effect-only (dummy sprite) |
| die1 | 30 |
| hit1 | 1 |
| skill1 | 25 |
| skill2 | 16 |
| skill3 | 24 |
| skill4 | 35 |
| skillAfter2 | 1 | ⚡effect-only (dummy sprite) |
| skillAfter4 | 29 |

## Action → Pattern Mapping

### Body Patterns (animated)

| Action | Pattern | Description |
|--------|---------|-------------|
| attack1 | Upward Slash | fixDamR 40/50%, knockback, CD 5s |
| attack2 | Downward Slam | fixDamR 45/60%, STUN 5s. Used after TELEPORT (skill4) |
| attack3 | Ultimate Sword Technique | fixDamR 120/150%, ball projectile (850px). Triggered at ≥286px distance, CD 30s |
| attack9 | Forward Dash Slash | fixDamR 60/90%, 400px teleport dash (MOBTELEPORT_DUNKEL_DASH), CD 15s |

### Elite Boss Patterns (1-frame, server-driven)

| Action | Source | Pattern | Description |
|--------|--------|---------|-------------|
| attack4 | — | Hidden hit | Shared by Kariain Orb / Zulai Sniping / Light Pillar |
| attack5 | Mokadin | Raging Blow | 5/9% ×4, STUN 4s |
| attack6 | CQ57 | Final Cut | 12/20%, DARKNESS + knockback |
| attack7 | Fled | Headshot | 20/30%, REVERSE_INPUT 2s |
| attack8 | Mokadin/Zulai | Chain | 8/10% ×6 |
| attack10 | Fled | Fist Enrage | 3/5% ×9 |
| attack11 | Kariain | Ground Chain | 6/10% ×4 |
| attack12 | CQ57 | Phantom Blow | 4/7% ×6 |

### Skills

| Action | Pattern | Description |
|--------|---------|-------------|
| skill1 | Attack Power Buff | POWERUP_M (110). Self + allies ATK up 15s, CD 60s |
| skill2 | Teleport | TELEPORT (170). Reposition only |
| skill3 | Meteor Summon | OBSTACLE_ATOM (260). 4 diagonal meteors, fixDamR 30/40%, CD 40s |
| skill4 | Teleport → Slam | TELEPORT (170) + afterAttack=attack2. Combined teleport into Downward Slam |

## Attack Details

### Body Patterns (animated, Darknell himself)

| Atk Idx | Action | Name | fixDamR (N/H) | Hits | Debuff | Notes |
|---------|--------|------|---------------|------|--------|-------|
| 0 | attack1 | Upward Slash | 40/50% | 1 | knockback (ignoreStance) | attackAfter 2280ms, range front+above, CD 5s |
| 1 | attack2 | Downward Slam | 45/60% | 1 | STUN 5s | onlyAfterAttack (follows TELEPORT skill), CD 10s |
| 2 | attack3 | Ultimate Sword Technique | 120/150% | 1 | — | ball projectile (speed 850), range 850px, triggered at ≥286px distance, CD 30s |

### Map Pattern

| Atk Idx | Action | Name | fixDamR (N/H) | Hits | Debuff | Notes |
|---------|--------|------|---------------|------|--------|-------|
| 5 | attack4 | Light Pillar | 35/40% | 1 | WEAKNESS | hidden hit animation, CD 15/12s |

### Elite Boss Patterns (programmatic 1-frame, onlyFsm)

| Atk Idx | Action | Source | Name | fixDamR (N/H) | Hits | Debuff | Notes |
|---------|--------|--------|------|---------------|------|--------|-------|
| 3 | attack5 | Mokadin | Raging Blow | 5/9% | ×4 | STUN 4s | multi-hit stun, highest priority to dodge |
| 4 | attack4 | Kariain | Orb | 15/25% | ×1 per tick | SLOW 5s | slow orb, hidden hit |
| 6 | attack6 | CQ57 | Final Cut | 12/20% | ×1 | DARKNESS + knockback | attach=1 |
| 7 | attack7 | Fled | Headshot | 20/30% | ×1 | REVERSE_INPUT 2s | target markers on ground |
| 8 | attack8 | Mokadin/Zulai | Chain | 8/10% | ×6 | — | spawns at player position in air |
| 9 | attack9 | Darknell | Forward Dash Slash | 60/90% | ×1 | — | MOBTELEPORT_DUNKEL_DASH (400px teleport), dodge by crouching, CD 15s |
| 10 | attack10 | Fled | Fist Enrage | 3/5% | ×9 | — | near-instant, semi-one-shot with Phantom Blow |
| 11 | attack11 | Kariain | Ground Chain | 6/10% | ×4 | — | small chains on ground |
| 12 | attack12 | CQ57 | Phantom Blow | 4/7% | ×6 | — | near-instant, semi-one-shot with Fist Enrage |

### Skills

| Skill Idx | Action | MobSkill | Name | Notes |
|-----------|--------|----------|------|-------|
| 0 | skill1 | POWERUP_M (110) lv16 | Attack Power Buff | buffs self + nearby Corrupted Warriors for 15s, CD 60s |
| 1 | skill4 | TELEPORT (170) lv63 | Teleport → Downward Slam | afterAttack=attack2, skillForbid 5000ms |
| 2 | skill2 | TELEPORT (170) lv77 | Teleport (reposition) | no afterAttack, skillForbid 5000ms |
| 3 | skill3 | OBSTACLE_ATOM (260) lv1 | Meteor Summon | 4 diagonal slow-falling meteors, fixDamR 30/40%, CD 40s |
| 4 | skill3 | OBSTACLE_ATOM (260) lv3 | Meteor Summon (variant) | same animation, different cooltime ratio |

## Elite Boss Summon Scaling

Elite Boss summons accompany Darknell's own attacks. Count scales by HP%:

| Mode | HP ≥ 66% | 33–66% | HP < 33% |
|------|----------|--------|----------|
| Normal | max 1 | max 2 | max 3 |
| Hard | max 2 (HP≥51%) | max 3 (HP<51%) | max 3 |

Elite Bosses: Mokadin (Warrior), Kariain (Mage), Zulai (Archer), CQ57 (Thief), Fled (Pirate).
Each uses one of two patterns per appearance. They only appear when Darknell attacks (not during Bind).

## Data Path

CDN: `https://resource-static.msu.io/data/Mob/8645009.json`

## Difficulty Variants

| Mode | Darknell ID | Elite Boss IDs | Has Actions |
|------|-------------|----------------|-------------|
| Normal | **8645009** | 8645004–8645008 | ✅ |
| Hard | 8645066 | (same AI, 6× HP) | ❌ (empty, uses Normal data) |
| Story | 8645039 | 8645034–8645038 | ✅ (pre-rework patterns) |

## Related Mobs

| ID | Name | Role |
|----|------|------|
| 8645004 | Elite Boss 1 (Mokadin) | Warrior class |
| 8645005 | Elite Boss 2 (Kariain) | Mage class |
| 8645006 | Elite Boss 3 (Zulai) | Archer class |
| 8645007 | Elite Boss 4 (CQ57) | Thief class |
| 8645008 | Elite Boss 5 (Fled) | Pirate class |
| 8645013/044 | Luminous Giant | Giant summon entity |
| 8645010–8645012 | Ancestion/Ascendion/Transcendion | Gimmick mobs |
| 8645015–8645017 | Seeds of Life | Phase mechanic objects |
| 8645045–8645047 | Weakened BM Knights | Story mode reference mobs |
| 8645060–8645063 | Red Lightning/Kamael | BM-style summons |

## Notes

- `attack3` (73 frames) is the longest single attack in the entire boss roster.
- attacks 4–12 are all 1-frame — programmatic/effect-driven attacks controlled by server FSM.
- Hard mode (8645066) has **no actions** in data; same visuals as Normal, only HP differs.
- Forward Dash Slash (attack9) uses `MOBTELEPORT_DUNKEL_DASH` (teleport type 77) for 400px lunge.
- "One-punch" combo: Phantom Blow (4%×6) + Fist Enrage (3%×9) = up to 87% HP in Hard mode.
- Darknell only uses Ultimate Sword Technique when player is ≥286px away.
- Corrupted Warriors are separate summon mobs, not part of Darknell's attack table.
- `die1` has a 100% chance to speak: "My lord... I apologize..."
