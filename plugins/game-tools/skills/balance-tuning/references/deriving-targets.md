# Deriving a target when none is stated

Read this when the target could not be obtained from a design document or from the user.
It supplies the comparison a verdict needs, not the verdict.

## Target sources, strongest first

| # | Source | What it supports |
|---|---|---|
| 1 | A target declared for this project | A verdict against the declared intent |
| 2 | The project's own history — the value before the change, a previous measurement, the last release | A verdict against that baseline |
| 3 | A comparable inside the same game — sibling options at the same tier, adjacent levels, the other routes | A relative verdict, stated as a ratio |
| 4 | A genre convention | A verdict only when the report names the source it came from |
| 5 | None of the above | No verdict. Report the measurement and what it would take to judge it |

Work down the list and stop at the first source available. Name that source in the
report whatever its rank; a reader cannot weigh a verdict without knowing what the
measurement was compared against.

Rank 3 is stronger than it looks and exists in almost every project. "This weapon deals
340" cannot be judged. "This weapon deals 1.9× the median of its tier while costing 1.1×
as much" can be, and it needs nothing from outside the game.

## Do not invent a threshold

There is no published constant to fall back on, and the literature is explicit about why.
A formal analysis of fourteen authors writing on game balancing found no two sharing a
definition of the term and no central concept underneath it. Work that balances games
computationally treats balance as an objective the designer declares — a win rate
together with a chosen engagement measure, or a simulated economy optimised toward stated
targets — rather than a ratio to check against, and one economy-balancing framework
states outright that it defines no threshold for a balanced economy, leaving it to the
objective.

An unsourced number reads as authority once it is in a report. Rank 5 is the honest
output, and it still moves the work forward: it names the decision the project owes
itself.

## What to record with a measurement

- the actor that produced it and its capability parameters;
- the seeds, the sample size, and the build;
- the conditions held fixed, and the ones known to vary;
- which rank above the target came from, or that none was available.

A measured rate is evidence about the actor that produced it. Automated measurement does
not observe the player's perspective, so state what the number cannot cover instead of
leaving a reader to assume it covers everything.

## Sources

- No shared definition of game balancing across the design literature: Becker & Görlich,
  "What is Game Balancing? — An Examination of Concepts", ParadigmPlus 1(1), 2020.
  <https://journals.itiud.org/index.php/paradigmplus/article/view/7>
- Balance as a declared multi-objective optimisation: Volz, Rudolph & Naujoks,
  "Demonstrating the Feasibility of Automatic Game Balancing", 2016.
  <https://arxiv.org/abs/1603.03795>
- An economy-balancing framework that defines no balanced-economy threshold: Rupp &
  Eckert, "GEEvo: Game Economy Generation and Balancing with Evolutionary Algorithms",
  2024. <https://arxiv.org/abs/2404.18574>
- Deriving balance targets from a game's own player base rather than from constants:
  Pfau & Seif El-Nasr, "On Video Game Balancing: Joining Player- and Data-Driven
  Analytics", Games: Research and Practice 2(3), 2024.
  <https://arxiv.org/abs/2308.07576>
