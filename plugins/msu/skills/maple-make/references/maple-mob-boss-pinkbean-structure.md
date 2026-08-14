---
name: maple-mob-boss-pinkbean-structure
description: |
  Pink Bean multi-part boss rendering: 13 parts (5 alive statues + 5 dead statues + 2 PB forms + Mini Bean),
  2-phase fight structure, z-order, and action mapping. Load when rendering Pink Bean (8820000–8820019).
---

# Pink Bean — Multi-Part Boss Rendering

Pink Bean is a **13-part composite boss** featuring 5 ancient god statues surrounding a central throne. The fight is divided into 2 phases: destroying all 5 statues (Phase 1), then fighting Pink Bean's body directly (Phase 2).

## Boss Lore

Pink Bean resides in the **Temple of Time: Twilight of the Gods**. Five forgotten god statues (Solomon, Hugin, Ariel, Munin, Rex) stand guard. Players must destroy all statues before engaging Pink Bean. In Chaos mode, PB has 3 HP bars (recovers by eating meat twice).

## Parts

### Alive Statues (5) — Phase 1

| Part ID   | Label    | Role                                   | Z-Offset | Position |
|-----------|----------|----------------------------------------|----------|----------|
| 8820003   | Solomon  | Sage Solomon — human statue, far left  | -2       | Left     |
| 8820005   | Hugin    | Eagle statue — left flank              | -1       | Left-Center |
| 8820002   | Ariel    | Goddess statue — center, elevated 271px| -3       | Center   |
| 8820006   | Munin    | Eagle statue — right flank             | -1       | Right-Center |
| 8820004   | Rex      | Sage Rex — human statue, far right     | -2       | Right    |

### Dead Statues (5) — Phase 2+

| Part ID   | Label        | Replaces | Z-Offset |
|-----------|--------------|----------|----------|
| 8820015   | DeadSolomon  | Solomon  | -2       |
| 8820017   | DeadHugin    | Hugin    | -1       |
| 8820019   | DeadAriel    | Ariel    | -3       |
| 8820018   | DeadMunin    | Munin    | -1       |
| 8820016   | DeadRex      | Rex      | -2       |

### Pink Bean (2 forms)

| Part ID   | Label    | Role                                     | Z-Offset |
|-----------|----------|------------------------------------------|----------|
| 8820000   | PBThrone | Throne form — sits on throne during P1   | 0        |
| 8820001   | PBBody   | Fighting form — active in P2, can move   | 0        |

### Mini Bean (Summon)

| Part ID   | Label    | Role                                     | Z-Offset |
|-----------|----------|------------------------------------------|----------|
| 8820007   | MiniBean | Summoned minion — 12 spawned at a time   | 1        |

All parts have `info.noFlip = 1` except PBBody (8820001) and MiniBean (8820007) which have `noFlip = 0`.

## Phase System

### Game Phases

| Phase | Description | Active Parts |
|-------|-------------|--------------|
| 1     | Statue Phase — all 5 statues activate simultaneously, shared HP bar | All 5 alive statues + PBThrone |
| 2     | Body Phase — after all statues destroyed, PB body fights directly | PBBody + all 5 dead statues |

### Chaos Mode Differences
- All statue HP greatly increased (210B Solomon/Rex, 252B Hugin/Munin, 420B Ariel)
- PB body has 3 HP bars (693B total) — eats meat and recovers twice
- Additional patterns: attack reflect on Munin/Ariel, potion seal, pull

### Viewer Phases

| Phase | Name                         | Visible Parts |
|-------|------------------------------|---------------|
| 0     | Phase 1 (Statues)            | Rex, Solomon, Ariel, Hugin, Munin, PBThrone |
| 1     | Phase 1 (Outer Dead)         | DeadRex, DeadSolomon, Ariel, Hugin, Munin, PBThrone |
| 2     | Phase 1 (Eagles Dead)        | DeadRex, DeadSolomon, Ariel, DeadHugin, DeadMunin, PBThrone |
| 3     | Phase 2 (PB Body)            | DeadRex, DeadSolomon, DeadAriel, DeadHugin, DeadMunin, PBBody |
| 4     | Phase 2 (PB + MiniBean)      | DeadRex, DeadSolomon, DeadAriel, DeadHugin, DeadMunin, PBBody, MiniBean |
| 5     | Statues Only                 | Rex, Solomon, Ariel, Hugin, Munin |
| 6     | PB Body Only                 | PBBody |
| 7     | All Parts (debug)            | All 13 parts |

