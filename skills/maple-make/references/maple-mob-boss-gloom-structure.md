---
name: maple-mob-boss-gloom-structure
description: |
  Gloom single-part boss rendering: 1 part (Weakened Gloom 8644611),
  noFlip. Load when rendering Gloom.
user-invocable: true
disable-model-invocation: false
---

# Gloom — Single-Part Boss Rendering

Gloom is a **single-part boss** in the viewer, using the Weakened Gloom (Story) variant. The boss has a large sprite with skill-based attacks.

## Part

| Part ID   | Name           | noFlip | bodyAttack |
|-----------|----------------|--------|------------|
| 8644611   | Weakened Gloom | 1      | 0          |

## Actions

| Action | Frames | Description |
|--------|--------|-------------|
| stand | 1 | Static idle (single frame) ⚡effect-only (dummy sprite) |
| attack1 | 52 | Primary attack — very long |
| die1 | 1 | ⚡effect-only (dummy sprite) |
| hit1 | 1 | ⚡effect-only (dummy sprite) |
| skill1 | 14 | |
| skill2 | 24 | |
| skill3 | 37 | Longest skill |
| skill4 | 1 | ⚡effect-only (dummy sprite) |

## Data Path

CDN: `https://resource-static.msu.io/data/Mob/8644611.json`

## Difficulty Variants

| Mode | ID | Name | Has Actions |
|------|----|------|-------------|
| Story | **8644611** | Weakened Gloom | ✅ (used) |
| Normal | 8644650 | Giant Monster Gloom | ✅ |
| Hard | 8644655 | Giant Monster Gloom | ❌ (empty) |

## Related Mobs

| ID | Name | Role |
|----|------|------|
| 8644612 | Gloom Core | Inner core entity |
| 8644613 | Tentacle | Boss summon |
| 8644628 | Gloom Core | Alternate core |
| 8644638/651 | Gloom's Soul | Soul phase entity |
| 8644614–627 | Soot Beast/Talon/Slug/Core/Glare | Minion mobs |

## Rendering Notes

> **`stand` is a ⚡effect-only 1-frame dummy sprite** — playing `stand` as idle renders nothing visible.
> Use an alternative action as the idle animation when displaying Gloom in a game.
>
> | Use case | Action | Frames |
> |----------|--------|--------|
> | Idle (recommended) | `skill1` | 14 |
> | Idle (alternative) | `skill2` | 24 |
> | Main attack display | `attack1` | 52 |
>
> `detectDummyActions` can auto-detect this at runtime and fall back to the next visible action.

## Notes

- `noFlip = 1` — never flip horizontally.
- `stand` and `die1` are single-frame — the boss is mostly static with skill overlays.
- `attack1` (52 frames) is the main visible animation.
- `skill3` (37 frames) is the longest skill animation.
- Hard mode (8644655) has **no actions** in data — uses programmatic rendering.
- Normal mode (8644650) has a different moveset (skill-based, no attack1).
