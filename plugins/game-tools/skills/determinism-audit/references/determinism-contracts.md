# Determinism contracts

Use the narrowest contract the game actually needs. Stronger contracts cost more and
may constrain engines, physics, networking, and content updates without player value.

## Flake stability

Goal: the same test or interaction behaves reliably under its stated environment.

Control hidden inputs, test isolation, clocks, external services, async readiness, and
thread safety. Exact bitwise state is usually unnecessary; assertions may use justified
tolerances.

## Same-platform replay

Goal: a replay reproduces on the supported build and platform.

Record the build or content version, initial state, deterministic RNG state, ordered
inputs by simulation tick, and external events that affect simulation. Version the
replay format and reject incompatible data explicitly.

## Cross-platform replay

Goal: the recorded simulation agrees across supported platforms.

In addition to replay inputs, control platform-dependent math, physics, collection
order, serialization, precision, and compiler behavior. Use periodic canonical state
checksums and compare the first differing tick. Quantization or fixed-point arithmetic
may be required for state that must agree exactly.

## Lockstep

Goal: peers advance identical deterministic state from the same ordered inputs.

Define the authoritative tick, input delay and ordering, missing-input behavior, state
checksum cadence, and desync recovery. Keep cosmetic randomness and presentation state
outside the authoritative simulation. A lock prevents simultaneous access but does not
define the order of peer-visible results.

## Cross-version compatibility

Goal: old replays remain valid after simulation or content changes.

Treat this as a separate product requirement. Preserve the old simulation, migrate the
recording, or declare a compatibility boundary. A seed and input trace alone cannot
reproduce behavior after the rules they execute have changed.
