---
name: maple-mob-boss-will-structure
description: |
  Will multi-part boss rendering: 3 parts, 3 phases with form progression.
  Load when rendering Will (8880300–8880302).
---

# Will — Multi-Part Boss Rendering

Will is a **3-part, 3-phase boss** with progressive form changes across three separate field instances.

## Parts

| Part ID   | Label | Role                   | noFlip |
|-----------|-------|------------------------|--------|
| 8880300   | P1    | Phase 1 — Sorcerer     | 0      |
| 8880301   | P2    | Phase 2 — Spider form  | 0      |
| 8880302   | P3    | Phase 3 — Web form     | 0      |

## Phase System

| Phase | Visible Parts | Description |
|-------|---------------|-------------|
| P1    | P1            | Sorcerer — minimal animations (1-frame stand/skills) |
| P2    | P2            | Spider — 10 attacks + 3 skills, fully animated |
| P3    | P3            | Web — 7 attacks + 3 skills, Narrow Web mechanic |

> Phase 1 has mostly 1-frame actions in data — likely uses programmatic/effect-based rendering.

## Actions per Part

| Part | Actions |
|------|---------|
| P1 (8880300) | stand(1) ⚡, die1(1) ⚡, hit1(1) ⚡, skill1(1) ⚡, skill2(1) ⚡, skill3(1) ⚡ — ⚡effect-only (dummy sprite) |
| P2 (8880301) | stand(16), move(16), attack1(20), attack2(20), attack3(20), attack4(30), attack5(20), attack6(20), attack7(16), attack8(1), attack9(1), attack10(1), die1(64), hit1(16), skill1(16), skill2(1), skill3(80) |
| P3 (8880302) | stand(16), attack1(25), attack2(25), attack3(1), attack4(25), attack5(1), attack6(1), attack7(1), die1(42), hit1(16), skill1(24), skill2(31), skill3(31) |

Frame counts in parentheses.

### Notable Actions

- **P1** is almost entirely 1-frame — the sorcerer form likely uses overlaid effect layers.
- **P2 `skill3`** — 80 frames, extremely long animation.
- **P2 `die1`** — 64 frames, long death animation.
- **P3** has the Narrow Web mechanic.
- **P2 `attack4`** — 30 frames, the longest normal attack.

## Data Paths

CDN base: `https://resource-static.msu.io/data/`

| Resource | CDN Path |
|----------|----------|
| P1 JSON | `Mob/8880300.json` |
| P2 JSON | `Mob/8880301.json` |
| P3 JSON | `Mob/8880302.json` |

## Related Mobs

| ID | Name | Role |
|----|------|------|
| 8880303/304 | Will P1_A/P1_B | Alternate P1 forms (Blue/Other room) |
| 8880305/307 | Beholder's Eye | Phase 2/3 summon obstacles |
| 8880306/308 | Abyssal Veil | Phase 2/3 wall obstacles |
| 8880310–312 | Will's Reflection | Story mode (no actions in data) |
| 8880360–362 | Easy Will P1/P2/P3 | Easy difficulty |

## Rendering Notes

> **P1 (8880300) cannot be rendered** — every action (`stand`, `hit1`, `die1`, `skill1–3`) is a ⚡effect-only 1-frame dummy sprite with no visible pixels.
> Always use **P2 (8880301) or P3 (8880302)** when displaying Will in a game or viewer.
>
> | Use case | ID to use | Reason |
> |----------|----------|--------|
> | Single character display | **8880301** (Spider) | stand 16 frames, move 16 frames, 10 attack actions |
> | Final form display | **8880302** (Web) | stand 16 frames, 7 attack actions |

## Notes

- Phase 1 (8880300) has only 1-frame animations — the visual appearance relies heavily on Effect overlays.
- Each phase runs in a separate field map.
- LunarPower gauge is active in all 3 phases.
- No HP linking between phases — each is independent.
