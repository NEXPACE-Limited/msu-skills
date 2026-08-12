# Provisional device baselines

Use these only when a browser game's support matrix is absent. Project requirements and
target-platform guidance override every value here.

## Viewports

| Case | Viewport | Capabilities |
|---|---|---|
| Small phone portrait | 360 × 800 | touch, safe-area inset |
| Small phone landscape | 800 × 360 | touch, safe-area inset |
| Tablet portrait | 820 × 1180 | touch, possible keyboard or pointer |
| Tablet landscape | 1180 × 820 | touch, possible keyboard or pointer |
| Laptop | 1440 × 900 | keyboard, pointer, possible touch |
| Wide desktop | 2560 × 1440 | keyboard, pointer, possible controller |

Also test live resizing between representative cases. Add a controller case when the
project exposes controller bindings.

## Interaction heuristics

- Use the target platform's touch-target requirement. With no requirement, 44 × 44 CSS
  px is a conservative starting point; spacing and the consequence of a missed tap
  matter as much as target size.
- Use the project's accessibility target for text and contrast. With none, start at 16
  CSS px for body text and 4.5:1 contrast for normal text, then test against the actual
  background and viewing distance.
- Place touch controls within comfortable reach, but ensure the pressing finger does
  not hide the action's critical feedback.
- Acknowledge input immediately. Show progress or a waiting state when delay becomes
  perceptible or its duration is uncertain; do not use a single-frame threshold.
- Treat touch, pointer, keyboard, and controller as capabilities that may coexist on one
  device.
