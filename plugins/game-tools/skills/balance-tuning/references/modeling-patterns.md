# Balance modeling patterns

Read the two rules below, then only the section the main workflow selected.

## What drives a measured run

A simulated result needs an actor. Name it before running: a recorded input sequence, a
search or heuristic agent, or a player model with explicit capability parameters — input
precision, reaction delay, actions per second. Record the actor and its parameters with
every number it produces.

The actor's capability is part of the measurement rather than a detail of it. A step
measured as unfair by a delayed actor and fair by an immediate one is both, for two
different players. Running the same scenario under two capability settings separates
"this step is hard" from "this step is hard for this player"; report both when
difficulty is the question.

If nothing can drive the game, do not report a number shaped like a simulation. Compute
the outcome from the tunables instead and say which method produced each figure.

## Decidable without a target

Each section below ends with defects that resolve to true or false with no target and no
threshold. Check them whatever the target situation is — they are the findings that
survive a project with no design document. One of them applies to every model: an
effective value that disagrees with the displayed one once multipliers combine, which
leaves every other measurement in that system wrong by a knowable factor.

## Progression or difficulty

Measure the outcome at each meaningful step rather than averaging the whole game.
Useful metrics include time to win or fail, time to kill, damage or mistakes tolerated,
resource margin, success probability, and recovery opportunity.

For combat, compute effective damage after hit rate, uptime, mitigation, cooldowns, and
exposure. For non-combat play, choose the equivalent constraint: moves, time, attempts,
precision, route length, or resource margin. Compare the measured shape with the target
shape and locate the first step where they diverge.

Obtaining the numbers: treat the difficulty of a step as the probability that the
modelled actor fails it, not as a stat total, and estimate it by repeating the step
across recorded seeds and counting outcomes. Report the rate with its sample size. When
a step yields a score or a survival time instead of pass or fail, summarise how fast the
distribution decays rather than its mean — a harder variant makes high results
exponentially less likely, and the decay rate orders variants that share an average.

Decidable without a target: a requirement no reachable configuration satisfies; a
failure state with no path back into play.

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

Obtaining the numbers: filling the matrix by estimate is its weakest form. Where the
game can be driven, measure a cell by restriction — run a capable actor against a
standard opponent, then repeat with the option removed, capped, or forbidden, and
compare the outcome rate. That difference is the option's contribution. No difference
means the option does no work; a collapse when only that option is withheld means
nothing else covers its role. Restricting how far ahead the actor may plan separates an
option's immediate value from its long-term strategic value.

Restrict one thing per run, or the difference cannot be attributed. The same ablation
answers questions in the other models: withhold one mechanic and re-measure the failure
rate, or one faucet and re-measure the time to a purchase.

Decidable without a target: an option strictly better than another at the same or lower
cost.

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

Obtaining the numbers: express each currency as a graph of sources, drains, pools, and
converters, carrying a rate and a trigger condition on every arc, then run it over the
intended horizon. Every arc value is a tunable the diagnosis can name and change. Run it
enough times to report the quantiles above rather than one expected path. A persistent
currency is an ordinary economy: supply, sinks, price levels, and accumulation behave as
economics describes them.

Decidable without a target: a resource with no sink at all; a loop that produces a
resource without consuming a constrained input, leaving generation unbounded.

## Session pacing

Split a representative session into phases: learning, active challenge, decision,
reward, recovery, and transition. Measure the duration and frequency of each phase.
Look for long stretches without decisions, repeated transitions, rewards arriving too
late to affect play, or failure occurring before the core loop becomes legible.

This model has the weakest measurement support of the four. Phase durations come from an
observed or recorded session; label them as one session rather than a distribution
unless the game can be driven repeatedly.

## Sources

The measurement procedures above come from published work, which supplies methods rather
than threshold values.

- Restriction as a balance measurement: Jaffe, Miller, Andersen, Liu, Karlin & Popović,
  "Evaluating Competitive Game Balance with Restricted Play", AIIDE 2012.
  <https://ojs.aaai.org/index.php/AIIDE/article/view/12513>
- Difficulty as probability of failure: Aponte, Levieux & Natkin, "Measuring the level of
  difficulty in single player video games", Entertainment Computing 2(4), 2011.
  <https://www.sciencedirect.com/science/article/abs/pii/S1875952111000231>
- Decay of a score distribution as a difficulty estimate, and player models with
  precision, reaction time and actions per second: Isaksen, Gopstein & Nealen,
  "Exploring Game Space Using Survival Analysis", FDG 2015.
  <https://www.semanticscholar.org/paper/889a067e24cc7fd2f53127d3be27973eff7b1f27>
- Economies as simulable graphs of sources, drains, pools and converters: Adams &
  Dormans, *Game Mechanics: Advanced Game Design*, 2012 (the Machinations framework).
- Economics applied to virtual currencies: Lehdonvirta & Castronova, *Virtual Economies:
  Design and Analysis*, MIT Press, 2014.
  <https://mitpress.mit.edu/9780262535069/virtual-economies/>
