# Game-feel catalog

Each entry: what it is, the symptom when it is missing, which site it lives at, values that
work as a starting point, a sketch, and the interactions to check. Values are starting points
for a proposal row, not laws — a floaty game and a tight game sit at opposite ends of every
range. All timers are milliseconds driven by `dt`, never frame counts.

## Applicability by movement model

| Movement model | Audit these rows |
|---|---|
| Side-scrolling platformer | 1–10, 18–20; add 11–14 when it has attacks or dashes |
| Runner (auto-scroll, jump/slide) | 1–5, 10, 18–20 |
| Top-down, twin-stick, action | 11–17, 18–20; 7 when movement is not instant |
| Physics-driven (rigid bodies, forces) | 4, 5, 7 through forces and damping; 1, 2, 10, 11, 18–20; never nudge positions (6, 8) — shape the colliders instead |
| Grid, lane, or turn-based | 11 (queued moves), 19, 20; the rest do not apply |

## Platformer

### 1. Coyote time
- **What** — a jump is still accepted for a short window after walking off a ledge.
- **Missing** — "절벽 끝에서 점프가 씹혀요": the frame the player sees the edge is already airborne.
- **Site** — the jump-start condition, next to `grounded`.
- **Values** — 80–150 ms (100). Past 200 it reads as a double jump.
- **Sketch**
  ```
  if grounded: coyote = COYOTE_MS else: coyote -= dt_ms
  canJump = grounded or coyote > 0
  on jump: coyote = 0
  ```
- **Check** — the jump itself clears the timer, so leaving the ground by jumping cannot re-arm it; a press buffered (2) during the window jumps.

### 2. Jump buffer
- **What** — a jump pressed shortly before landing fires on the first grounded frame.
- **Missing** — "착지 직전에 누르면 안 뛰어요"; the player mashes.
- **Site** — input read (a press stamps `jumpBuffered = BUFFER_MS`) and the jump start (consumes it).
- **Values** — 80–150 ms (120). Longer than the shortest landing-to-jump animation feels laggy.
- **Sketch**
  ```
  on jump press: buffer = BUFFER_MS
  buffer -= dt_ms
  if buffer > 0 and canJump: jump(); buffer = 0
  ```
- **Check** — consumed once; needs press detection (10), a held key must not refill it every frame.

### 3. Variable jump height (jump cut)
- **What** — releasing the jump early shortens the jump.
- **Missing** — one fixed arc; small hops are impossible; "점프가 너무 붕 떠요".
- **Site** — input read on release, applied in the integrate step while rising.
- **Values** — on release while `vy < 0`: `vy *= 0.4–0.5`; or a minimum jump time of 60–100 ms before the cut may act.
- **Sketch**
  ```
  on jump release: if vy < 0: vy *= CUT_MULT
  ```
- **Check** — acts only while rising, never on the way down; a buffered jump (2) that fires after the key is already up is a full jump unless you decide otherwise — state it.

### 4. Asymmetric gravity and apex hang
- **What** — falling is faster than rising, and gravity eases near the apex.
- **Missing** — symmetric parabola: floaty descent, no hang time to steer.
- **Site** — the integrate step, where gravity is added.
- **Values** — fall multiplier 1.5–2.5 (1.8); apex band `|vy| < 40–80 px/s` with gravity × 0.5; hold-to-rise variant instead of (3): gravity × 0.5 while the key is held and rising.
- **Sketch**
  ```
  g = GRAVITY
  if vy > 0: g *= FALL_MULT
  elif abs(vy) < APEX_BAND: g *= APEX_MULT
  vy += g * dt
  ```
- **Check** — jump velocity may need retuning to keep the same peak height; document the before/after peak.

### 5. Terminal fall velocity
- **What** — a cap on downward speed.
- **Missing** — long falls tunnel through thin platforms and land uncontrollably.
- **Site** — the integrate step, after gravity.
- **Values** — 1.5–2 × jump speed; with (4) check it against the fall multiplier.
- **Check** — a cap below the one-frame platform thickness at the chosen `dt` clamp, or collision sweeps, to stop tunnelling.

### 6. Corner correction
- **What** — a move blocked by a corner is nudged sideways or upward when the overlap is small.
- **Missing** — "모서리에 걸려요": a head bonk on a ceiling edge, or a foot catching a ledge, stops the move dead.
- **Site** — collision resolve, in the branch that blocks the move.
- **Values** — nudge up to 4–8 px, or ≤ ¼ of the hitbox on that axis.
- **Sketch**
  ```
  on horizontal block by p: overlapY = min(bottom - p.top, p.bottom - top)
    if overlapY <= CORNER_PX and the shifted box is clear: shift y by overlapY, keep vx
  on ceiling block near an edge: same with x
  ```
- **Check** — nudge only when the shifted box is clear of every solid; never nudge into a wall or across a one-way platform.

### 7. Acceleration, deceleration, air control
- **What** — velocity ramps to target; ground and air rates differ; turning around gets a boost.
- **Missing** — "뻑뻑해요" or "미끄러워요": velocity snaps to ±max or stops instantly, or slides.
- **Site** — the integrate step, between input and position.
- **Values** — ground: reach max in 80–200 ms, stop faster than start (decel 1.2–2 × accel); air control 50–80 % of ground accel; turnaround multiplier 1.5–2 when input opposes velocity.
- **Sketch**
  ```
  target = input * MAX
  rate = grounded ? (target == 0 ? DECEL : ACCEL) : AIR_ACCEL
  if sign(target) != sign(vx) and target != 0: rate *= TURN_MULT
  vx = moveToward(vx, target, rate * dt)
  ```
