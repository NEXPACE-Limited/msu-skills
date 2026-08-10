---
name: maple-mob-boss-lucid-structure
description: |
  Lucid multi-part boss rendering: 2 parts, 2–3 phases (dream→awakened→fury).
  Load when rendering Lucid (8880140, 8880150).
user-invocable: true
disable-model-invocation: false
---

# Lucid — Multi-Part Boss Rendering

Lucid is a **2-part, 2-phase boss** (3 phases in Hard mode) with a dream-to-awakened transformation.
Phase 1 uses a stationary "Dreaming Lucid" (꿈속의 루시드) form; Phase 2 is a mobile flying form.
Hard mode adds Phase 3 — a 45-second DPS-check "Fury" state reusing the Phase 2 model.

## Parts

| Part ID | Label  | Role                     | noFlip |
|---------|--------|--------------------------|--------|
| 8880140 | Dream  | Phase 1 — Dreaming Lucid | 1      |
| 8880150 | Awaken | Phase 2 — Awakened Lucid | 0      |

## Phase System

| Phase | Visible Parts | Description |
|-------|---------------|-------------|
| P1    | Dream         | Dreaming Lucid — stationary, noFlip, skill-based attacks |
| P2    | Awaken        | Awakened Lucid — flying, mobile, 6 attacks + 6 skills |
| P3 (Hard only) | Awaken | Fury — stationary at center, DPS-check (45 s timer) |

## Actions per Part

| Part | Actions |
|------|---------|
| Dream (8880140) | stand(8), attack1(1), attack2(1), attack3(1), attack4(1), attack5(1), die1(32), hit1(1), skill1(35), skill2(25), skill3(19), skill4(18), skill5(1) |
| Awaken (8880150) | fly(16), attack1(1), attack2(1), attack3(1), attack4(1), attack5(1), attack6(1), die1(34), hit1(1), skill1(36), skill2(24), skill3(19), skill4(29), skill5(62), skill6(15) |

Frame counts in parentheses.

## Action → Pattern Mapping

Attack actions (`attack1`–`attack6`) are **1 px transparent dummy sprites** (server-trigger-only poses with no visible animation). The actual cast animations are in the corresponding `skill` actions. Each `info.skill[].action` value selects which attack action to pair with; `info.skill[].level` identifies the server skill level (SLV). The `info` label in data is the canonical pattern name.

**Attack → Skill animation mapping:**

| Phase 1 (Dream) | Phase 2 (Awaken) | Visible Animation |
|------------------|------------------|-------------------|
| attack1 → skill1 | attack1 → skill1 | Fairy Dust cast |
| attack2 → skill2 | attack2 → skill2 | Dragon Breath cast |
| attack3 → skill3 | attack3 → skill3 | Butterfly / Golem / Bomb cast |
| attack4 → skill4 | attack4 → skill4 | Forced Teleport (P1) / Phantom Barrage (P2) cast |
| attack5 (no skill) | attack5 → skill5 | Butterfly Swarm (P1) / Rend Reverie (P2) cast |
| — | attack6 → skill6 | Nightmare Rush cast |

### Dream — Phase 1 (8880140)

| Action | info.attack[].info | info.skill[].info | SLV | Pattern Description |
|--------|--------------------|-------------------|-----|---------------------|
| **attack1** | Dummy / Fairy Dust | Fairy Dust | 4 (FAIRYDUST) | ⚡effect-only (onlyFsm=1, dummy sprite). Rises up, fires crescent-shaped blades radially. fixDamR 30 %. Hit adds 1 background butterfly. |
| **attack2** | Dragon | Dragon | 7 (DRAGONBREATH) | ⚡effect-only (onlyFsm=1, dummy sprite). Plays flute motion; dragon descends from random side and breathes across the map. fixDamR 100 %. |
| **attack3** | Stone Troll | Golem (×10 variants, SLV 196–209), Butterfly (SLV 197), Poison Mushroom (SLV 198), Infection (SLV 12) | varies | ⚡effect-only (onlyFsm=1, dummy sprite). Shared cast animation for multiple summon / debuff skills. Golem = Sentinel of Nightmare; Butterfly = Phantasmal Waltz; Infection = Bomb (Contagion debuff). |
| **attack4** | Forced Teleport | Forced Teleport | 6 (TELPORTUSER) | ⚡effect-only (onlyFsm=1, dummy sprite). Generates orb then detonates; teleports each player to a random portal. skillAfter 900 ms. |
| **attack5** | Butterfly Swarm | *(map pattern)* | — | ⚡effect-only (onlyFsm=1, dummy sprite). Butterfly Swarm — 40 accumulated background butterflies fire 120 projectiles tracking players. fixDamR 20 %. Triggered by butterfly counter, not a regular skill cycle. |

