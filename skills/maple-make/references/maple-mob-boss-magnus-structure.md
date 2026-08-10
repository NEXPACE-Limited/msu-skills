---
name: maple-mob-boss-magnus-structure
description: |
  Magnus single-part boss rendering: 1 part, 7 attacks, movement.
  Load when rendering Magnus (8880000).
user-invocable: true
disable-model-invocation: false
---

# Magnus — Single-Part Boss Rendering

Magnus is a **single-part boss** with rich attack animations and movement.

## Part

| Part ID   | Name   | noFlip | bodyAttack |
|-----------|--------|--------|------------|
| 8880000   | Magnus | 0      | 0          |

## Actions

| Action | Frames | Description |
|--------|--------|-------------|
| stand | 8 | Idle |
| move | 8 | Walk/hover |
| attack1 | 26 | |
| attack2 | 17 | |
| attack3 | 33 | |
| attack4 | 58 | Long heavy attack |
| attack5 | 50 | |
| attack6 | 20 | |
| attack7 | 20 | |
| die1 | 42 | |
| hit1 | 1 | |

## Data Path

CDN: `https://resource-static.msu.io/data/Mob/8880000.json`

## Notes

- Hard Magnus (8880000) has no body attack — damage comes from attack actions only.
- `attack4` (58 frames) and `attack5` (50 frames) are the longest animations.
- Normal (8880002) and Easy (8880010) are separate mob IDs with different stats.
