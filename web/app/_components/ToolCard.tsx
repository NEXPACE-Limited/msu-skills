import type { McpTool } from '@/lib/types'

/** The index of the `)` that closes the `(` at `open`, or -1. Nested parentheses are
 *  counted, so an argument list containing one is not cut in half. */
const closingParen = (text: string, open: number): number => {
  let depth = 0
  for (let index = open; index < text.length; index += 1) {
    if (text[index] === '(') depth += 1
    else if (text[index] === ')') {
      depth -= 1
      if (depth === 0) return index
    }
  }
  return -1
}

/**
 * The call form to show under the purpose, or nothing.
 *
 * A tool is only ever `{ name, purpose }` here — the `## MCP Tool:` table is what the page
 * reads, and no file declares a signature. So the block is lifted verbatim when the purpose
 * already spells the call out, and omitted otherwise: an argument list written here would be
 * the page asserting an interface of its own.
 */
const callForm = (tool: McpTool): string | undefined => {
  const open = tool.purpose.indexOf(`${tool.name}(`)
  if (open === -1) return undefined

  const close = closingParen(tool.purpose, open + tool.name.length)
  if (close === -1) return undefined

  const call = tool.purpose.slice(open, close + 1)
  // A `→ …` note is the table's own account of what comes back, so it travels with the call.
  const tail = tool.purpose.slice(close + 1).replace(/^[`\s]*/, '')
  return tail.startsWith('→') ? `${call}\n${tail.replaceAll('`', '').trim()}` : call
}

export function ToolCard({ tool }: { tool: McpTool }) {
  const call = callForm(tool)

  return (
    <article className="tool">
      <h3>{tool.name}</h3>
      {tool.purpose && <p>{tool.purpose}</p>}
      {call && <pre>{call}</pre>}
    </article>
  )
}
