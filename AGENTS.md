# msu-skills

The `msu` plugin — MapleStory Universe (NEXPACE) common skills and shared modules.
Anything reusable across MSU builder work lives here; product-specific skill sets
live in their own repositories and depend on this one.

**This repository is public on GitHub.** Everything committed here is world-readable.

## Commands

There is no build, no package manifest, and no test suite. Editing a skill means
editing `skills/<name>/SKILL.md` — that is the whole change.

```bash
claude plugin validate .claude-plugin/plugin.json   # plugin manifest
npx skills add . -l                                 # skills the skills CLI discovers
bash install.sh --target /tmp/probe                 # smoke-test the manual installer
```

The catalog entry lives in the hub, so the checks that span both repositories run there:
`bash scripts/verify.sh` in
[nexpace-skills-hub](https://github.com/NEXPACE-Limited/nexpace-skills-hub), or
`SPOKE_MSU=<path-to-this-repo> bash scripts/verify.sh --offline` to check an unreleased
change here against the catalog.

The plugin manifest emits one **expected** warning: *"CLAUDE.md at the plugin root is
not loaded as project context."* That is correct and intended — `CLAUDE.md`,
`GEMINI.md`, and `AGENTS.md` are maintainer context for working *in* this repo, not
payload for consumers of the plugin. Do not resolve the warning by deleting them. It is
also why `--strict` is not used on the plugin manifest.

`AGENTS.md` holds the content; `CLAUDE.md` and `GEMINI.md` are one-line `@` imports of
it. Gemini CLI does not read `AGENTS.md` by default, so the pointer file is what loads
this context there.

## Core principle — one source, three channels

The Agent Skills open standard (`SKILL.md`) is adopted by Claude Code, Codex CLI,
Gemini CLI, and Kimi CLI. So there is **no conversion and no build step**: the
`SKILL.md` files under `skills/` are the only source, shipped verbatim everywhere.

| Channel | Skills | `maple-lookup` MCP |
|---|---|---|
| Claude Code plugin (`msu@nexpace`) | automatic | automatic — bundled `.mcp.json`, key via `userConfig` prompt |
| `npx skills add NEXPACE-Limited/msu-skills` | automatic | **manual** — README "MCP Configuration" |
| `./install.sh` (Codex / Gemini / Kimi) | automatic | best effort — prints the Codex TOML snippet, runs `mcp add` for Gemini/Kimi when `$MSU_OPENAPI_KEY` is set |

**Do not break this shape.** Per-platform copies or build artifacts fork the source.

The skills CLI (`vercel-labs/skills`) globs for `SKILL.md` recursively and ignores
`.claude-plugin/` and `.mcp.json` entirely. Plugin packaging is therefore purely
additive for that channel — but it also means nesting skills deeper buys nothing,
so keep them flat at `skills/<name>/`.

## Layout

```
skills/<name>/SKILL.md     # the only source. name = directory name = kebab-case
skills/<name>/references/  # progressive-disclosure files the skill loads on demand
.claude-plugin/            # plugin.json (name: msu) — no marketplace.json, see below
.mcp.json                  # maple-lookup server definition, bundled with the plugin
install.sh                 # manual installer for non-Claude CLIs
AGENTS.md                  # maintainer context; CLAUDE.md and GEMINI.md @-import it
```

Plugin name is `msu`. Installation is `msu@nexpace`, and the repo root itself is the
plugin.

## The hub owns the catalog

This repository is a **spoke**. The `nexpace` marketplace lives in
[nexpace-skills-hub](https://github.com/NEXPACE-Limited/nexpace-skills-hub) and lists
this repo as the `msu` plugin, pinned to a release tag.

**Do not add a `marketplace.json` here.** A second catalog would give the same plugin a
second install identity (`msu@msu-skills` next to `msu@nexpace`), and a user who added
both would end up with two copies of every skill. The hub's `check-spokes.sh` fails the
build if this file reappears.

Nothing else changes for the other two channels: `npx skills add
NEXPACE-Limited/msu-skills` and `install.sh` still read this repository directly,
because the skills CLI has no concept of a marketplace and the hub carries no
`SKILL.md`.

## MCP ownership

**This repository owns `maple-lookup`.** The definition, the URL, and the key
prompt all live here; downstream plugins consume it through a dependency
declaration and must not redefine a server under the same name.

- `.mcp.json` holds the server. `${user_config.openapi_key}` resolves from the
  `userConfig` block in `plugin.json`, which marks the key `sensitive`.
- `.mcp.json` at the repo root is also picked up as a *project-scoped* MCP server
  when you open this repo in Claude Code. In that scope `${user_config.openapi_key}`
  does not resolve — plugin `userConfig` only applies to installed plugins. A failing
  `maple-lookup` while working *in* this repo is that, not a packaging defect.
- Never commit a key. `install.sh` echoes the env-var form only, never a value.

## Consumers

Downstream spoke plugins depend on `msu` rather than vendoring its skills, so the
source stays single. Two obligations follow:

- **Skills are called by name, not by path.** A consumer's skill body says "find the
  `maple-make` skill and follow its SKILL.md". Cross-plugin file paths break under
  Claude Code — `${CLAUDE_PLUGIN_ROOT}` points at the caller's own root, and
  `../<other-skill>/` only happens to work in flat non-Claude installs.
- **Renaming or removing a skill here is a breaking change** for anyone name-calling
  it, even though nothing in this repo references it. Same for the contract surface a
  consumer wires into (recipe IDs, profile fields).

Consumers pin `~0.<minor>` because in 0.x a minor bump is the breaking bump.

## Versioning and release

Bump `version` in `plugin.json` whenever `skills/`, `.mcp.json`, or `.claude-plugin/`
changes. That value is the release, and three places have to agree once it ships:

| Value | Where |
|---|---|
| `0.2.0` | `version` in this repo's `plugin.json` |
| `msu--v0.2.0` | the git tag on this repo |
| `0.2.0` and `msu--v0.2.0` | the hub catalog entry's `version` and `source.ref` |

Releases are tags. `claude plugin tag --push` creates `msu--v{version}`. Dependency
pins in consumer plugins resolve against these tags, so an unpushed tag means an
unresolvable dependency for everyone else.

A release reaches users in two steps: tag here, then bump the pin in the hub. Until the
hub bumps, `msu@nexpace` still installs the previous tag — that gap is the deployment
gate, not a bug.

## Writing skills

- `skills/<name>/SKILL.md`, with `name` in frontmatter equal to the directory name,
  kebab-case.
- The frontmatter `description` is **the LLM's skill-matching input**, not
  documentation. Write it at final quality even for a stub.
- **Do not name CLI-specific tools.** `AskUserQuestion` and friends only exist in
  Claude Code. Describe the behavior ("ask the user") so all four CLIs can follow it.
- Keep `SKILL.md` thin and push detail into `references/`, loaded on demand. The
  always-on cost of a skill is its frontmatter; the body is paid on every invocation.
- Skill name ≠ plugin name. `skills/maple-make/` is namespaced as `msu:maple-make`.

## Public-repository rules

- **Do not name unreleased NEXPACE products** in any committed file, including this
  one. Refer to them as "product-specific skill sets" or "downstream spokes". Public
  release timing differs per product and this repo is already public.
- README carries the legal notices (API terms, model-training prohibition, credential
  handling). Do not drop or soften them when restructuring.
- README is English. Keep committed prose in English for consistency.
