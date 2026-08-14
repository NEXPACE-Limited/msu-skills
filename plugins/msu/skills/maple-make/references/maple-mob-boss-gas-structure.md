---
name: maple-mob-boss-gas-structure
description: |
  Guardian Angel Slime single-part boss rendering: 1 part (8880700),
  3 attacks + 8 skills + sleep/wakeup.
---

# Guardian Angel Slime — Single-Part Boss Rendering

Guardian Angel Slime (수호천사 슬라임) is a **single-part boss** with a rich skill set including a unique `sleep`/`wakeup` mechanic and an extremely long `skill7` animation (166 frames).

## Part

| Part ID   | Name                   | noFlip | bodyAttack |
|-----------|------------------------|--------|------------|
| 8880700   | Guardian Angel Slime   | 0      | 0          |

## Actions

| Action | Frames | Description |
|--------|--------|-------------|
| stand | 24 | Idle (long cycle) |
| move | 12 | Movement |
| sleep | 1 | Dormant state ⚡effect-only (dummy sprite) |
| wakeup | 21 | Activation transition |
| attack1 | 20 | |
| attack2 | 24 | |
| attack3 | 25 | |
| die1 | 38 | |
| hit1 | 1 | |
| skill1 | 16 | |
| skill2 | 21 | |
| skill3 | 1 | Programmatic ⚡effect-only (dummy sprite) |
| skill4 | 20 | |
| skill5 | 20 | |
| skill6 | 22 | |
| skill7 | 166 | Extremely long (signature transformation?) |
| skill8 | 13 | |
| skillAfter1 | 8 | |

## Data Path

CDN: `https://resource-static.msu.io/data/Mob/8880700.json`

## Difficulty Variants

| Mode | ID | Name |
|------|----|------|
| **Chaos** | **8880700** | Guardian Angel Slime (used) |
| Normal | 8880711 | Guardian Angel Slime |

## Related Mobs

| ID | Name | Role |
|----|------|------|
| 8880702/713 | Magma Slime | Fire phase slime |
| 8880704/715 | Troublemaker Slime | Gimmick slime |
| 8880705/716 | Explosive Slime | Self-destruct slime |
| 8880706/717 | Gold Slime | Reward slime |
| 8880707/718 | Romantic Slime | Gimmick slime |
| 8880708/719 | Halo Slime | Gimmick slime |
| 8880725/726 | Slime Treasure Chest | Drop containers |

## Notes

- `skill7` (166 frames) is the **longest single animation of any boss** — likely a major transformation/phase mechanic.
- `stand` has 24 frames — the most frames of any boss idle animation.
- `sleep`/`wakeup` mechanic similar to Cygnus and Papulatus Clock.
- Normal mode (8880711) has the same action set with potentially different stats.
