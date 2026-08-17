# Contributing

A skill in this catalog is one `SKILL.md` file plus whatever it loads on demand. There is
no build step and no manifest to generate: the file you write is the file that ships, on
every channel.

This page is the contributor's half of the procedure. `AGENTS.md` holds the maintainer's
half — release machinery, the landing page, catalog rules — and you should not need it.

Write access is limited. If pushing a branch to this repository is denied, fork it and
open the pull request from the fork.

## What you write, and what we do

| Yours | Ours |
|---|---|
| `plugins/<plugin>/skills/<name>/SKILL.md` | the catalog entry in `.claude-plugin/marketplace.json` |
| `references/` beside it, when the skill loads files on demand | `plugin.json`, `userConfig`, and any `.mcp.json` |
| a row in the README `## Skills` table | every `version` string |
| one line in the pull request naming the plugin you think it belongs in | confirming that placement |

The right-hand column is release machinery. Leave it untouched even when a check reports
something there as missing — say so in the pull request instead. `version` especially: the
release pull request bumps every changed plugin at once, and a pull request into `develop`
that bumps early fails CI.

## Where the file goes

```
plugins/<plugin>/skills/<name>/SKILL.md
plugins/<plugin>/skills/<name>/references/…     optional
```

`<name>` is kebab-case, and the `name` in the frontmatter must equal the directory name.
Skill names are unique across the whole repository: every channel installs flat, by skill
name, so two skills sharing one would overwrite each other.

Add a row to the README `## Skills` table linking to `plugins/<plugin>/skills/<name>/`.
Write that row's description for a human deciding whether to install — not by copying the
frontmatter `description`, which is written for matching and runs several times too long.

## Which plugin it belongs in

The test is the configuration surface, not the audience.

- Needs the MSU OpenAPI key → `msu`.
- Holds no credential → a plugin that acquires none.

The README's plugin table says what each one currently covers. Name your choice in one
line in the pull request and we confirm it; you are not expected to be right, only to say
what you assumed.

If a skill needs a credential no plugin declares, or fits no plugin's stated scope, that
is a new-plugin question rather than a placement one. **Open an issue before writing it.**
A new plugin gets its own install identity and its own version pin for downstream
consumers, which makes it expensive to undo and cheap to agree on first.

## Writing the skill

Three principles. None is enforced by a check; all three are what review reads for.

**Write concepts, not a stack.** Name the problem, the classes it falls into, and how to
tell them apart — not the engine, language, framework, or tool you happened to use.
`game-tutorial` names none of those and applies to all of them. A skill that names its
stack stops matching every project that does not share it.

**The `description` is matching input, not documentation.** It is the one part an agent
reads before deciding whether to open the skill at all, so write when the skill should
fire: the symptoms, the requests, the states that should pull it in. `determinism-audit`
leads with what a user would actually report.

**Keep the body thin and put depth in `references/`.** The body is paid on every
invocation; a reference is paid only when something needs it. `maple-make` keeps a 90-line
body over 37 reference files.

One more, smaller: describe behaviour rather than naming a tool only one agent has. These
skills ship to four CLIs, so "ask the user" travels where the name of a particular
ask-the-user tool does not.

## Before you open the pull request

`make check` runs the commands CI runs. Three things about it are worth knowing before it
costs you an afternoon:

- **Commit first.** The suite builds an archive from `HEAD` and compares it against your
  working tree, so an uncommitted skill fails with `remote installer missed …`. Staging is
  not enough. The message names the installer; the cause is the missing commit.
- **A green local run is not a green CI run.** CI adds a `guards` job the local commands
  do not include. The README row, the frontmatter name matching the directory name, and
  skill-name uniqueness are checked only there.
- **A colon breaks the frontmatter silently.** `description: Fixes X. Use when: …` is
  invalid YAML, and nothing in this repository reports it — validation passes, the
  installer installs, the site renders a normal-looking card. Quote any description
  containing a colon followed by a space.

For something faster than the full suite, `claude plugin validate plugins/<plugin>` and
`npx skills add . -l` cover the manifest and discovery halves — subject to the second
point above.

## Opening the pull request

Branch from `develop` and open the pull request against `develop`. One opened against
`main` is retargeted for you, with a comment saying so.

Commit subjects read `<type>: <summary>` — `feat`, `fix`, `refactor`, `docs`, `chore`,
`ci`. Nothing enforces it.

GitHub applies a checklist from `.github/PULL_REQUEST_TEMPLATE.md`. Fill it in.

This repository is public, and so is every pull request against it. No credentials, and no
unreleased product names.
