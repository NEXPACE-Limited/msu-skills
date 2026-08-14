---
name: maple-data-reference
description: ENTRY POINT for MapleStory asset reference. Read this before any other maple-* reference. Use when assembling characters, calculating skill damage, looking up items or mobs, or rendering sprites.
---

# Game Asset Reference


> **You are reading the entry point.** This file tells you what assets exist and where to find them.
> Detail reference files sit beside this one under `references/`; load them on demand.

> **STOP — before writing any rendering code:**
> Read `maple-core-rendering.md` **now**, before touching draw/flip/socket logic.
> The Quick Rules table below is a lookup aid only — it does NOT replace the rendering reference.
> Skipping this step causes origin offset errors and misaligned flipped sprites.
> For character socket assembly also read `maple-character-rendering.md`.

## Quick Rules (always keep in context)

| Rule | Formula |
|------|---------|
| Item category | `itemID / 1_000_000` → 1=Equip 2=Consume 3=Install 4=Etc 5=Cash 6=CashEquip |
| Skill → job root | `skillID / 10_000` (exception: root 8000 or 8001 → `skillID / 100`) |
| Skill file | `Skill/{skillID / 10000}.json` → key `skill.{skillID}` |
| Equip → sprite | `Character/{part}/0{equipID}.json` (8-digit zero-pad) |
| Mob file | `Mob/0{mobID}.json` (7-digit zero-pad) |
| NPC file | `Npc/0{npcID}.json` (7-digit zero-pad) |
| Morph file | `Morph/{morphID}.json` (4-digit, e.g. 0001.json) |
| Reactor file | `Reactor/0{reactorID}.json` (7-digit zero-pad) |
| Pet file | `Item/Pet/{petID}.json` (7-digit, e.g. 5000000.json) |
| TamingMob stats | `TamingMob/{statID}.json` (4-digit, e.g. 0001.json) |
| TamingMob sprite | `Character/TamingMob/{tamingMobID}.json` (8-digit, e.g. 01902000.json) |
| String lookup | `String/{Type}.json` → key = ID (no zero-pad for Mob/Npc/Pet) |
| Draw formula | `draw_x = world_x - origin.x` / `draw_y = world_y - origin.y` — applies to ALL entity types |
| Flip anchor | `anchorX = flip ? (width - origin.x) : origin.x` — pixel shifts when image is mirrored |
| Socket formula (no flip) | `childOriginWorld = parentOriginWorld + parentSocket - childSocket` |
| Socket formula (flip) | `childOriginWorld.x = parentOriginWorld.x - parentSocket.x + childSocket.x` / y unchanged — negate BOTH socket x values |
| Skill formula | `x`=level, `u()`=ceil, `d()`=floor |
| Canvas detection | `typeof value === "object" && "_path" in value` → has socket data |
| Sprite direction | All sprites face **LEFT** by default — flip right: Phaser `setFlipX(true)`, Canvas `ctx.scale(-1,1)`, CSS `scaleX(-1)` |

## Reference Map — Load on Demand

| Reference | Load when... |
|-------|-------------|
| `maple-core-id-system.md` | Resolving IDs, mapping items/skills/mobs to files |
| `maple-core-id-reference.md` | All 36 weapon type codes, full job tree, body part slots, skill grades |
| `maple-core-rendering.md` | CDN, sprite direction, flip rules, img/Canvas rendering, Phaser integration — all entity types |
| `maple-character-rendering.md` | Character sprite assembly, socket attachment, z-order, VSlot, AAT, animation states |
| `maple-character-skill-system.md` | Skill JSON structure, formula syntax, damage calculation |
| `maple-character-skill-reference.md` | Complete spec field list, monster skill IDs (MobSkill enum 100–267), effect animation rules |
| `maple-core-items.md` | Item categories, consume/install spec structure, string cross-references |
| `maple-core-items-reference.md` | Complete equip/consume/scroll field tables, Cash item type codes |
| `maple-core-folder-guide.md` | Directory map, file naming rules, JSON schema reference |
| `maple-field-map.md` | Map structure, mob spawns, portals, footholds, level layout |
| `maple-mob-structure.md` | Mob file structure, rendering workflow, stats, animation, combat |
| `maple-npc-structure.md` | NPC file structure, animation states, link references, click area, condition states, dialogue |
| `maple-character-morph-structure.md` | Morph transformation sprites, animation states, head socket, bounding box, info fields |
| `maple-field-reactor-structure.md` | Reactor state machine, event transitions, hit animations, z-order rules |
| `maple-pet-structure.md` | Pet animation states, bounding box, interaction/food/slang system |
| `maple-character-install-structure.md` | Install item (chair) effect layers, seat positioning, group layout, TamingMob link |
| `maple-character-tamingmob-structure.md` | TamingMob (mount/riding) file structure, z-order layers, navel socket attachment |
| `maple-mob-boss-{name}-structure.md` | Per-boss rendering spec: parts, phases, z-order, action→pattern mapping — 19 files total (see table below) |

### Boss Structure References

Each boss has a dedicated reference file: `maple-mob-boss-{name}-structure.md`

