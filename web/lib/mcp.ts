/**
 * What a plugin's .mcp.json declares, and what the plugin's own skills say that server
 * answers. Ported from scripts/build-site.mjs :75-79, :91-117 and :222-231.
 *
 * Nothing here emits markup: a component renders these values, and React escapes them.
 */

import type { McpServer, McpTool } from './types'

/** The `userConfig` key a server's headers reference, e.g. `${user_config.openapi_key}` →
 *  `openapi_key`. Only that exact whole-value form counts, so a header carrying a literal
 *  credential is not mistaken for a reference. */
export const userConfigReference = (headers?: Record<string, string>): string | undefined =>
  Object.values(headers ?? {})
    .map(value => String(value).match(/^\$\{user_config\.([A-Za-z0-9_-]+)\}$/)?.[1])
    .find(Boolean)

/** The tools a server exposes, read from the table a skill already keeps for its own agent:
 *  a `## MCP Tool: <server>` heading followed by rows whose first cell is a `code`-quoted
 *  tool name. `.mcp.json` declares how to reach a server, never what it answers, so this
 *  table is the only source — and retyping a tool name into a component would let the page
 *  claim a tool the skills no longer call. */
export const parseToolTable = (text: string, serverName: string): McpTool[] => {
  const start = text.search(new RegExp(`^##+\\s+MCP Tool:\\s*${serverName}\\s*$`, 'm'))
  if (start === -1) return []

  const [section] = text.slice(start).split(/\n##+\s/)
  return section
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('|') && line.endsWith('|'))
    .map(line =>
      line
        .slice(1, -1)
        .split('|')
        .map(cell => cell.trim())
    )
    .filter(cells => cells.length >= 2 && /^`[^`]+`$/.test(cells[0]))
    .map(([name, purpose]) => ({ name: name.slice(1, -1), purpose }))
}

/** One entry per tool name, first mention winning, so a table repeated across references
 *  does not render the same tool twice. */
export const uniqueByName = (tools: McpTool[]): McpTool[] => [
  ...new Map(tools.map((tool): [string, McpTool] => [tool.name, tool])).values()
]

export const TRANSPORTS: Record<string, string> = {
  http: 'HTTP / streamable HTTP',
  sse: 'Server-sent events',
  stdio: 'stdio'
}

/** An unknown transport renders as itself: .mcp.json is the authority on what a server
 *  speaks, and a type this table has no wording for is still a fact about the server. */
export const transportLabel = (type?: string): string =>
  type === undefined ? '' : (TRANSPORTS[type] ?? type)

/** The credential line on a plugin page. Plain text — a component decides which names are
 *  set in code. */
export const mcpSummary = (servers: McpServer[]): string =>
  servers.length === 0
    ? 'None — this plugin needs no credential'
    : `${servers.map(server => server.name).join(', ')} — automatic in Claude Code`
