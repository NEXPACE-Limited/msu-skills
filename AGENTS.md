# msu-skills

The `msu-skills` catalog — the skills NEXPACE publishes for MSU builder work, packaged
as one plugin per coupling boundary. Anything reusable across that work lives here,
whether or not it is MapleStory-specific; product-specific skill sets live in their own
repositories and depend on these.

**This repository is public on GitHub.** Everything committed here is world-readable.

## Commands

Skills have no build and no package manifest: one is edited in place at
`plugins/<plugin>/skills/<name>/SKILL.md` and shipped verbatim. The landing page is the
only generated artifact, and it is generated *from* those files — see *The landing page*.
The commands below stand in for a test suite, and CI runs all of them.

```bash
claude plugin validate .                            # marketplace catalog
claude plugin validate plugins/<plugin>             # one plugin, and its skill files
npx skills add . -l                                 # skills the skills CLI discovers
bash install.sh --target /tmp/probe                 # smoke-test the manual installer
bash install.sh --plugin <plugin> --target /tmp/one # ...and the single-plugin path
bash scripts/check-endpoints.sh                     # no leaked endpoint or credential
node scripts/build-site.mjs                         # render the landing page into _site/
```

Pointed at the repo root the validator reads `marketplace.json`, and for every
local-path entry it also reads that plugin's `plugin.json` — so the first line covers
the packaging as a whole. The second is still worth running once per plugin you touched,
because only the plugin-directory form checks the skill, command, and hook files.

`make check` runs that list in one pass, and `make serve` renders the page and serves it
at `http://localhost:8731` (`make help` lists the rest). The Makefile is a convenience
wrapper only — CI runs these commands directly, so `ci.yml` stays the authority and a
new check belongs there first.

## Contributing

Branch from `main` and open the pull request against `main`. `main` is protected:
direct pushes are rejected for everyone, admins included, so every change lands through
a PR. **Merging is the release** — no staging branch, no separate publish step, so a
merged mistake is live.

Write access is limited. If pushing a branch to this repository is denied, fork it and
open the PR from the fork.

Before opening the PR:

- Run the commands above. CI runs the same ones and adds guards on top.
- **Bump `version` in `plugins/<plugin>/.claude-plugin/plugin.json` for every plugin you
  touched.** CI's `version-bump` job fails the PR otherwise, and that string is the only
  signal that tells installed users to update. See *Versioning and release*.
- Fill in the checklist GitHub applies from `.github/PULL_REQUEST_TEMPLATE.md`.

Commit subjects read `<type>: <summary>` — `feat`, `fix`, `refactor`, `docs`, `chore`,
`ci`. Nothing enforces it.

CI runs on every push to `main` and on every pull request: `plugin-validate`,
`install-smoke`, `skills-discovery`, `site-build`, `guards`, and — on pull requests
only — `version-bump`. A push to `main` also runs `pages.yml`, which republishes the
landing page.

## Core principle — one source, three channels

The Agent Skills open standard (`SKILL.md`) is adopted by Claude Code, Codex CLI,
Gemini CLI, and Kimi CLI. So there is **no conversion and no build step**: the
`SKILL.md` files under `plugins/*/skills/` are the only source, shipped verbatim
everywhere.

Skills install automatically on all three; they differ only in what happens to the
`maple-lookup` MCP server.

