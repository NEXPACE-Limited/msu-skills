---
name: maple-core-id-system
description: |
  Item, Skill, Mob, NPC ID encoding rules and file path mapping.
  Use when converting IDs to file paths, or resolving which folder/file an item/skill/mob belongs to.
user-invocable: true
disable-model-invocation: false
---

# ID System

## Item ID → Category

```
itemID / 1_000_000 = category
  1=Equip  2=Consume  3=Install  4=Etc  5=Cash  6=CashEquip
```

### Equip Sub-Category (Body Part)

Middle digits of equip ID determine slot:

| Code | Slot | ID prefix | Sprite folder |
|------|------|-----------|---------------|
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
| BP_BELT=22 | Belt | 113xxxx | Accessory/ |
| BP_MEDAL=21 | Medal | 114xxxx | Accessory/ |
| BP_SHOULDER=23 | Shoulder | 115xxxx | Accessory/ |

### Common Weapon Types

| Code | Type | Code | Type |
|------|------|------|------|
| 30 | 1H Sword | 40 | 2H Sword |
| 31 | 1H Axe | 41 | 2H Axe |
| 32 | 1H Mace | 43 | Spear |
| 33 | Dagger | 44 | Polearm |
| 37 | Wand | 45 | Bow |
| 38 | Staff | 46 | Crossbow |
| 48 | Knuckle | 49 | Gun |

For all 36 weapon types → see `maple-core-id-reference.md`.

## Skill ID → Job & File

```
skillID / 10_000 = job_root
Exception: if root == 8000 or 8001 → skillID / 100
```

**File**: `Skill/{root}.json` → JSON key: `skill.{skillID}`

### Job Roots (condensed)

```
Adventurers:  Warrior(100) Mage(200) Archer(300) Thief(400) Pirate(500)
Cygnus:       Soul(1100) Flame(1200) Wind(1300) Night(1400) Strike(1500)
Heroes:       Aran(2100) Evan(2200) Mercedes(2300) Phantom(2400)
Resistance:   Demon(3100) Battle(3200) Wild(3300) Mechanic(3500) Xenon(3600)
Nova:         Kaiser(6100) AngelicBuster(6500) Cadena(6400)
Special:      Zero(10000) Kinesis(14000) Lef(15000) Anima(16000)
```

For complete job tree with all advancement branches → see `maple-core-id-reference.md`.

## Mob ID → File

```
Mob file = Mob/0{mobID}.json   (7-digit zero-pad)
String key = mobID as-is       (no zero-pad, e.g. "100000")
```

## Cross-Reference Rules

| From | To | Conversion |
|------|----|------------|
| String/Eqp.json key "1010000" | Character file | Prepend "0" → `01010000.json` |
| String/Mob.json key "100000" | Mob file | Prepend "0", 7-digit pad → `0100000.json` |
| String/Skill.json key "4340007" | Skill file | `4340007/10000=434` → `Skill/434.json` |
| Item ID "02000000" | Item file | First 4 digits → `Item/Consume/0200.json` |
