/**
 * The two machine-readable indexes of the pages this site publishes, ported from
 * scripts/build-site.mjs :321-328 and :330-354. Both are served as static files, so they are
 * strings rather than React — the only place in lib/ that formats its own output.
 *
 * The published files are compared against the previous generator's, so every byte here is
 * behaviour: an extra space or a moved newline is a regression, not formatting.
 */

import { MCP_PAGE_DIR, pageUrl } from './site'
import { shortNote } from './text'
import type { SiteData } from './types'

/** Every page this build writes, in the order a reader meets them: the catalog, then each
 *  plugin followed by its own skills, then the MCP page. One list, so sitemap.xml cannot
 *  claim a URL that no route generates — and so the count is assertable in CI. */
export const publishedUrls = ({ plugins }: SiteData): string[] => [
  pageUrl(''),
  ...plugins.flatMap(plugin => [
    pageUrl(plugin.name),
    ...plugin.skills.map(skill => pageUrl(`${plugin.name}/${skill.name}`))
  ]),
  pageUrl(MCP_PAGE_DIR)
]

/** sitemaps.org 0.9, <loc> only. Google ignores <priority> and <changefreq>, and reads
 *  <lastmod> only where it is consistently accurate — nothing here knows when a page last
 *  changed in a way a reader would care about, so no date is claimed. */
export const sitemapXml = (urls: string[]): string =>
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map(url => `  <url>\n    <loc>${url}</loc>\n  </url>\n`).join('') +
  '</urlset>\n'

/** llmstxt.org: an H1, a blockquote summary, then one H2 section per plugin listing that
 *  plugin's page and each of its skills, and a final section for the MCP page. Every value is
 *  read from the catalog, a plugin.json, or a SKILL.md frontmatter — nothing here is written
 *  by hand except the MCP sentence below, which no manifest carries.
 *
 *  A skill row links the skill's own page rather than its SKILL.md on GitHub: this file
 *  indexes the pages the site publishes, and the skill page links the raw SKILL.md, so a
 *  reader still reaches the body in one hop. */
export const llmsTxt = ({ catalog, plugins, mcpServer }: SiteData): string => {
  const sections = plugins.map(plugin => {
    const rows = [
      `- [${plugin.name}@${catalog.name}](${pageUrl(plugin.name)}): ${shortNote(plugin.description)}`,
      ...plugin.skills.map(
        skill =>
          `- [${skill.name}](${pageUrl(`${plugin.name}/${skill.name}`)}): ` +
          shortNote(skill.description)
      )
    ]
    return `## ${plugin.display}\n\n${rows.join('\n')}\n`
  })

  const mcpLabel = `${mcpServer.name} MCP`
  // What the server is for. `.mcp.json` says how to reach it and a skill's tool table says
  // what it answers; neither states its purpose, so this sentence is the one line in the file
  // with no manifest behind it. The MCP page's meta description is the same sentence.
  const mcpDescription =
    `${mcpServer.name} is the MCP server MSU builder skills call for MapleStory Universe ` +
    'resources — name search, then sprite, map, skill, and item data from the MSU Open API.'

  const mcpSection =
    `## ${mcpLabel}\n\n` +
    `- [${mcpLabel}](${pageUrl(MCP_PAGE_DIR)}): ${shortNote(mcpDescription)}\n`

  return `# ${catalog.name}\n\n> ${catalog.description}\n\n${sections.join('\n')}\n${mcpSection}`
}