**Skill animations** (longer cast sequences used by the above patterns):

| Animation | Frames | Used by |
|-----------|--------|---------|
| skill1 | 35 | Fairy Dust cast (main visible attack animation) |
| skill2 | 25 | Dragon Breath cast / generic long cast |
| skill3 | 19 | Golem / Butterfly / Mushroom summon cast |
| skill4 | 18 | Forced Teleport cast |
| skill5 | 1  | Generic instant trigger |

**Phase 1 map objects:**
- **Illusion Bloom** — flower explosions along straight lines; a map-pattern (continues even while bound). fixDamR 20/30/30 %.
- **Horn Object** (나팔 동상) — interactable object; press harvest key to clear background butterflies. Max 3 stored charges, +1 per HP bar depleted.

### Awaken — Phase 2 (8880150)

| Action | info.attack[].info | info.skill[].info | SLV | Pattern Description |
|--------|--------------------|-------------------|-----|---------------------|
| **attack1** | Fairy / Dummy | Fairy Dust | 10 (FAIRYDUST_2PHASE) | ⚡effect-only (onlyFsm=1, dummy sprite). Faster crescent blades, 6–8 random directions. fixDamR 51 % (Normal/Hard). |
| **attack2** | Dragon | Dragon | 7 (DRAGONBREATH) | ⚡effect-only (onlyFsm=1, dummy sprite). Dragon moves vertically and breathes. fixDamR 100 %. Safe spots: top-left, top-right, bottom portal platform. |
| **attack3** | Stone Troll / Laser Streak | Butterfly (SLV 199), Infection (SLV 12) | varies | ⚡effect-only (onlyFsm=1, dummy sprite). Shared cast for Butterfly summon and Bomb. Sentinel of Nightmare in P2 is a map pattern (breakable footholds), not a direct mob skill. |
| **attack4** | Illusion Bullet Hail | Illusion Bullet Hail | 9 (ILLUSIONFIRE) | ⚡effect-only (onlyFsm=1, dummy sprite). Phantom Barrage — Lucid + butterflies gather center, fires spiral/bidirectional bullet patterns across the full map for ~22 s. Footholds removed; players can fly. fixDamR 33/51/100 %. stopByBind. skillForbid 23360 ms. |
| **attack5** | *(reuses attack info)* | Laser Streak | 5 (LASERRAIN) | ⚡effect-only (onlyFsm=1, dummy sprite). Rend Reverie — Lucid turns red, vanishes for ~16 s, fires aimed lasers 15× at 0.5 s intervals from background. fixDamR 34/34/51 %. stopByBind. skillForbid 19050 ms. After return, 3 s idle = deal window. |
| **attack6** | Charge | Charge | 8 (RUSHLUCID) | ⚡effect-only (onlyFsm=1, dummy sprite). Nightmare Rush — Lucid vanishes, reappears center, flies two laps in a fixed orbit for ~13 s. fixDamR 50/70/100 %. stopByBind. skillForbid 13680 ms. skillAfter 960 ms. |

**Skill animations** (longer cast sequences):

| Animation | Frames | Used by |
|-----------|--------|---------|
| skill1 | 36 | Fairy Dust cast |
| skill2 | 24 | Dragon Breath cast |
| skill3 | 19 | Butterfly / Bomb cast |
| skill4 | 29 | Illusion Bullet Hail (Phantom Barrage) cast |
| skill5 | 62 | Rend Reverie (Laser Streak) — longest animation |
| skill6 | 15 | Nightmare Rush (Charge) cast |

