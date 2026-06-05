# MSU Skills

Use MapleStory Universe resources with AI agents.

This repository provides installable MSU Resource Skills for AI agents. The
skills help agents discover and use MSU game resources through Resource MCP while
building Synergy Apps.

The current skill is `maple-make`, which helps AI coding agents build
MapleStory Universe game prototypes using Maple asset knowledge, rendering rules,
and the `maple-lookup` MCP tools available in the agent environment.

## Installation

Requires [Node.js](https://nodejs.org) 18+ and `git` access to this GitLab
repository.

```bash
npx skills add NEXPACE-Limited/msu-skills
```

This installs the skill for your active coding agent, such as Claude Code,
Cursor, Codex CLI, OpenCode, Windsurf, Continue, Cline, or Claude Desktop.

The `maple-make` skill expects the `maple-lookup` MCP tools to be available to
the agent. It does not bundle a CLI helper or require shell utilities.

## MCP Configuration

Configure the remote `maple-lookup` MCP server before first use.

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

Claude Code

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

Official MCP setup docs:
[Claude Code](https://code.claude.com/docs/en/mcp),
[Codex CLI](https://developers.openai.com/codex/mcp),
[Cursor](https://cursor.com/docs/mcp),
[Gemini CLI](https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html).

## Skills

| Skill | Description |
|---|---|
| [`maple-make`](skills/msu/maple-make/) | MapleStory Universe game prototyping with Maple asset lookup and sprite rendering guidance |

## MCP Requirement

The target agent environment must have the `maple-lookup` MCP server configured
with the URL and OpenAPI key header above. This repository documents the setup
but does not embed or auto-install MCP server configuration.

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
