# msu-skills

The `msu-skills` catalog — MapleStory Universe (NEXPACE) common skills and shared
modules, packaged as one plugin per coupling boundary. Anything reusable across MSU
builder work lives here; product-specific skill sets live in their own repositories and
depend on these.

**This repository is public on GitHub.** Everything committed here is world-readable.

## Commands

There is no build, no package manifest, and no test suite. Editing a skill means
editing `plugins/<plugin>/skills/<name>/SKILL.md` — that is the whole change.

```bash
claude plugin validate .                            # marketplace catalog
claude plugin validate plugins/msu                  # one plugin, and its skill files
npx skills add . -l                                 # skills the skills CLI discovers
bash install.sh --target /tmp/probe                 # smoke-test the manual installer
bash install.sh --plugin msu --target /tmp/one      # ...and the single-plugin path
bash scripts/check-endpoints.sh                     # no leaked endpoint or credential
```

Pointed at the repo root the validator reads `marketplace.json`, and for every
local-path entry it also reads that plugin's `plugin.json` — so the first line covers
the packaging as a whole. The second is still worth running, because only the
plugin-directory form checks the skill, command, and hook files.

`AGENTS.md` holds the content; `CLAUDE.md` and `GEMINI.md` are one-line `@` imports of
it. Gemini CLI does not read `AGENTS.md` by default, so the pointer file is what loads
this context there.

## Core principle — one source, three channels

The Agent Skills open standard (`SKILL.md`) is adopted by Claude Code, Codex CLI,
Gemini CLI, and Kimi CLI. So there is **no conversion and no build step**: the
`SKILL.md` files under `plugins/*/skills/` are the only source, shipped verbatim
everywhere.

| Channel | Skills | `maple-lookup` MCP |
|---|---|---|
| Claude Code plugin (`msu@msu-skills`) | automatic | automatic — bundled `.mcp.json`, key via `userConfig` prompt |
| `npx skills add NEXPACE-Limited/msu-skills` | automatic | **manual** — README "MCP Configuration" |
| `./install.sh` (Codex / Gemini / Kimi) | automatic | best effort — prints the Codex TOML snippet, runs `mcp add` for Gemini/Kimi when `$MSU_OPENAPI_KEY` is set |

**Do not break this shape.** Per-platform copies or build artifacts fork the source.

**The skills CLI reads the catalog.** `vercel-labs/skills` (measured at 1.5.22) is not a
blind recursive glob: when `.claude-plugin/marketplace.json` is present it scans exactly
the plugins that catalog lists. A directory under `plugins/` with no catalog entry is
invisible to that channel — which is why `skills-discovery` in CI enumerates plugins
from the filesystem and requires every skill to turn up in the CLI's output. Forget the
entry and CI says so.

It still has no plugin *boundary* for the user: `npx skills add
NEXPACE-Limited/msu-skills` offers every catalogued plugin's skills at once, and there
is no remote sub-path form to narrow it. `--skill <name>` is the only selector, and the
README says so. `install.sh` keeps the boundary through `--plugin`. MCP configuration is
outside the Agent Skills standard, so no plugin's `.mcp.json` is applied on that channel.

## Layout

```
.claude-plugin/marketplace.json          # the catalog: msu-skills. Lists every plugin
plugins/<plugin>/.claude-plugin/         # plugin.json — name, version, userConfig
plugins/<plugin>/.mcp.json               # MCP servers this plugin owns, if any
plugins/<plugin>/skills/<name>/SKILL.md  # the only source. name = dir name = kebab-case
plugins/<plugin>/skills/<name>/references/  # files the skill loads on demand
install.sh                 # manual installer for non-Claude CLIs; --plugin selects one
scripts/check-endpoints.sh # public-repo scan, inherited from the retired hub
.github/workflows/ci.yml   # the commands above, plus guards, on every PR and push
AGENTS.md                  # maintainer context; CLAUDE.md and GEMINI.md @-import it
```

Catalog name is `msu-skills`; today it carries one plugin, `msu`, installed as
`msu@msu-skills`. Skill name ≠ plugin name ≠ catalog name.

## The repository is its own catalog

`.claude-plugin/marketplace.json` names the catalog `msu-skills` and lists each plugin
by local path (`"source": "./plugins/msu"`). Users add this repository and install from
it directly, and a release is whatever sits on `main`.

**Every plugin gets its own root under `plugins/`.** That is not cosmetic. Two entries
sharing one plugin root (`"source": "./"` twice, split by the `skills` field) do isolate
skills, but `userConfig` is read only from `plugin.json` — an entry-level `userConfig` is
silently ignored — so every plugin in the repository would inherit the MSU OpenAPI key
prompt and the `maple-lookup` server. A plugin that needs no credential must not acquire
one, which forces separate roots.

That replaced a hub-and-spoke arrangement where a separate `nexpace-skills-hub` repo
held the only catalog and pinned this one to a release tag. Two costs retired it:

- **A release took two repositories.** Tag here, then bump the pin there. Until the hub
  bumped, `msu@nexpace` kept installing the previous tag.
- **A private catalog gated a public plugin.** The hub repo is private, so adding the
  marketplace demanded access this repository does not.

