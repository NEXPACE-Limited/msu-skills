/**
 * The shapes every page reads. Nothing here is written by hand at page level: every field
 * traces back to .claude-plugin/marketplace.json, a plugin's plugin.json or .mcp.json, or
 * a SKILL.md frontmatter.
 */

/** One tool an MCP server answers, read from the `## MCP Tool: <server>` table the owning
 *  plugin's skill keeps. `.mcp.json` says how to reach a server, never what it answers. */
export type McpTool = {
  name: string
  purpose: string
}

/** A server as its plugin's .mcp.json declares it, plus the credential the plugin's
 *  userConfig block attaches to it and the tools its skills document. */
export type McpServer = {
  name: string
  /** `http` | `sse` | `stdio` as written. Not narrowed: an unknown transport renders as
   *  itself rather than throwing. */
  type?: string
  url?: string
  headers?: Record<string, string>
  /** From plugin.json userConfig[<the ${user_config.*} the headers reference>].title */
  credentialTitle?: string
  credentialNote?: string
  tools: McpTool[]
}

export type Skill = {
  /** Directory name; asserted equal to the frontmatter `name`. */
  name: string
  description: string
  /** Everything the skill ships besides SKILL.md, at any depth. */
  bundled: number
  /** Not every skill has a references/ directory, and a card must not link to one that
   *  is not there. */
  hasReferences: boolean
}

export type Plugin = {
  name: string
  display: string
  description: string
  version: string
  /** Repository-relative, no leading `./` and no trailing slash — e.g. `plugins/msu`. */
  source: string
  servers: McpServer[]
  skills: Skill[]
}

export type CatalogOwner = {
  name: string
  url: string
}

export type Catalog = {
  name: string
  description: string
  owner: CatalogOwner
}

/** A skill paired with the plugin that ships it, for lists that cross plugin boundaries. */
export type SkillOf = {
  skill: Skill
  plugin: Plugin
}

/** Everything one build reads, assembled once and shared by every page. */
export type SiteData = {
  catalog: Catalog
  plugins: Plugin[]
  /** The plugin whose .mcp.json owns the server the MCP page documents. */
  mcpOwner: Plugin
  mcpServer: McpServer
  /** Skills whose plugin declares that server. */
  mcpSkills: SkillOf[]
  skillCount: number
}