| Channel | `maple-lookup` MCP |
|---|---|
| Claude Code plugin (`msu@msu-skills`) | automatic — bundled `.mcp.json`, key via `userConfig` prompt |
| `npx skills add NEXPACE-Limited/msu-skills` | **manual** — README "MCP Configuration" |
| `./install.sh` (Codex / Gemini / Kimi) | best effort — prints the Codex TOML snippet, runs `mcp add` for Gemini/Kimi when `$MSU_OPENAPI_KEY` is set |

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
Makefile                   # wrappers: make check, make serve, make site. See Commands
site/template.html         # the catalog page. {{TOKEN}}s are filled at build
site/plugin.html           # one page per plugin, rendered to <plugin>/index.html
site/partials/*.html       # head, topbar, footer — included with {{>name}}
site/style.css, main.js, favicon.svg  # copied to the output as they are
scripts/build-site.mjs     # renders site/ + the catalog + every SKILL.md into _site/
scripts/check-endpoints.sh # public-repo scan, inherited from the retired hub
.github/workflows/ci.yml   # the commands above, plus guards, on every PR and push
.github/workflows/pages.yml # renders and publishes the page on every push to main
AGENTS.md                  # this file. CLAUDE.md and GEMINI.md are one-line @ imports
```

`AGENTS.md` holds the content. Gemini CLI does not read it by default, so `GEMINI.md`
is what loads this context there; `CLAUDE.md` is the same pointer for Claude Code.

Catalog name is `msu-skills`, and every plugin in it installs as `<plugin>@msu-skills`.
Which plugins exist is `.claude-plugin/marketplace.json`'s answer, not this file's — read
the catalog, and do not expect a roster here. Skill name ≠ plugin name ≠ catalog name:
`plugins/msu/skills/maple-make/` is invoked as `msu:maple-make`.

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

This replaced a separate `nexpace-skills-hub` repository that held the only catalog: a
release needed two repositories in agreement, and that private catalog was the only way
to reach a public plugin.

**Exactly one catalog may name a plugin.** Two give it two install identities, and a
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

## The landing page

`https://nexpace-limited.github.io/msu-skills/` is generated, not written. It is a
catalog page plus one page per plugin:

```
index.html          hero, install channels, the plugin list, MCP setup, the notices
<plugin>/index.html that plugin's identity, its own install commands, and its skills
```

`scripts/build-site.mjs` reads `.claude-plugin/marketplace.json`, every plugin's
`plugin.json` and `.mcp.json`, and every `SKILL.md` frontmatter, then fills the
`{{TOKEN}}`s in `site/template.html` and `site/plugin.html`. Chrome shared by both —
head, topbar, footer — lives in `site/partials/` and is included with `{{>name}}`.
A plugin card, and a skill card's name, description, bundled-file count, `plugin:skill`
invocation, and MCP requirement, all come from those files. A card links to
`references/` only when the skill has one — not every skill does.

**Never retype a plugin's or a skill's own fields into a template.** Templates carry page
structure and the prose that has no other source — install steps, MCP snippets, the
README's notices. Anything a manifest or a frontmatter already declares is a token.
Adding a plugin or a skill updates the pages with no edit here, the same property every
CI check has.

- Relative paths differ by depth, so every asset and in-site link goes through `{{ROOT}}`
  (`./` on the catalog page, `../` on a plugin page). A hard-coded `./style.css` would
  break every plugin page.
- Preview with `make serve` — the copy buttons need a secure context, so `localhost`
  shows them working and a `file://` open does not. `_site/` is gitignored: the pages are
  built on deploy and never committed.
- The build empties its output directory first, so deleting a plugin or a skill leaves no
  stale page behind on a local rebuild. It refuses to empty the repository, or any
  directory that holds something other than a previous build.
- `site-build` renders on every pull request and fails if a plugin has no page or a skill
  reaches none. `pages.yml` publishes on push to `main` — the merge that releases a
  plugin also republishes the site.
- Enabling Pages is a one-time manual step: Settings → Pages → Source: GitHub Actions.
- The catalog page repeats the README's legal notices verbatim. Keep the two in step, and
  do not soften them here either.
- Two font families load from `fonts.googleapis.com`. That is the site's only third-party
  request; keep it that way.

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

Tags are optional. Nothing in the install path reads them — `/plugin marketplace add`
clones the default branch — though a marketplace source does accept a `ref`, so
`claude plugin tag --push` is still there if a pinnable ref is ever wanted.

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
- **Every skill needs a row in the README `## Skills` table** linking to
  `plugins/<plugin>/skills/<name>/`; CI fails without it. That table is inventory on
  purpose — it is where a browsing user sees what the catalog holds, which is why it
  carries a list where this file must not. Write its description for a human deciding
  whether to install, not by copying the frontmatter `description`, which is written
  for matching and runs several times too long.
- **Do not name CLI-specific tools.** `AskUserQuestion` and friends only exist in
  Claude Code. Describe the behavior ("ask the user") so all four CLIs can follow it.
- Keep `SKILL.md` thin and push detail into `references/`, loaded on demand. The
  always-on cost of a skill is its frontmatter; the body is paid on every invocation.

Adding a plugin is four files: `plugins/<name>/.claude-plugin/plugin.json`, at least one
`plugins/<name>/skills/<skill>/SKILL.md`, an entry in the catalog pointing at
`./plugins/<name>`, and a README row. Every CI check discovers plugins from the
filesystem, so none of them needs editing.

**This file is not the fifth.** It states rules, not inventory: no sentence here should
count the plugins, name the full set, or describe one as the only. Naming a plugin is
fine where it is the subject — `msu` owns `maple-lookup`, and that stays true as the
catalog grows — but write anything else against `<plugin>`. If adding a plugin forces an
edit here, the sentence it forced was keeping a roster, and the fix is to rewrite that
sentence rather than update the count.

## Public-repository rules

- **Do not name unreleased NEXPACE products** in any committed file, including this
  one. Refer to them as "product-specific skill sets" or "downstream plugins". Public
  release timing differs per product and this repo is already public.
- README carries the legal notices (API terms, model-training prohibition, credential
  handling). Do not drop or soften them when restructuring.
- README is English. Keep committed prose in English for consistency.