**Phase 2 mechanics:**
- Uses `fly` (16 frames) as idle instead of `stand`.
- `flyingMove` data defines 11 movement path patterns (destination, velocity, angles).
- Breakable footholds — Sentinel of Nightmare golems drop onto platforms, destroying them temporarily.
- Hard mode: falling below platforms deals 50 % current HP and applies 6 s recovery seal ("꿈에서 추락한 자").

### Phase 3 — Fury (Hard Only)

Reuses Awaken (8880150) model, positioned at map center. No regular attack patterns.

- **Full-range attack** — periodic HP-proportional 30 % damage to all players. Not dodgeable.
- **Sentinel of Nightmare** — golems continue spawning on the same Phase 2 schedule.
- **Recovery** — at <20 % HP (below 2 bars), randomly heals 5 % HP.
- **Bind immunity** — immune to regular bind; vulnerable to absolute-bind only.
- Timer: 45 s displayed, effective deal time ~40.48 s (entry animation takes ~4.52 s).
- Failure: returns to Phase 2 with 16 % HP restored, Phase 3 HP resets to full.

## Server Skill Mapping Reference

| SLV | Constant | Pattern |
|-----|----------|---------|
| 1 | FLOWEREXPLOSION_1 | Illusion Bloom variant 1 |
| 2 | FLOWEREXPLOSION_2 | Illusion Bloom variant 2 |
| 3 | FLOWEREXPLOSION_3 | Illusion Bloom variant 3 |
| 4 | FAIRYDUST | Fairy Dust (Phase 1) |
| 5 | LASERRAIN | Rend Reverie / Laser Streak |
| 6 | TELPORTUSER | Forced Teleport |
| 7 | DRAGONBREATH | Illusion Dragon breath |
| 8 | RUSHLUCID | Nightmare Rush / Charge |
| 9 | ILLUSIONFIRE | Phantom Barrage / Illusion Bullet Hail |
| 10 | FAIRYDUST_2PHASE | Fairy Dust (Phase 2) |
| 11 | TELPORTUSER_EASY | Forced Teleport (Easy) |
| 12 | BOMB_WITH_OBJECT | Bomb / Infection (Contagion) |

## Butterfly System

Background butterflies accumulate over time and upon Fairy Dust hits.

| HP Range | Spawn Interval |
|----------|----------------|
| 100–90 % | 5.0 s |
| 90–70 % | 4.5 s |
| 70–50 % | 4.0 s |
| 50–20 % | 3.0 s |
| < 20 % | 2.0 s |

Threshold: 40 butterflies → triggers Butterfly Swarm (P1) or Phantom Barrage (P2).

Weather messages at 30 butterflies (warning), and at 76 %, 51 %, 26 % boss HP.

## Effect-Only Action Rendering

All `attack1`–`attack6` in both phases are **effect-only** (`onlyFsm=1`). Their body sprites are 4×4 px dummies — rendered by C++ but invisible. The actual visual representation comes from **three separate sources**:

### Rendering Sequence

1. **FSM triggers attack action** → body transitions to attack frame (4×4 dummy, invisible)
2. **Skill animation plays** → FSM triggers the paired `skill{N}` action as the visible mob body cast animation
3. **Attack effects render** → separate effect layers from `Etc/BossLucid.img` and `Mob/{id}/attackN/info/hit/`

### Effect Data Sources

Lucid's attack effects are **NOT inside `Mob/8880140.img`** — they are in a dedicated `Etc/BossLucid.img` (exported as `Etc/BossLucid.json` + `Etc/BossLucid/` PNGs). This is the boss-specific effect pattern: high-tier bosses store effects in `Etc/Boss{Name}.img` rather than in `Mob/*.img/attackN/info/effect/`.