## Z-Order

Parts render at the **same world anchor** with different depth values:

| Z-Offset | Parts                              | Layer |
|----------|-------------------------------------|-------|
| -3       | Ariel, DeadAriel                    | Farthest back (elevated goddess) |
| -2       | Solomon, Rex, DeadSolomon, DeadRex  | Outer statues |
| -1       | Hugin, Munin, DeadHugin, DeadMunin  | Flanking eagles |
| 0        | PBThrone, PBBody                    | Center (Pink Bean) |
| 1        | MiniBean                            | Frontmost (summon) |

In Phaser: `sprite.setDepth(10 + zOffset)`.

## Rendering

All parts share the same world position (anchor). Per-frame `origin` handles the relative offset:

```
draw_x = anchor_x - frame.origin.x
draw_y = anchor_y - frame.origin.y
```

### Stand Frame 0 Origins

#### Alive Statues

| Part     | origin.x | origin.y | Notes |
|----------|----------|----------|-------|
| Solomon  | 774      | 495      | Far left (large positive x pushes sprite left) |
| Hugin    | 402      | 294      | Left-center, elevated |
| Ariel    | 61       | 415      | Center, elevated 271px above ground |
| Munin    | -243     | 303      | Right-center, elevated |
| Rex      | -566     | 496      | Far right (large negative x pushes sprite right) |

#### Dead Statues

| Part         | origin.x | origin.y | Notes |
|--------------|----------|----------|-------|
| DeadSolomon  | 774      | 495      | Same position as alive |
| DeadHugin    | 402      | 294      | Same position as alive |
| DeadAriel    | 61       | 415      | Same position as alive |
| DeadMunin    | -243     | 303      | Same position as alive |
| DeadRex      | -566     | 496      | Same position as alive |

#### Pink Bean & Mini Bean

| Part     | origin.x | origin.y |
|----------|----------|----------|
| PBThrone | 38       | 204      |
| PBBody   | 35       | 85       |
| MiniBean | 27       | 88       |

> Every frame has its own `origin`. Do not cache or reuse across frames.

## Actions per Part

### Alive Statues

| Part     | Actions (frames) |
|----------|------------------|
| Solomon  | stand(1), attack1(18), attack2(20), attack3(19), die1(11), hit1(1), regen(22) |
| Hugin    | stand(1), attack1(16), attack2(23), die1(11), hit1(1), regen(22), skill1(14), skill2(16) |
| Ariel    | stand(1), attack1(22), attack2(23), die1(15), hit1(1), regen(21), skill1(21), skill2(20) |
| Munin    | stand(1), attack1(16), attack2(23), die1(11), hit1(1), regen(22), skill1(14), skill2(16) |
| Rex      | stand(1), attack1(18), attack2(20), attack3(19), die1(11), hit1(1), regen(22), skill1(16) |

### Dead Statues

All dead statues share a minimal action set:

| Part         | Actions (frames) |
|--------------|------------------|
| DeadSolomon  | stand(1), die1(1), hit1(1) |
| DeadHugin    | stand(1), die1(1), hit1(1) |
| DeadAriel    | stand(1), die1(1), hit1(1) |
| DeadMunin    | stand(1), die1(1), hit1(1) |
| DeadRex      | stand(1), die1(1), hit1(1) |

### Pink Bean (Throne Form — 8820000)

| Action  | Frames | Description |
|---------|--------|-------------|
| stand   | 6      | Sitting on throne |
| die1    | 7      | Death animation |
| hit1    | 1      | Hit reaction |
| skill1–8| varies | Various skill casts from throne |

