---
name: maple-core-items
description: |
  Item categories, file paths, consume/install/cash item spec structure,
  and string table cross-references. Use when looking up item data or working with potions, scrolls, or equipment files.
---

# Item System

## Item Categories

| Cat | Range | Type | JSON folder | File naming |
|-----|-------|------|-------------|-------------|
| 1 | 1000000–1999999 | Equip | Character/{part}/ | 0{ID}.json (8-digit) |
| 2 | 2000000–2999999 | Consume | Item/Consume/ | First 4 digits of ID |
| 3 | 3000000–3999999 | Install | Item/Install/ | First 4-5 digits |
| 4 | 4000000–4999999 | Etc | Item/Etc/ | First 4 digits |
| 5 | 5000000–5999999 | Cash | Item/Cash/ | First 4 digits |
| 6 | 6000000–6999999 | CashEquip | Character/{part}/ | Same as Equip |

## Consume Item Structure

```json
// Item/Consume/0200.json → key "02000000"
"02000000": {
  "info": {
    "icon": { "_path": ".../icon.png", "origin": {"x":-3,"y":30} },
    "price": 3,          // NPC buy price
    "slotMax": 3000       // Max stack size
  },
  "spec": {
    "hp": 50              // HP recovery
  }
}
```

| Field | Description |
|-------|-------------|
| `info.price` | NPC purchase price |
| `info.slotMax` | Max per inventory slot |
| `spec.hp` / `spec.mp` | HP/MP recovery |
| `spec.time` | Buff duration |
| `info.tradeBlock` | 1 = untradeable |
| `info.notSale` | 1 = cannot sell |

For complete potion/scroll/buff spec fields → see `maple-core-items-reference.md`.

## String Table Cross-References

| String file | Key format | Links to |
|-------------|-----------|----------|
| `String/Skill.json` | `"4340007"` | `Skill/434.json` → `skill.4340007` |
| `String/Eqp.json` | `Eqp.{cat}.{ID}` | `Character/{cat}/0{ID}.json` |
| `String/Mob.json` | `"100000"` (no pad) | `Mob/0100000.json` (7-digit pad) |
| `String/Consume.json` | `"2000000"` | `Item/Consume/0200.json` → `02000000` |
| `String/Npc.json` | NPC ID | `Npc/{ID}.json` |
| `String/Pet.json` | Pet ID | `Item/Pet/{ID}.json` |

### String Entry Structure

```json
// String/Skill.json
{ "4340007": { "name": "Final Cut", "desc": "A powerful finishing move.",
               "h": "Damage: #damage%, Attacks: #attackCount" } }

// String/Eqp.json (nested by category)
{ "Eqp": { "Accessory": { "1010000": {"name": "Long Brown Beard"} },
            "Weapon":    { "1212000": {"name": "Dragon Tail Thanatos"} } } }

// String/Mob.json (flat)
{ "100000": {"name": "Snail"}, "100001": {"name": "Blue Snail"} }
```

## Item File Bundling

One JSON file contains multiple items:
```
Item/Consume/0200.json → { "02000000": {...}, "02000001": {...}, ... }
File name = first 4 digits of 8-digit item ID (with leading zero)
```

| Item type | File pattern | Key pattern |
|-----------|-------------|-------------|
| Consume | `Item/Consume/0200.json` | `02000000`, `02000001` |
| Etc | `Item/Etc/0400.json` | `04000000`, `04000001` |
| Install | `Item/Install/03010.json` | `03010000`, `03010001` |
| Cash | `Item/Cash/0501.json` | `05010000`, `05010001` |

## Equip Item Key Fields

| Field | Description |
|-------|-------------|
| `info.reqLevel` | Required level |
| `info.incPAD` / `info.incMAD` | Physical / Magic ATK bonus |
| `info.incPDD` / `info.incMDD` | Physical / Magic DEF bonus |
| `info.incSTR/DEX/INT/LUK` | Stat bonuses |
| `info.incMHP` / `info.incMMP` | Max HP/MP bonus |
| `info.tuc` | Upgrade slots |
| `info.cash` | 1 = Cash item |

For complete equip/consume/scroll field lists → see `maple-core-items-reference.md`.

