---
name: balance-tuning
description: Reviews and tunes game balance across difficulty and progression curves, session pacing, option or strategy trade-offs, and reward economies. Use when players report that a game is too hard, easy, short, long, or grindy; a weapon, upgrade, or strategy dominates; damage, health, spawn, drop, price, or progression values need tuning; or a requested pre-release balance pass has not been validated. Establishes the target experience, measures the relevant model, and reports or applies specific number changes with before-and-after evidence.
---

# Balance Tuning

Measure balance against an intended experience. Establish that intent, model the
relevant system, and close the measured gap.

## 1. Inspect the project and request

Identify the engine or runtime, entry point, run and test commands, design documents,
and where tunable values live. Determine whether the user asked for an audit or for
changes: an audit ends with proposals; a tuning request may apply numerical changes.

## 2. Establish the target

Read the target from design documents or ask the user. If it remains unspecified,
state a reasonable assumption and continue unless that assumption would materially
change the work.

Capture only the targets relevant to the request:

| Target | Example |
|---|---|
| Session | one run lasts 3–5 minutes |
| Audience | first-time player, no genre experience |
| Difficulty | gentle opening, one late spike |
| Failure budget | two losses before a win is expected |
| Choice | each build has a situation where it is useful |
| Economy | a core upgrade is affordable every two runs |

## 3. Select and scope the model

Choose the model that matches the reported problem:

- **Progression or difficulty** — outcomes across time, levels, waves, or encounters.
- **Options or strategies** — benefit, cost, risk, and opportunity cost across
  representative situations.
- **Economy** — resource sources, sinks, balances, purchase cadence, and time to goal.
- **Session pacing** — active play, downtime, decisions, rewards, and failure timing.

Read [modeling-patterns.md](references/modeling-patterns.md) for the selected model.

Collect the values that materially affect that model and record each value's file and
line. Scope the inventory around the affected loop instead of cataloguing unrelated
systems. Treat different values in several locations as a consistency risk only after
confirming that they represent the same concept.

## 4. Measure the current result

Use the strongest method the project supports:

1. **Simulate.** Run reproducible batches with recorded seeds. Increase the sample until
   the relevant averages, quantiles, or rare-event rate are stable enough for the
   decision; do not choose a fixed run count without regard to variance.
2. **Compute.** Derive the outcome from the tunables. State assumptions such as hit
   rate, uptime, player skill, route, and exposure.
3. **Play.** Record an observed session when simulation or calculation is unavailable.
   Label it as a session, not a distribution.

Report the shape or comparison behind the verdict, not only “balanced” or
“unbalanced.” Distinguish measurements from source-based estimates.

## 5. Diagnose and change

Name the measured defect: a flat curve, cliff, dominant option, grind, runaway lead,
dead choice, excessive downtime, or result outside the target range.

For each proposal, report the file and value, current → proposed, expected effect, and
the evidence behind it. Prefer the smallest coherent set of changes. Isolate levers
when attribution matters; change interacting values together only when the group has a
clear purpose, such as preserving a ratio.

Apply numerical changes only when the request authorizes it. Propose mechanics,
content, or win-condition changes separately because they are design decisions.

## 6. Verify

Re-run the same measurement after authorized changes. Completion requires:

- a comparable before-and-after result against the target;
- assumptions, seeds, sample size, and uncertainty recorded where relevant;
- the affected loop rechecked for regressions and unintended dominant choices;
- any unverified conclusion clearly labelled.

## Constraints

- Preserve the intended feel. “Hard” is a valid target.
- Judge random outcomes by distributions. Wide variance may itself be a balance defect.
- If the same seed, initial state, ordered inputs, build, and simulation conditions
  produce different results, use the `determinism-audit` skill; that is a determinism
  defect rather than a balance distribution.
