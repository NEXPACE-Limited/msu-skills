# MSU Skills

Use MapleStory Universe resources with AI agents.

This repository provides installable MSU Resource Skills for AI agents. The
skills help agents discover and use MSU game resources through Resource MCP while
building Synergy Apps.

Within the NEXPACE skills ecosystem, this repository is the `msu` plugin — the
home of MSU (≒ NEXPACE) common skills and shared modules. Product-specific skill
sets live in their own repositories and depend on this one.

The current skill is `maple-make`, which helps AI coding agents build
MapleStory Universe game prototypes using Maple asset knowledge, rendering rules,
and the `maple-lookup` MCP tools available in the agent environment.

## Installation

There are two primary install channels, plus a manual fallback for
environments without Node.js.

### Claude Code — plugin

This repository is its own plugin marketplace, so it is added and installed
directly.

```text
/plugin marketplace add NEXPACE-Limited/msu-skills
/plugin install msu@msu-skills
```

Later releases arrive with `/plugin marketplace update msu-skills`.

Installing the `msu` plugin registers the skills and the `maple-lookup` MCP
server together — the server definition is bundled as
[`plugins/msu/.mcp.json`](plugins/msu/.mcp.json) at that plugin's root, so
Claude Code picks it up automatically. When the plugin is enabled, Claude Code
prompts for your MSU Builder OpenAPI key and stores it securely — no manual MCP
setup is needed.

### Other agents — skills CLI

