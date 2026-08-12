---
name: maple-mob-boss-papulatus-structure
description: |
  Papulatus 2-phase boss rendering: Clock (8500001) → Pilot (8500002).
  Unified multi-phase entry in viewer.
user-invocable: true
disable-model-invocation: false
---

# Papulatus — Two-Phase Boss Rendering

Papulatus is a **multi-phase boss** in the viewer with two parts:
- **Phase 1 (Clock)**: `8500001` — Papulatus Clock
- **Phase 2 (Pilot)**: `8500002` — Papulatus

Phase 1 clock is destroyed → Phase 2 pilot emerges. All difficulties share identical sprites (same hash).

## Parts

### Papulatus Clock (Phase 1)

| Part ID   | Name | noFlip | bodyAttack |
|-----------|------|--------|------------|
| 8500001   | Papulatus Clock | 0 | 1 |

| Action | Frames |
|--------|--------|
| stand | 6 |
| move | 6 |
| hit1 | 1 |
| die1 | 8 |
| attack1 | 28 |
| attack2 | 24 |
| skill1 | 15 |
| skill2 | 32 |
| skill3 | 33 |
| skill4 | 12 |
| skill5 | 32 |
| sleep | 3 |
| wakeup | 25 |

### Papulatus (Phase 2)

| Part ID   | Name | noFlip | bodyAttack |
|-----------|------|--------|------------|
| 8500002   | Papulatus | 0 | 1 |

| Action | Frames |
|--------|--------|
| stand | 6 |
| fly | 6 |
| hit1 | 1 |
| die1 | 7 |
| attack1 | 21 |
| skill1 | 16 |
| skill2 | 13 |
| skill3 | 15 |
| skill4 | 24 |
| skill5 | 33 |
| skill6 | 12 |

## Action → Pattern Mapping

### Clock (Phase 1)

| Action | Pattern | Description |
|--------|---------|-------------|
| attack1 | Clock Bomb | fixDamR 5/30/70% HP by difficulty |
| attack2 | Hand Slam | Melee hit |
| skill1 | Buff Control | STUN (HP<40%) / SEAL (HP≥40%) |
| skill2 | Clock Mission | 6-piece seal gimmick |
| skill3 | Alarm Mode ON | 30s DPS window |
| skill4 | Alarm Mode OFF | End of alarm cycle |
| skill5 | Summon | Tick-Tock ×5 + Chronos ×2 |
| sleep | Alarm Sleep | Dormant state during Alarm cycle |
| wakeup | Alarm Wakeup | Alarm → active transition |

### Papulatus (Phase 2)

| Action | Pattern | Description |
|--------|---------|-------------|
| attack1 | Spring Shot | Ranged projectile |
| skill1 | Summon Clones | 4× Otherworld Papulatus |
| skill2 | Absorb Clones | 20%/clone heal (Chaos only) |
| skill3 | Teleport | Forced relocation |
| skill4 | Time Torrent | Deal damage to cancel |
| skill5 | Alarm Mode ON | 30s DPS window |
| skill6 | Alarm Mode OFF | End of alarm cycle |

## Data Paths

CDN base: `https://resource-static.msu.io/data/`

| Resource | CDN Path |
|----------|----------|
| Clock JSON | `Mob/8500001.json` |
| Papulatus JSON | `Mob/8500002.json` |

## Viewer Config (bosses.js)

```js
{
  id: '8500001', name: 'Papulatus',
  parts: [
    { id: '8500001', label: 'Clock', zOffset: 0 },
    { id: '8500002', label: 'Pilot', zOffset: 0 },
  ],
  phases: [
    { name: 'Phase 1 (Clock)',  partLabels: ['Clock'] },
    { name: 'Phase 2 (Pilot)', partLabels: ['Pilot'] },
  ],
}
```

## Notes

- Clock has unique `sleep`/`wakeup` actions — dormant→active state transition.
- Papulatus (Phase 2) uses `fly` instead of `move` — it's an airborne entity.
- Papulatus has **category 5** (unlike Clock which is category 8).
- Normal (8500011/12) and Chaos (8500021/22) use separate mob IDs but share identical sprites (same hash).
- Both forms have body attack enabled.
- Normal (8500011/12) and Chaos (8500021/22) difficulty IDs share identical sprites.
