# Balance modeling patterns

Read only the section selected by the main workflow.

## Progression or difficulty

Measure the outcome at each meaningful step rather than averaging the whole game.
Useful metrics include time to win or fail, time to kill, damage or mistakes tolerated,
resource margin, success probability, and recovery opportunity.

For combat, compute effective damage after hit rate, uptime, mitigation, cooldowns, and
exposure. For non-combat play, choose the equivalent constraint: moves, time, attempts,
precision, route length, or resource margin. Compare the measured shape with the target
shape and locate the first step where they diverge.

## Options or strategies

Build a scenario matrix. Rows are representative situations; columns are weapons,
upgrades, routes, or strategies. Compare:

- benefit in the scenario;
- acquisition and ongoing cost;
- risk and execution difficulty;
- setup time and opportunity cost;
- counters or situations where the option should be weak.

Equal numbers are not the goal. An option is dominant when it wins across the relevant
scenarios without paying a compensating cost. An option is dead when no intended
scenario justifies choosing it.

## Economy

Model stock and flow over the intended session horizon:

- starting balance and grants;
- expected sources per session or action;
- mandatory and optional sinks;
- time or sessions to each important purchase;
- caps, losses, refunds, and compounding rewards.

Compare the expected path and meaningful low/high quantiles. Check whether players can
become permanently stuck, whether early luck compounds without recovery, and whether
currency accumulates after its useful sinks disappear.

## Session pacing

Split a representative session into phases: learning, active challenge, decision,
reward, recovery, and transition. Measure the duration and frequency of each phase.
Look for long stretches without decisions, repeated transitions, rewards arriving too
late to affect play, or failure occurring before the core loop becomes legible.
