/**
 * The assembly module: one read of the repository into the SiteData every page renders from.
 * Ported from scripts/build-site.mjs :61-89 (readJson, listDirs, listFiles), :182-220
 * (readPlugin) and the data half of build() at :493-527.
 *
 * Nothing here produces markup. The generator's page fragments — pluginCard, skillCard,
 * toolCard, serverList — are components now, and React escapes, so no escape() survives the
 * port either.
 */

import { existsSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { parseToolTable, uniqueByName, userConfigReference } from './mcp'
import { MCP_PAGE_DIR } from './site'
import { readSkill } from './skills'
import type { Catalog, CatalogOwner, McpServer, Plugin, SiteData, SkillOf } from './types'

/** `next build` and `next dev` both run with the working directory at the app root, so the
 *  repository the site is generated from — the catalog, the plugin manifests, every
 *  SKILL.md — is its parent. Derived from cwd rather than from import.meta.url, which in a
 *  bundled module points at build output instead of at this file. */
export const REPO_ROOT = resolve(process.cwd(), '..')

/* ── the files this build reads, in the fields it reads ──────────────────────────── */

type CatalogEntry = {
  /** `unknown` because the filter below is what proves it is a local path. */
  source?: unknown
  displayName?: string
  description?: string
}

type LocalCatalogEntry = CatalogEntry & { source: string }

type MarketplaceFile = {
  name: string
  description: string
  owner: CatalogOwner
  plugins: CatalogEntry[]
}

type UserConfigEntry = {
  title?: string
  description?: string
}

type PluginManifest = {
  name: string
  displayName?: string
  description?: string
  version: string
  userConfig?: Record<string, UserConfigEntry>
}

/** A server as .mcp.json writes it, before the credential and the tool table are attached.
 *  `type` is not narrowed: an unknown transport must render as itself. */
type McpServerConfig = {
  type?: string
  url?: string
  headers?: Record<string, string>
}

type McpFile = {
  mcpServers?: Record<string, McpServerConfig>
}

/* ── filesystem helpers ─────────────────────────────────────────────────────────── */

const readJson = async <T>(path: string): Promise<T> => {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as T
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    throw new Error(`cannot read ${path}: ${reason}`)
  }
}

/** Sorted: this is the order skills appear in on every page. */
const listDirs = async (path: string): Promise<string[]> =>
  (await readdir(path, { withFileTypes: true }))
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort()

/** Unsorted, unlike listDirs, and deliberately so: the order decides which copy of a tool
 *  table uniqueByName keeps when one is repeated across references, and sorting would move
 *  that silently. */
const listFiles = async (dir: string): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map(entry => {
      const path = join(dir, entry.name)
      return entry.isDirectory() ? listFiles(path) : Promise.resolve([path])
    })
  )
  return nested.flat()
}

/* ── one plugin ─────────────────────────────────────────────────────────────────── */

