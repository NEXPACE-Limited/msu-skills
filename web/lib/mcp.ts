/** What a plugin's .mcp.json declares, and what the plugin's own skills say that server
 *  answers. Nothing here emits markup. */

import type { McpServer, McpTool } from './types'

/** The `userConfig` key a server's headers reference, e.g. `${user_config.openapi_key}` →
 *  `openapi_key`. Only that exact whole-value form counts, so a header carrying a literal
 *  credential is not mistaken for a reference. */
export const userConfigReference = (headers?: Record<string, string>): string | undefined =>
  Object.values(headers ?? {})
    .map(value => String(value).match(/^\$\{user_config\.([A-Za-z0-9_-]+)\}$/)?.[1])
    .find(Boolean)

/** The tools a server exposes: a `## MCP Tool: <server>` heading followed by rows whose
 *  first cell is a `code`-quoted tool name. That table is the only source — retyping a
 *  tool name into a component would let the page claim a tool the skills no longer call. */
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

/** One entry per tool name, first mention winning. */
export const uniqueByName = (tools: McpTool[]): McpTool[] => [
  ...new Map(tools.map((tool): [string, McpTool] => [tool.name, tool])).values()
]

export const TRANSPORTS: Record<string, string> = {
  http: 'HTTP / streamable HTTP',
  sse: 'Server-sent events',
  stdio: 'stdio'
}

/** An unknown transport renders as itself: .mcp.json is the authority. */
export const transportLabel = (type?: string): string =>
  type === undefined ? '' : (TRANSPORTS[type] ?? type)

/** The credential line on a plugin page. Plain text — a component decides which names are
 *  set in code. */
export const mcpSummary = (servers: McpServer[]): string =>
  servers.length === 0
    ? 'None — this plugin needs no credential'
    : `${servers.map(server => server.name).join(', ')} — automatic in Claude Code`
