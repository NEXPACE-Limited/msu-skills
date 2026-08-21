/** The two machine-readable indexes of the pages this site publishes. Both are served as
 *  static files, so they are strings rather than React. */

import { MCP_PAGE_DIR, pageUrl } from './site'
import { shortNote } from './text'
import type { SiteData } from './types'

/** Every page this build writes, in the order a reader meets them. One list, so
 *  sitemap.xml cannot claim a URL no route generates. */
export const publishedUrls = ({ plugins }: SiteData): string[] => [
  pageUrl(''),
  ...plugins.flatMap(plugin => [
    pageUrl(plugin.name),
    ...plugin.skills.map(skill => pageUrl(`${plugin.name}/${skill.name}`))
  ]),
  pageUrl(MCP_PAGE_DIR)
]

/** sitemaps.org 0.9, <loc> only. Google ignores <priority> and <changefreq>, and reads
 *  <lastmod> only where it is consistently accurate, which a build that rewrites every
 *  page cannot claim. */
export const sitemapXml = (urls: string[]): string =>
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map(url => `  <url>\n    <loc>${url}</loc>\n  </url>\n`).join('') +
  '</urlset>\n'

/** llmstxt.org: an H1, a blockquote summary, one H2 per plugin listing its page and each
 *  of its skills, and a final section for the MCP page. A skill row links the skill's own
 *  page; that page links the raw SKILL.md. */
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
  // `.mcp.json` says how to reach the server and a tool table says what it answers; neither
  // states its purpose, so this is the one line in the file with no manifest behind it.
  const mcpDescription =
    `${mcpServer.name} is the MCP server MSU builder skills call for MapleStory Universe ` +
    'resources — name search, then sprite, map, skill, and item data from the MSU Open API.'

  const mcpSection =
    `## ${mcpLabel}\n\n` +
    `- [${mcpLabel}](${pageUrl(MCP_PAGE_DIR)}): ${shortNote(mcpDescription)}\n`

  return `# ${catalog.name}\n\n> ${catalog.description}\n\n${sections.join('\n')}\n${mcpSection}`
}