### Pink Bean (Body Form — 8820001)

| Action  | Frames | Description |
|---------|--------|-------------|
| stand   | 6      | Idle stance |
| move    | 8      | Walking |
| attack1 | 27     | Tail slam (+ Mini Bean summon) |
| attack2 | 24     | Big Bang |
| attack3 | 20     | Pink Genesis |
| attack4 | 21     | Note drop |
| die1    | 58     | Long death sequence (surprise → cry → portal escape) |
| hit1    | 1      | Hit reaction |
| skill1  | 16     | Confusion (toy car) |
| skill2  | 20     | Mutation (transforms player) |
| skill3  | 24     | Undead skull throw |

### Mini Bean (8820007)

| Action  | Frames | Description |
|---------|--------|-------------|
| fly     | 4      | Flying idle (no stand!) |
| attack1 | 15     | Melee attack |
| attack2 | 19     | Ranged attack |
| die1    | 10     | Death |
| hit1    | 1      | Hit reaction |
| regen   | 8      | Respawn |
| skill1  | 16     | Physical immune |

> Mini Bean has **no `stand` action** — use `fly` as the default idle.

## Statue Attack Patterns (from Wiki)

### Solomon (Left Human Statue)
- **Spear Slam**: Wide-range physical, 60% stun 3s
- **Lightning**: Full-map lightning, 50% seal 3s
- **Slow**: Wide-range, slow 5s

### Hugin (Left Eagle Statue) — Ice weak, Fire resist
- **Slow**: Fire magic, slow 5s
- **Leaf Stone Drop**: 5 of 9 zones, 70% undead 20s
- **Attack Reflect**: 10s, 30000 reflect damage (CD 75s)
- **Seal**: 90% seal 3s
- **Weakness** (Normal only): 70% weakness 4s

### Ariel (Center Goddess) — All elements resist (except Physical/Poison)
- **Genesis**: 7 of 15 zones, confusion 10s
- **Meteor**: 5 of 15 zones, 1/1 + stun 3s
- **Undead**: 70% undead 20s (CD 60s)
- **Poison Mist**: Area poison
- **Immune**: Physical OR Magic immune 10s (CD 60s each)
- **Attack Reflect** (Chaos only): 5s, 50000 damage (CD 90s)
- **Pull** (Chaos only): 3s pull to center (CD 30s)

### Munin (Right Eagle Statue) — Fire weak, Ice resist
- **Confusion**: Ice magic, confusion 10s
- **Leaf Stone Drop**: Same as Hugin
- **Exile**: 80% exile to "Lost Twilight" map (CD 50s)
- **Seduction**: 4s seduction
- **Weakness** (Normal only): 70% weakness 4s
- **Potion Seal** (Chaos only): 10s potion seal (HP <80%)

### Rex (Right Human Statue)
- **Lightning**: Full-map, 90% miss 6s
- **Slow**: Wide-range, poison 10s
- **Confusion**: 10s/15s confusion (CD 60s)

## Data Paths (CDN)

```
Mob/8820000.json  — PBThrone
Mob/8820001.json  — PBBody
Mob/8820002.json  — Ariel
Mob/8820003.json  — Solomon
Mob/8820004.json  — Rex
Mob/8820005.json  — Hugin
Mob/8820006.json  — Munin
Mob/8820007.json  — MiniBean
Mob/8820015.json  — DeadSolomon
Mob/8820016.json  — DeadRex
Mob/8820017.json  — DeadHugin
Mob/8820018.json  — DeadMunin
Mob/8820019.json  — DeadAriel
```

CDN base: `https://resource-static.msu.io/data/`

## Other Mob IDs in the 882x Range

| Range       | Purpose |
|-------------|---------|
| 8820008–8820009 | Unknown variants |
| 8820010–8820014 | PB phase transition forms (stand/die/hit only, origin 36,53) |
| 8820020–8820027 | Additional variants |
| 8820100–8820118 | Chaos mode statue variants |
| 8820200–8820227 | Additional chaos variants |
| 8820300–8820304 | Special variants |