| File | Boss | Parts | Phases |
|------|------|-------|--------|
| `maple-mob-boss-balrog-structure.md` | Balrog | 7 (Body/Hands/Spirit/Dead variants) | HP-based hand sealing + Spirit phase |
| `maple-mob-boss-horntail-structure.md` | Horntail | 18 (10 alive + 8 dead) | 3 (LHead solo → RHead solo → Full body) |
| `maple-mob-boss-pinkbean-structure.md` | Pink Bean | 13 (5 statues + 5 dead + PB×2 + MiniBan) | 2 (5 statues → PB body) |
| `maple-mob-boss-papulatus-structure.md` | Papulatus | 2 (Clock → Pilot) | 2 |
| `maple-mob-boss-magnus-structure.md` | Magnus | 1 | 1 |
| `maple-mob-boss-hilla-structure.md` | Hilla | 1 | 1 |
| `maple-mob-boss-vonleon-structure.md` | Von Leon | 1 | 1 |
| `maple-mob-boss-arkarium-structure.md` | Arkarium | 1 | 1 |
| `maple-mob-boss-cygnus-structure.md` | Cygnus | 1 | 1 (sleep/wakeup + knight summons) |
| `maple-mob-boss-damien-structure.md` | Damien | 2 (Human→Demon) | 2 |
| `maple-mob-boss-lotus-structure.md` | Lotus | 4 (Core + P1/P2/P3) | 3 |
| `maple-mob-boss-lucid-structure.md` | Lucid | 2 (Dream→Awaken) | 2–3 (Hard adds Fury DPS check) |
| `maple-mob-boss-will-structure.md` | Will | 3 (Sorcerer→Spider→Web) | 3 |
| `maple-mob-boss-darknell-structure.md` | Darknell | 1 | 1 |
| `maple-mob-boss-gloom-structure.md` | Gloom / Dusk | 1 | 1 |
| `maple-mob-boss-gas-structure.md` | Guardian Angel Slime | 1 | 1 |
| `maple-mob-boss-verushilla-structure.md` | Verus Hilla | 3 (Hilla + NecroLotus + NecroDamien) | 4 (specter summons per HP segment) |
| `maple-mob-boss-blackmage-structure.md` | Black Mage | 6 (Knight×2 + Phase2/3/4 + HP entity) | 4 |
| `maple-mob-boss-seren-structure.md` | Chosen Seren | 7 (P1 + 4 time-of-day forms + HP entity + Nerota) | 2 (P1 + P2 time-of-day rotation) |

> Load the specific file for the boss you are rendering. Each file contains: parts table, phase system, z-order, actions per part, action→pattern mapping, and combat stats.

## MCP Tool: maple-lookup

Use the `maple-lookup` MCP server tools to search game data and fetch sprite info. Tool names are prefixed with the server name: `maple-lookup_search`, `maple-lookup_get_sprite_data`.

| Tool | Purpose | Example |
|------|---------|---------|
| `maple-lookup_search` | Fuzzy search by name (Korean/English) | `maple-lookup_search("고블린")` → ID, name, score, category |
| `maple-lookup_get_sprite_data` | Fetch sprite/skill data from CDN | `maple-lookup_get_sprite_data("mob", "5100203", ["stand"])` → frames with _path, origin, delay, z (layer), map (socket points) |

**Sprite Workflow (mob/equipment):**
1. `maple-lookup_search` → get ID and category
2. `maple-lookup_get_sprite_data` → get animation frames
3. Embed frame data in HTML, load PNGs via `<img>` tags from CDN

**Character Assembly Workflow:**
1. `maple-lookup_get_sprite_data("body", "2000", ["stand1"])` → base body with socket data
2. `maple-lookup_get_sprite_data("head", "12000", ["stand1"])` → head with socket data
3. `maple-lookup_search("{equipment}", "{category}")` → get equipment IDs
4. `maple-lookup_get_sprite_data("{category}", "{id}", ["stand1"])` → equipment frames with socket data
5. Assemble parts using socket points (navel, neck, brow, hand) — see `maple-core-rendering.md` and `maple-character-rendering.md`

**NPC Workflow:**
1. `maple-lookup_search("{npc name}", "npc")` → get NPC ID
2. `maple-lookup_get_sprite_data("npc", "{npcID}", ["stand"])` → NPC sprite (same structure as mob)

**Map Workflow:**
1. `maple-lookup_search("{map name}", "map")` → get map ID
2. `maple-lookup_get_sprite_data("map", "{mapID}")` → get map data (tiles, footholds, portals, life) — see `maple-field-map.md`

**Skill Workflow:**
1. `maple-lookup_search("{skill name}", "skill")` → get skill ID
2. `maple-lookup_get_sprite_data("skill", "{skillID}")` → get skill spec + visual effect data — see `maple-character-skill-system.md`

## Asset Root

**Data CDN**: `https://resource-static.msu.io/data/`

All `_path` values in JSON are relative to this CDN base URL.
PNG files live in folders named after their parent JSON file:
```
{file}.json/{action}/{frame}/{part}.png
```
