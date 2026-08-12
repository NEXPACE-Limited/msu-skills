# RTL and parameterized grammar

Read this reference when a target locale uses right-to-left presentation or messages
whose grammar changes around inserted values.

## Right-to-left presentation

- Derive document and component direction from the active locale, not from individual
  translated strings.
- Use the platform's bidirectional text support and isolate interpolated values so a
  player name, number, or Latin identifier does not reorder surrounding text.
- Mirror directional layout and navigation where the target platform expects it. Keep
  inherently semantic direction unchanged: clocks, media controls, maps, and game-world
  coordinates may need case-by-case treatment.
- Place start/end spacing and alignment through direction-aware properties rather than
  hardcoded left/right positions when the UI system supports them.
- Test mixed-script strings, numbers, punctuation, controller prompts, and text drawn in
  world space as well as menus.

RTL support is complete only when catalog, input, rendering, and layout checks pass; do
not leave requested RTL work as an unspecified follow-up.

## Grammar around parameters

Translate complete messages and give translators enough context. Prefer a message that
avoids agreement with an inserted value when that preserves the intended copy.

When agreement is required:

- use the localization system's select, gender, case, or grammatical-variant feature;
- otherwise store the required grammatical metadata with the localized noun and select
  an explicit message variant;
- use a locale-specific formatter only when its input and supported forms are defined
  and tested;
- never infer gender, case, or declension from source-language spelling.

For Korean particles, prefer a rephrased complete message. If a particle-aware
formatter is required, run it on the final localized display form and test native words,
Latin text, digits, punctuation, and empty values. Keep this formatter specific to the
Korean locale rather than embedding Korean rules in the generic lookup layer.