| Layer Type | Source | Description |
|------------|--------|-------------|
| **body (dummy)** | `Mob/{id}/attackN/0.png` | 4×4 px dummy — skip or hide |
| **skill anim** | `Mob/{id}/skillN/0~F.png` | Visible mob cast animation, already in Mob JSON |
| **hit effect** | `Mob/{id}/attackN/info/hit/0~N.png` | Per-attack hit effect, in Mob JSON (`info.hit`) |
| **boss effects** | `Etc/BossLucid.json` + `Etc/BossLucid/` | Pattern-specific projectile, dragon, laser, rush, etc. |
| **MobSkill params** | `Skill/MobSkill/238.img`, `201.img` | Trajectory/timing params (e.g. ball angles, circle coords). MobSkill 238 lv4 has ball canvas for Fairy Dust |

### Pattern → Effect Asset Mapping

| Pattern | attack | skill anim | Hit Effect | BossLucid Effect | MobSkill |
|---------|--------|------------|------------|------------------|----------|
| **Fairy Dust** | attack1 | skill1 (35f/36f) | `attack1/info/hit/` 12f 75ms | `Shoot/ball/` 4f (projectile), `Shoot/hit/` 6f, `Shoot/info/action/` pre/loop/end (lucid + butterfly sub-layers) | 238 lv4: ball0~2 canvas (284×264), Circle0~2 trajectory |
| **Dragon Breath** | attack2 | skill2 (25f/24f) | `attack2/info/hit/` 6f | `Dragon/phase1/action/0` 10f (appear), `Dragon/phase1/action/1` 36f (fly), `Dragon/phase1/breath/` 6f, `DragonShadow/action/` | 238 lv7: metadata only |
| **Golem/Butterfly/Bomb** | attack3 | skill3 (19f) | `attack3/info/hit/` 1f | `Butterfly/butterflies/` 9 variants × 5 states, `Butterfly/butterfly/0/bomb` 13f | 201 lv196~209 (summon) |
| **Forced Teleport** | attack4 | skill4 (18f/29f) | `attack4/info/hit/` 1f | — | 238 lv6 |
| **Butterfly Swarm** (P1) | attack5 | — | `attack5/info/hit/` 1f | `Shoot/` (reused) | — |
| **Phantom Barrage** (P2) | attack4 | skill4 (29f) | — | `Shoot/ball/` 4f, `Shoot/info/action/` pre/loop/end, `Shoot/map/` 11 position maps | 238 lv9 |
| **Rend Reverie** (P2) | attack5 | skill5 (62f) | — | `LaserRain/action/` 49f, `LaserRain/laser/` 21f | 238 lv5 |
| **Nightmare Rush** (P2) | attack6 | skill6 (15f) | — | `RushLucid/action/0` 8f + `/1` 27f + `/2` 8f, `RushLucid/particle/` grain + smoke | 238 lv8 |

### BossLucid Effect Asset Summary

| Asset | Path | Content | Total PNGs |
|-------|------|---------|------------|
| `Dragon/phase1/action/` | `Etc/BossLucid/Dragon/phase1/action/` | Dragon appear (10f) + fly (36f) | 46 |
| `Dragon/phase1/breath/` | `Etc/BossLucid/Dragon/phase1/breath/` | Breath overlay frames | 6 |
| `Dragon/phase2/action/` | `Etc/BossLucid/Dragon/phase2/action/` | Phase2 Dragon (same layout) | 46 |
| `DragonShadow/action/` | `Etc/BossLucid/DragonShadow/action/` | Shadow effect | 13 |
| `Shoot/ball/` | `Etc/BossLucid/Shoot/ball/` | Fairy Dust / Barrage projectile | 4 |
| `Shoot/hit/` | `Etc/BossLucid/Shoot/hit/` | Projectile hit burst | 6 |
| `Shoot/info/action/` | `Etc/BossLucid/Shoot/info/action/` | Barrage cast — pre/loop/end × lucid + butterfly | 107 |
| `Shoot/map/` | `Etc/BossLucid/Shoot/map/` | Barrage map background | 11 |
| `LaserRain/action/` | `Etc/BossLucid/LaserRain/action/` | Rend Reverie Lucid overlay | 49 |
| `LaserRain/laser/` | `Etc/BossLucid/LaserRain/laser/` | Laser beam frames | 21 |
| `RushLucid/action/` | `Etc/BossLucid/RushLucid/action/` | Rush — start(8f) + loop(27f) + end(8f) | 43 |
| `RushLucid/particle/` | `Etc/BossLucid/RushLucid/particle/` | Rush trail particles | 32 |
| `Butterfly/butterflies/` | `Etc/BossLucid/Butterfly/butterflies/` | 9 butterfly variants × fly/change/erase/prepare | ~200 |
| `Butterfly/butterfly/0/` | `Etc/BossLucid/Butterfly/butterfly/0/` | Single butterfly bomb(13f) + fly(2f) | 15 |
| `Fury/` | `Etc/BossLucid/Fury/` | P3 Fury background(11f) + fail(13f) + fog(8f) | 32 |
| `StainedGlass/BreakEffect/` | `Etc/BossLucid/StainedGlass/BreakEffect/` | Platform break effect, 6 variants × 14f | 84 |