Requires [Node.js](https://nodejs.org) 18+.

```bash
npx skills add NEXPACE-Limited/msu-skills
```

This installs the skills for your active coding agent, such as Cursor, Codex
CLI, OpenCode, Windsurf, Continue, Cline, or Claude Desktop. (Claude Code users
should prefer the plugin channel above.) The skills do not bundle a CLI helper
or require shell utilities.

This offers the skills of every plugin in the repository at once. Name the ones
you want to narrow it:

```bash
npx skills add NEXPACE-Limited/msu-skills --skill maple-make
```

With this channel, configure the `maple-lookup` MCP server manually — see the
next section.

### Manual installation (fallback)

Skills are self-contained directories, so copying them is a complete install.
Clone the repository first — the installer never downloads anything itself.

```bash
git clone https://github.com/NEXPACE-Limited/msu-skills.git
cd msu-skills

# Option A: installer script — auto-detects ~/.codex, ~/.gemini, ~/.kimi
./install.sh                    # every plugin
./install.sh --plugin msu       # one plugin only
./install.sh --target <skills-dir>

# Option B: copy a single skill by hand
cp -R plugins/msu/skills/maple-make ~/.codex/skills/
```

The script copies every skill of the selected plugins — flat, by skill name,
because that is where these CLIs look — and helps register the MCP servers those
plugins bundle: Codex reads `$MSU_OPENAPI_KEY` from the environment at runtime,
while Gemini and Kimi need the key exported when the server is registered. See
the next section for fully manual MCP setup.

## MCP Configuration

The `maple-make` skill expects the `maple-lookup` MCP tools to be available to
the agent. The server definition lives in
[`plugins/msu/.mcp.json`](plugins/msu/.mcp.json) — the single source of truth
for the server name and URL; the values below mirror it for manual setup.

**Claude Code plugin users can skip this section** — the `msu` plugin bundles
`.mcp.json` and prompts for the OpenAPI key when the plugin is enabled.

For every other channel, configure the remote `maple-lookup` MCP server
manually before first use.

First issue an MSU Builder OpenAPI Key, then keep it in a local environment
variable or private agent config. Do not paste the key into chat or commit it to
the repository.

```bash
export MSU_OPENAPI_KEY="<issued OpenAPI key>"
```

MCP server values:

- Name: `maple-lookup`
- URL: `https://openapi.msu.io/v1rc1/resource/mcp`
- Transport: HTTP / streamable HTTP
- Header: `x-nxopen-api-key: <issued OpenAPI key>`

Claude Code (installed via skills CLI, without the plugin)

```bash
claude mcp add --transport http --header "x-nxopen-api-key: $MSU_OPENAPI_KEY" \
  maple-lookup https://openapi.msu.io/v1rc1/resource/mcp
```

Codex CLI (`.codex/config.toml` or `~/.codex/config.toml`)

Add the MCP server to your project config or user config:

```toml
[mcp_servers.maple-lookup]
url = "https://openapi.msu.io/v1rc1/resource/mcp"
env_http_headers = { "x-nxopen-api-key" = "MSU_OPENAPI_KEY" }
```

Cursor (`.cursor/mcp.json` or `~/.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "maple-lookup": {
      "url": "https://openapi.msu.io/v1rc1/resource/mcp",
      "headers": {
        "x-nxopen-api-key": "${env:MSU_OPENAPI_KEY}"
      }
    }
  }
}
```

Gemini CLI

```bash
gemini mcp add --transport http --header "x-nxopen-api-key: $MSU_OPENAPI_KEY" \
  maple-lookup https://openapi.msu.io/v1rc1/resource/mcp
```

Kimi CLI

```bash
kimi mcp add --transport http --header "x-nxopen-api-key: $MSU_OPENAPI_KEY" \
  maple-lookup https://openapi.msu.io/v1rc1/resource/mcp
```

Official MCP setup docs:
[Claude Code](https://code.claude.com/docs/en/mcp),
[Codex CLI](https://developers.openai.com/codex/mcp),
[Cursor](https://cursor.com/docs/mcp),
[Gemini CLI](https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html),
[Kimi CLI](https://github.com/MoonshotAI/kimi-cli#mcp-support).

## Skills

| Plugin | Skill | Description |
|---|---|---|
| `msu` | [`maple-make`](plugins/msu/skills/maple-make/) | MapleStory Universe game prototyping with Maple asset lookup and sprite rendering guidance |

## MCP Requirement

The target agent environment must have the `maple-lookup` MCP server configured
with the URL and OpenAPI key header above. The Claude Code plugin channel
registers this configuration automatically; every other channel documents the
setup here for manual configuration.

## Repository Layout

```
.claude-plugin/marketplace.json   # the catalog — lists every plugin below
plugins/msu/                      # the msu plugin
  .claude-plugin/plugin.json      #   manifest: name, version, OpenAPI key prompt
  .mcp.json                       #   maple-lookup MCP server definition
  skills/                         #   the only source of truth (Agent Skills open standard)
install.sh                        # manual installer for Codex / Gemini / Kimi
```

Each plugin owns a directory under `plugins/` so that its skills, MCP servers,
and credential prompts stay its own. Installing one plugin never brings in
another's configuration.

## Try It

After installing the Skill and connecting Resource MCP, ask your AI agent to use
MapleStory Universe resources while building a game.

Example prompt:

```text
Please build a web view featuring three moving Orange Mushrooms.
```

## Important Notes

- MSU Resource Skills are reference instructions for using MSU game resources
  supplied through the MSU Open API. They do not provide the resources, operate
  your AI agent, or generate outputs themselves.
- Use of MSU Resource Skills, Resource MCP, and the MSU Open API is subject to
  the MSU API Terms, Builder Terms, EULA, applicable policies, and applicable
  laws.
- AI-generated outputs may be inaccurate, incomplete, non-compliant, or
  infringing. Review, test, and validate generated code, resource selections,
  API calls, and final app behavior before use.
- Keep MSU Builder OpenAPI keys, MCP connections, wallet or account access, and
  user data secure. Do not expose credentials in prompts, logs, repositories, or
  untrusted tools.
- Do not redistribute, resell, sublicense, reverse engineer, extract, scrape, or
  use Resource Skills or accessed MSU resources to train, fine-tune, develop,
  improve, or benchmark AI or machine-learning models or competing services,
  except as expressly permitted.