**Exactly one catalog may name this plugin.** Two give it two install identities, and a
user who added both ends up with two copies of every skill. The hub still lists `msu`
pinned at `msu--v0.2.0`, so `msu@nexpace` and `msu@msu-skills` both resolve today —
dropping that entry is the follow-up that makes this rule true again.

The other two channels read this repository directly rather than through a marketplace,
but neither is indifferent to the catalog: `install.sh` walks `plugins/` on disk, and
the skills CLI scans the plugins `marketplace.json` lists. A catalog entry is what makes
a plugin real on every channel.

## MCP ownership

**The `msu` plugin owns `maple-lookup`.** The definition, the URL, and the key prompt
all live in `plugins/msu/`; downstream plugins consume it through a dependency
declaration and must not redefine a server under the same name.

- `plugins/msu/.mcp.json` holds the server. `${user_config.openapi_key}` resolves from
  the `userConfig` block in `plugins/msu/.claude-plugin/plugin.json`, which marks the
  key `sensitive`.
- A server belongs to exactly one plugin, because its `.mcp.json` sits inside that
  plugin's root. Do not put an `.mcp.json` at the repository root: it would be loaded as
  a *project-scoped* server while working in this repo, where `${user_config.*}` does
  not resolve, and it would not belong to any plugin.
- Never commit a key. `install.sh` echoes the env-var form only, never a value.

## Consumers

Downstream product plugins depend on `msu` rather than vendoring its skills, so the
source stays single. Three obligations follow:

- **Skills are called by name, not by path.** A consumer's skill body says "find the
  `maple-make` skill and follow its SKILL.md". Cross-plugin file paths break under
  Claude Code — `${CLAUDE_PLUGIN_ROOT}` points at the caller's own root, and
  `../<other-skill>/` only happens to work in flat non-Claude installs.
- **Renaming or removing a skill here is a breaking change** for anyone name-calling
  it, even though nothing in this repo references it. Same for the contract surface a
  consumer wires into (recipe IDs, profile fields).
- **A dependency names the catalog, not only the plugin.** Consumers declare
  `{ "name": "msu", "marketplace": "msu-skills", "version": "~0.<minor>" }` and list
  `msu-skills` in their own marketplace's `allowCrossMarketplaceDependenciesOn`.
  Renaming this catalog breaks every one of them.

Consumers pin `~0.<minor>` because in 0.x a minor bump is the breaking bump.

## Versioning and release

**Plugins version independently.** Touch anything under `plugins/<plugin>/` and bump
that plugin's own `version`, then merge to `main`. That is the release — no tag to cut,
no second repository to bump. A change confined to one plugin leaves the others' version
strings alone, so their installed users are not disturbed.

`version` belongs in `plugin.json` and nowhere else. The catalog entry omits it on
purpose: Claude Code always reads the `plugin.json` value and ignores a `version` in the
entry without warning, so declaring both creates a field that drifts while looking
authoritative. The consequence worth remembering is that the version string *is* the
update signal — push commits without bumping it and installed users keep the cached
copy. CI's `version-bump` job fails a PR that changes a plugin without bumping *that*
plugin, because nothing else catches it now that the hub's catalog-agreement check is
gone.

Tags are optional now. Nothing in the install path reads them, since
`/plugin marketplace add` clones the default branch, but a marketplace source does
accept a `ref`. `claude plugin tag --push` still creates `msu--v{version}` if a pinnable
ref is wanted; `msu--v0.2.0` predates this change and describes the hub era.

## Writing skills

- `plugins/<plugin>/skills/<name>/SKILL.md`, with `name` in frontmatter equal to the
  directory name, kebab-case.
- **Which plugin does it go in?** The test is the configuration surface, not the
  audience. A skill that needs the MSU OpenAPI key belongs to `msu`. A skill that holds
  no credential goes to a plugin that acquires none.
- **Skill names are unique across the whole repository.** `install.sh` and the skills
  CLI both install flat, by skill name, so two plugins claiming one name would overwrite
  each other on those channels. CI fails on a duplicate.
- The frontmatter `description` is **the LLM's skill-matching input**, not
  documentation. Write it at final quality even for a stub.
- **Do not name CLI-specific tools.** `AskUserQuestion` and friends only exist in
  Claude Code. Describe the behavior ("ask the user") so all four CLIs can follow it.
- Keep `SKILL.md` thin and push detail into `references/`, loaded on demand. The
  always-on cost of a skill is its frontmatter; the body is paid on every invocation.
- Skill name ≠ plugin name. `plugins/msu/skills/maple-make/` is namespaced as
  `msu:maple-make`.

Adding a plugin is four files: `plugins/<name>/.claude-plugin/plugin.json`, at least one
`plugins/<name>/skills/<skill>/SKILL.md`, an entry in the catalog pointing at
`./plugins/<name>`, and a README row. Every CI check discovers plugins from the
filesystem, so none of them needs editing.

## Public-repository rules

- **Do not name unreleased NEXPACE products** in any committed file, including this
  one. Refer to them as "product-specific skill sets" or "downstream plugins". Public
  release timing differs per product and this repo is already public.
- README carries the legal notices (API terms, model-training prohibition, credential
  handling). Do not drop or soften them when restructuring.
- README is English. Keep committed prose in English for consistency.