### Web Implementation Strategy

For boss-viewer, effect-only actions should:

1. **Hide body dummy** — detect `onlyFsm=1` or ≤4px frames → do not render body sprite
2. **Play skill animation as body** — `info.skill[].action: N` → play `skill{N}` as the visible mob cast
3. **Overlay hit effect** — load `attackN/info/hit/` frames as a separate layer, play once at `attackAfter` delay. Note: attack3/4/5 hit images are 1px placeholders (only attack1, attack2 have real hit PNGs)
4. **Boss-specific effects** — load from `Etc/BossLucid.json`, render as separate overlay layer:
   - **Fairy Dust / Barrage (attack1, P2 attack4)** → `Shoot/ball/` 4f projectile (loop)
   - **Dragon Breath (attack2)** → `Dragon/phase1/action/1` 36f (P1) or `Dragon/phase2/action/1` 36f (P2)
   - **Rend Reverie (P2 attack5)** → `LaserRain/laser/` 29f laser beam
   - **Nightmare Rush (P2 attack6)** → `RushLucid/action/1` 27f flying body (loop)
5. **Summon mobs (attack3)** — not a single overlay; requires spawning independent animated entities. Butterfly data: `Butterfly/butterflies/` has 9 variants with `fly_phase1`, `fly_phase2`, `change`, `erase`, `prepare` states (465 PNGs). Positions: `Butterfly/phase1_pos/` and `phase2_pos/`. Golems are separate mob IDs spawned by MobSkill 201 — render as independent mobs at server-specified positions.
6. **Forced Teleport (attack4)** — no visual effect assets exist in data. This is a server-side mechanic (MobSkill 238 lv6) that moves players to random portal positions. The only visual is the skill4 cast animation.

## Data Paths

CDN base: `https://resource-static.msu.io/data/`

| Resource | CDN Path |
|----------|----------|
| Dream JSON | `Mob/8880140.json` |
| Awaken JSON | `Mob/8880150.json` |
| Boss Effects JSON | `Etc/BossLucid.json` |
| Boss Effects PNGs | `Etc/BossLucid/` |

## Related Mobs

| ID | Name | Role |
|----|------|------|
| 8880141/142 | Dreaming Lucid | Normal/other difficulty P1 |
| 8880151–155 | Lucid | Normal/other difficulty P2 variants |
| 8880163 | Lucid VampSummon | Vampire summoned mob |
| 8880165/168/169 | Flying Butterfly P1 | Phase 1 butterfly hazards |
| 8880175/178/179 | Flying Butterfly P2 | Phase 2 butterfly hazards |

## Notes

- Dream form (8880140) has `noFlip = 1` — never flip horizontally.
- Awaken form (8880150) has **no `stand` action** — use `fly` as the idle animation.
- Category 1 (not 8) is unusual for boss mobs — this affects targeting/damage UI.
- No HP linking between phases.
- Phase 1 `attack3` is a shared animation for 13+ distinct skills (10 golem placement variants, butterfly, mushroom, bomb).
- Phase 2 Rend Reverie and Nightmare Rush alternate; both use `stopByBind = 1`.
- `skillForbid` values indicate minimum intervals between specific skills (ms).