const readPlugin = async (entry: LocalCatalogEntry): Promise<Plugin> => {
  const source = entry.source.replace(/^\.\//, '').replace(/\/$/, '')
  const dir = join(REPO_ROOT, source)
  const manifest = await readJson<PluginManifest>(join(dir, '.claude-plugin', 'plugin.json'))

  const skillsDir = join(dir, 'skills')
  const names = existsSync(skillsDir) ? await listDirs(skillsDir) : []
  const skills = await Promise.all(names.map(name => readSkill(dir, name)))

  // Every markdown file the plugin ships, so a tool table is found wherever its skill keeps
  // it — in SKILL.md or in any reference below it.
  const markdown = existsSync(skillsDir)
    ? (await listFiles(skillsDir)).filter(path => path.endsWith('.md'))
    : []
  const documents = await Promise.all(markdown.map(path => readFile(path, 'utf8')))

  const mcpPath = join(dir, '.mcp.json')
  const declared = existsSync(mcpPath) ? ((await readJson<McpFile>(mcpPath)).mcpServers ?? {}) : {}

  const servers: McpServer[] = Object.entries(declared).map(([name, config]) => {
    const reference = userConfigReference(config.headers)
    return {
      ...config,
      name,
      credentialTitle: reference ? manifest.userConfig?.[reference]?.title : undefined,
      credentialNote: reference ? manifest.userConfig?.[reference]?.description : undefined,
      tools: uniqueByName(documents.flatMap(text => parseToolTable(text, name)))
    }
  })

  return {
    name: manifest.name,
    display: manifest.displayName ?? entry.displayName ?? manifest.name,
    description: manifest.description ?? entry.description ?? '',
    version: manifest.version,
    source,
    servers,
    skills
  }
}

/* ── the whole site ─────────────────────────────────────────────────────────────── */

export const loadSite = async (): Promise<SiteData> => {
  const file = await readJson<MarketplaceFile>(
    join(REPO_ROOT, '.claude-plugin', 'marketplace.json')
  )
  const entries = file.plugins.filter(
    (entry): entry is LocalCatalogEntry => typeof entry.source === 'string'
  )
  if (entries.length === 0) {
    throw new Error(
      'the catalog lists no plugin with a local source path. Give an entry in ' +
        '.claude-plugin/marketplace.json a "source": "./plugins/<name>".'
    )
  }

  const plugins = await Promise.all(entries.map(readPlugin))
  const skillCount = plugins.reduce((total, plugin) => total + plugin.skills.length, 0)
  if (skillCount === 0) {
    throw new Error(
      'no SKILL.md found under any catalogued plugin. Add ' +
        'plugins/<plugin>/skills/<skill>/SKILL.md, or drop that plugin from ' +
        '.claude-plugin/marketplace.json.'
    )
  }

  // A plugin page renders to /<plugin>/ and the MCP page to /<MCP_PAGE_DIR>/, so one name
  // addresses both. Measured: the App Router reports nothing here — it serves the static
  // page and the plugin's own page is unreachable — so this is the only guard.
  const collision = plugins.find(plugin => plugin.name === MCP_PAGE_DIR)
  if (collision) {
    throw new Error(
      `plugin '${collision.name}' would render to /${MCP_PAGE_DIR}/, where the MCP page is ` +
        'written. Rename the plugin, or move the MCP page by changing MCP_PAGE_DIR in ' +
        'lib/site.ts.'
    )
  }

  // Whichever plugin owns an MCP server is the one the MCP page documents. A plugin that
  // owns none needs no setup, so it is never the subject there.
  const mcpOwner = plugins.find(plugin => plugin.servers.length > 0) ?? plugins[0]
  const mcpServer: McpServer | undefined = mcpOwner.servers[0]
  if (!mcpServer) {
    throw new Error(
      'no catalogued plugin declares an MCP server, so /mcp/ would name none. Add the ' +
        'server to plugins/<plugin>/.mcp.json, or delete app/mcp/ and SiteData.mcpServer.'
    )
  }
  // The page's tools come from the table the owning plugin's skills keep for their own
  // agent; with none found the page would claim capabilities it cannot name.
  if (mcpServer.tools.length === 0) {
    throw new Error(
      `no tool table for '${mcpServer.name}' under ${mcpOwner.source}/skills/. Add a ` +
        `'## MCP Tool: ${mcpServer.name}' heading followed by a | Tool | Purpose | table to ` +
        'the SKILL.md — or a reference — of a skill that calls it.'
    )
  }

  // Skills that need the server, taken from the same fact the plugin pages' "Requires" row
  // reads — the skill's plugin declares it — rather than from a list written by hand.
  const mcpSkills: SkillOf[] = plugins.flatMap(plugin =>
    plugin.servers.some(server => server.name === mcpServer.name)
      ? plugin.skills.map(skill => ({ skill, plugin }))
      : []
  )

  const catalog: Catalog = {
    name: file.name,
    description: file.description,
    owner: file.owner
  }

  return { catalog, plugins, mcpOwner, mcpServer, mcpSkills, skillCount }
}
