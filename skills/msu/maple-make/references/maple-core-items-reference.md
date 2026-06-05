---
name: maple-core-items-reference
description: |
  Complete field tables for equip, consume, scroll, and install items.
  Cash item type codes (CIT_*). Use when you need specific field names for item stats, potions, scrolls, or cash coupons.
user-invocable: true
disable-model-invocation: false
---

# Items — Full Reference

## Equip Item Fields

Equip items are in `Character/{part}/0{ID}.json` (sprites) and referenced via `String/Eqp.json` (names).

### Common Equip Info Fields

| Field | Type | Description |
|-------|------|-------------|
| `info.icon` | canvas | Item icon |
| `info.iconRaw` | canvas | Raw icon (no background) |
| `info.cash` | int | 1 = Cash item |
| `info.price` | int | NPC price |
| `info.tuc` | int | Upgrade slots |
| `info.reqLevel` | int | Required level |
| `info.reqSTR` | int | Required STR |
| `info.reqDEX` | int | Required DEX |
| `info.reqINT` | int | Required INT |
| `info.reqLUK` | int | Required LUK |
| `info.reqJob` | int | Required job bitmask |
| `info.incSTR` | int | STR bonus |
| `info.incDEX` | int | DEX bonus |
| `info.incINT` | int | INT bonus |
| `info.incLUK` | int | LUK bonus |
| `info.incPAD` | int | Physical ATK bonus |
| `info.incMAD` | int | Magic ATK bonus |
| `info.incPDD` | int | Physical DEF bonus |
| `info.incMDD` | int | Magic DEF bonus |
| `info.incMHP` | int | Max HP bonus |
| `info.incMMP` | int | Max MP bonus |
| `info.incSpeed` | int | Speed bonus |
| `info.incJump` | int | Jump bonus |

## Consume Item Spec Fields

### Potion / Buff

| Field | Description |
|-------|-------------|
| `spec.hp` | HP recovery amount |
| `spec.mp` | MP recovery amount |
| `spec.hpR` | HP recovery % |
| `spec.mpR` | MP recovery % |
| `spec.time` | Buff duration (seconds) |
| `spec.pad` | ATK buff value |
| `spec.mad` | MATK buff value |
| `spec.pdd` | DEF buff value |
| `spec.speed` | Speed buff value |
| `spec.jump` | Jump buff value |
| `spec.eva` | Evasion buff value |
| `spec.acc` | Accuracy buff value |

### Scroll

| Field | Description |
|-------|-------------|
| `spec.incSTR` | STR increase on success |
| `spec.incDEX` | DEX increase on success |
| `spec.incINT` | INT increase on success |
| `spec.incLUK` | LUK increase on success |
| `spec.incPAD` | ATK increase on success |
| `spec.incMAD` | MATK increase on success |
| `spec.success` | Success rate % |
| `spec.cursed` | Cursed scroll (destroy on fail) |

## Install Item Fields

```json
"03010000": {
  "effect": {
    "0": { "_path": ".../effect/0.png", "origin": {"x":26,"y":32} },
    "z": -1
  },
  "info": {
    "icon": { "_path": ".../icon.png" },
    "price": 100,
    "recoveryHP": 50,    // HP recovery when used
    "recoveryMP": 0,
    "slotMax": 1,
    "tradeBlock": 1,     // Untradeable
    "notSale": 1          // Cannot sell to NPC
  }
}
```

## Cash Item Types (CIT_*)

| Code | Name | Description |
|------|------|-------------|
| CIT_HAIR=1 | Hair | Hairstyle change coupon |
| CIT_FACE=2 | Face | Face change coupon |
| CIT_SKIN=3 | Skin | Skin color change |
| CIT_ANDROID=5 | Android | Android companion |
| CIT_PET=8 | Pet | Pet item |
| CIT_EFFECT=9 | Effect | Character effect |
| CIT_SHOUTING=14 | Megaphone | Server shout |
| CIT_MORPH=16 | Morph | Transform into monster |
| CIT_AVATAR_MEGAPHONE=19 | Avatar Mega | Avatar megaphone |
| CIT_HEART_SPEAKER=20 | Heart Speaker | Heart chat |
| CIT_SKULL_SPEAKER=21 | Skull Speaker | Skull chat |
| CIT_MAP_CHANGE=23 | Map Teleport | Teleport to map |
| CIT_GACHAPON=26 | Gachapon | Random draw machine |
| CIT_FACE_COUPON=30 | Face Coupon | Face change (random) |
| CIT_HAIR_COUPON=31 | Hair Coupon | Hair change (random) |
| CIT_NAMING=37 | Name Change | Character rename |
| CIT_WORLD_CHANGE=43 | World Transfer | Server transfer |
| CIT_PROTECTION=47 | Scroll Protect | Protects item on scroll fail |
| CIT_INCUBATOR=49 | Incubator | Pet egg incubator |
| CIT_PET_FOOD=60 | Pet Food | Pet fullness recovery |
| CIT_PET_SKILL=61 | Pet Skill | Teach pet a skill |
| CIT_CHAIR=71 | Chair | Sit item (decoration) |
| CIT_TITLE=75 | Title | Character title |
| CIT_RED_CUBE=86 | Red Cube | Potential reroll |
| CIT_BLACK_CUBE=87 | Black Cube | Potential reroll (premium) |
| CIT_BONUS_CUBE=88 | Bonus Cube | Bonus potential reroll |
| CIT_ADDITIONAL_CUBE=89 | Additional Cube | Additional potential |
| CIT_STAMP=92 | Stamp | Golden Hammer equivalent |
| CIT_KARMA_SCISSORS=93 | Karma Scissors | Make untradeable tradeable |
| CIT_PLATINUM_SCISSORS=94 | Platinum Scissors | Premium karma scissors |