- **Check** — `moveToward` overshoot at large `dt`; decel to exactly zero, not asymptotically.

### 8. Slope and step handling
- **What** — small ledges are stepped over; slopes keep the body attached.
- **Missing** — one-tile lips stop a walk; slopes launch the body or make it stutter.
- **Site** — collision resolve.
- **Values** — step height ≤ ¼ of the hitbox; slope snap probe 2–4 px below the feet while grounded.
- **Check** — step-up only when the raised box is clear and the move is horizontal; never while rising.

### 9. Grounded detection by probe
- **What** — `grounded` comes from a short downward probe, not from a position equality.
- **Missing** — `grounded` flickers on every frame, disabling (1) and (2) and re-triggering land events.
- **Site** — collision resolve, after vertical movement.
- **Values** — probe 1–2 px; hold `grounded` for one frame after a probe miss when (1) is not present.
- **Check** — a one-way platform reports grounded from above only.

### 10. Press-vs-hold detection
- **What** — a key-down edge is distinct from the held state.
- **Missing** — holding jump auto-bounces on landing; buffers (2, 11) refill every frame.
- **Site** — input read.
- **Sketch** — `pressed = down && !wasDown` per action, computed once per frame; ignore key repeat.
- **Check** — decide and state the hold policy: bounce on hold (arcade) or one jump per press.

## Action and top-down

### 11. Action input buffer
- **What** — an action pressed during another action's lock fires when the lock ends.
- **Missing** — "휘두르는 도중에 누른 입력이 사라져요".
- **Site** — input read (stamp) and action start (consume).
- **Values** — 100–300 ms; longer than the longest lock it must cover, or it cannot do its job.
- **Sketch**
  ```
  on press: buf[action] = BUFFER_MS
  if buf[action] > 0 and free: start(action); buf[action] = 0
  buf[action] -= dt_ms
  ```
- **Check** — check-then-decay, so a buffer does not hit zero on the frame it is needed; one buffer per action, latest press wins.

### 12. Cancel windows
- **What** — recovery frames of an action can be cancelled into movement, dash, or the next action.
- **Missing** — every action locks to its last frame; combat feels sluggish.
- **Site** — action state machine.
- **Values** — cancel allowed after 50–70 % of the action; into dash earlier than into attack.
- **Check** — a cancel does not skip the hit frame; cooldowns still count from the original start.

### 13. Hurtbox smaller than the sprite, generous hitboxes
- **What** — the box that takes damage is inset; the boxes that deal the player's damage are not.
- **Missing** — "스치기만 해도 맞아요"; conversely "분명 맞췄는데 안 맞아요".
- **Site** — collision resolve, in the damage checks — never the drawing.
- **Values** — hurtbox 60–80 % of the sprite, centred or biased away from the facing direction; the player's attack boxes 110–130 % of the visual.
- **Check** — the debug overlay draws both boxes; the sprite and the render code do not change.

### 14. Post-hit invulnerability
- **What** — no further damage for a short time after a hit.
- **Missing** — two overlapping enemies take two hearts in one frame; contact damage chains.
- **Site** — damage resolve; a timer on the entity.
- **Values** — 500–1000 ms with a visible blink; knockback optional.
- **Check** — invulnerability does not cancel the hit that started it; blink is presentation, so keep it to the render pass.

### 15. Top-down acceleration and facing memory
- **What** — short ramps on movement; the last non-zero input direction is remembered for dashes and attacks.
- **Missing** — dashes and attacks go nowhere on release; movement is abrupt or slides.
- **Site** — integrate step; input read for facing.
- **Values** — 50–120 ms to full speed; facing updated only from non-zero input.
- **Check** — facing must not reset to a default on release.

### 16. Diagonal normalisation
- **What** — the input vector is length-clamped so diagonals are not faster.
- **Missing** — √2 speed on diagonals; enemies that "chase" diagonally overtake.
- **Site** — input read.
- **Sketch** — `len = hypot(ix, iy); if len > 1: ix /= len; iy /= len`.

### 17. Focus-loss key reset
- **What** — every tracked key is released when the window loses focus.
- **Missing** — a key stays "held" after alt-tab; the character runs into a wall until re-pressed.
- **Site** — input read.
- **Sketch** — on `blur` / visibility hidden: clear the key map and the buffers.

## Cross-cutting

### 18. Frame-rate independence
- **What** — integration uses `dt` (or a fixed step with an accumulator) and `dt` is clamped after a tab switch.
- **Missing** — everything above changes with the display's refresh rate; windows in frames are twice as long at 30 fps.
- **Site** — the loop.
- **Values** — clamp `dt` at 33–50 ms; fixed step 1/60 or 1/120 with the remainder carried.
- **Check** — a prerequisite row when absent: the catalog's timers are undefined without it. Determinism questions beyond this belong to the `determinism-audit` skill.

### 19. Input latency
- **What** — input is read at the start of the step and acts in the same frame; touch and pointer paths add no delay.
- **Missing** — a one-frame lag on every action; on touch, a 300 ms tap delay or scroll gestures eating swipes.
- **Site** — input read; the page for touch (`touch-action: none` on the game surface, pointer events, no passive-scroll conflicts).
- **Check** — a press on frame N moves on frame N, not N + 1.

### 20. Windows in milliseconds
- **What** — every window above is stored in ms and compared against `dt`-accumulated time.
- **Missing** — "6 frames" of coyote time becomes 200 ms on a 30 fps phone.
- **Site** — everywhere a timer lives; the constants block or the tuning-panel schema.
