---
name: maple-core-id-reference
description: |
  Complete lookup tables for the ID system: all 36 weapon type codes (WT_*),
  all body part slot codes (BP_*), full job advancement tree, skill grade system,
  and V-skill roots. Use when you need specific weapon type codes or job IDs.
---

# ID System — Full Reference

## Complete Weapon Types (36)

| Code | Type | Note |
|------|------|------|
| WT_OH_SWORD=30 | 1H Sword | |
| WT_OH_AXE=31 | 1H Axe | |
| WT_OH_MACE=32 | 1H Mace | |
| WT_DAGGER=33 | Dagger | |
| WT_SUB_DAGGER=34 | Sub Dagger | Dual Blade off-hand |
| WT_WAND=37 | Wand | |
| WT_STAFF=38 | Staff | |
| WT_TH_SWORD=40 | 2H Sword | |
| WT_TH_AXE=41 | 2H Axe | |
| WT_TH_MACE=42 | 2H Mace | |
| WT_SPEAR=43 | Spear | |
| WT_POLEARM=44 | Polearm | |
| WT_BOW=45 | Bow | |
| WT_CROSSBOW=46 | Crossbow | |
| WT_THROWINGGLOVE=47 | Throwing Glove | |
| WT_KNUCKLE=48 | Knuckle | |
| WT_GUN=49 | Gun | |
| WT_DUAL_BOW=52 | Dual Bowgun | Mercedes |
| WT_HAND_CANNON=53 | Hand Cannon | Cannon Shooter |
| WT_BIG_SWORD=56 | Great Sword | Zero (Alpha) |
| WT_LONG_SWORD=57 | Long Sword | Zero (Beta) |
| WT_GAUNTLET=58 | Gauntlet | |
| WT_ANCIENT_BOW=59 | Ancient Bow | |
| WT_ROD=21 | Rod | Soul Shooter line |
| WT_SOUL_SHOOTER=22 | Soul Shooter | Angelic Buster |
| WT_CHAIN=27 | Chain | Cadena |
| WT_FAN=29 | Fan | Hoyoung |
| WT_TUNER=213 | Tuner | |
| WT_BREATH_SHOOTER=214 | Breath Shooter | |

## Complete Body Part Codes

| Code | Slot | ID range | Character folder |
|------|------|----------|-----------------|
| BP_CAP=1 | Hat | 100xxxx | Cap/ |
| BP_FACEACC=2 | Face Acc | 101xxxx | Accessory/ |
| BP_EYEACC=3 | Eye Acc | 102xxxx | Accessory/ |
| BP_EARACC=4 | Ear Acc | 103xxxx | Accessory/ |
| BP_CLOTHES=5 | Top | 104xxxx | Coat/ |
| BP_PANTS=6 | Bottom | 106xxxx | Pants/ |
| BP_SHOES=7 | Shoes | 107xxxx | Shoes/ |
| BP_GLOVES=8 | Gloves | 108xxxx | Glove/ |
| BP_CAPE=9 | Cape | 110xxxx | Cape/ |
| BP_SHIELD=10 | Shield | 109xxxx | Shield/ |
| BP_WEAPON=11 | Weapon | 1xx0000 | Weapon/ |
| BP_RING1=12 | Ring 1 | 111xxxx | Ring/ |
| BP_RING2=13 | Ring 2 | 111xxxx | Ring/ |
| BP_RING3=15 | Ring 3 | 111xxxx | Ring/ |
| BP_RING4=16 | Ring 4 | 111xxxx | Ring/ |
| BP_PENDANT=17 | Pendant | 112xxxx | Accessory/ |
| BP_MEDAL=21 | Medal | 114xxxx | Accessory/ |
| BP_BELT=22 | Belt | 113xxxx | Accessory/ |
| BP_SHOULDER=23 | Shoulder | 115xxxx | Accessory/ |

## Full Job Tree

```
═══ Adventurers (Explorer) ═══ JOB 0–534
├─ Warrior (100)
│  ├─ Fighter(110) → Crusader(111) → Hero(112)
│  ├─ Page(120)    → Knight(121)   → Paladin(122)
│  └─ Spearman(130)→ DragonKnight(131)→ DarkKnight(132)
├─ Mage (200)
│  ├─ FPWizard(210)→ FPMage(211)  → FPArchMage(214)
│  ├─ ILWizard(220)→ ILMage(221)  → ILArchMage(224)
│  └─ Cleric(230)  → Priest(231)  → Bishop(234)
├─ Archer (300)
│  ├─ Hunter(310)  → Ranger(311)  → BowMaster(314)
│  ├─ Crossbowman(320)→ Sniper(321)→ Marksman(324)
│  └─ Pathfinder(330→334)
├─ Thief (400)
│  ├─ Assassin(410)→ Hermit(411)  → NightLord(414)
│  ├─ Bandit(420)  → ChiefBandit(421)→ Shadower(424)
│  └─ DualBlade(430→436)
└─ Pirate (500)
   ├─ Brawler(510) → Marauder(511)→ Buccaneer(514)
   ├─ Gunslinger(520)→ Outlaw(521)→ Corsair(524)
   └─ CannonShooter(530→534)

═══ Cygnus Knights ═══ JOB 1000–1514
├─ SoulMaster(1100)  ├─ FlameWizard(1200)  ├─ WindBreaker(1300)
├─ NightWalker(1400) └─ Striker(1500)

═══ Heroes / Legends ═══ JOB 2000–2714
├─ Aran(2100)      ├─ Evan(2200)     ├─ Mercedes(2300)
├─ Phantom(2400)   ├─ Eunwol(2500)   └─ Luminous(2700)

═══ Resistance ═══ JOB 3000–3714
├─ DemonSlayer(3100) ├─ BattleMage(3200) ├─ WildHunter(3300)
├─ Mechanic(3500)    └─ Xenon(3600→3614)

═══ Nova ═══ JOB 6000–6514
├─ Kaiser(6100)  ├─ AngelicBuster(6500)  └─ Cadena(6400)

═══ Special Classes ═══
├─ Zero(10000→10114)      ├─ Kinesis(14000→14214)
├─ Lef(15000→15514)       └─ Anima(16000→16414)
```

## Skill Grade System

| Grade | Value | Description |
|-------|-------|-------------|
| SKILL_0 | 0 | Beginner |
| SKILL_1 | 1 | 1st Job Advancement |
| SKILL_2 | 2 | 2nd Job |
| SKILL_3 | 3 | 3rd Job |
| SKILL_4 | 4 | 4th Job |
| SKILL_5–9 | 5–9 | 5th~9th (V-Skills) |
| SKILL_HYPER | 10 | Hyper Skills |

## V-Skill Roots

| Root | Code | Target |
|------|------|--------|
| VSKILL_ROOT_COMMON | 40000 | All classes |
| VSKILL_ROOT_FIGHTER | 40001 | Warriors |
| VSKILL_ROOT_WIZARD | 40002 | Mages |
| VSKILL_ROOT_ARCHER | 40003 | Archers |
| VSKILL_ROOT_THIEF | 40004 | Thieves |
| VSKILL_ROOT_PIRATE | 40005 | Pirates |
