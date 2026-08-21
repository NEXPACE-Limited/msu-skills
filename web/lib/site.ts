/**
 * The site's URL identity. next.config.mjs derives it once from the catalog and hands it
 * over through `env`; this is the only module allowed to know these strings. A literal
 * `/msu-skills` anywhere else breaks a fork or a repository rename.
 */

/**
 * Each value is read through a STATIC `process.env.NAME` reference, never
 * `process.env[key]`: the `env` block is a build-time textual substitution, so a dynamic
 * index is left as a lookup against an environment that has none of these set.
 */
const required = (key: string, value: string | undefined): string => {
  if (!value) {
    throw new Error(
      `${key} is not set. next.config.mjs derives it from .claude-plugin/marketplace.json ` +
        'and exposes it through `env`; a build that bypasses that config cannot render URLs.'
    )
  }
  return value
}

/** Absolute, with a trailing slash: URL resolution drops the last non-slash segment, so
 *  without it a relative `og.png` resolves against the host root. */
export const SITE_URL = required('SITE_URL', process.env.SITE_URL)

/** Next applies it to next/link and bundled assets, but NOT to a raw `<a href>` or
 *  `<img src>` — those go through asset(). */
export const BASE_PATH = required('BASE_PATH', process.env.BASE_PATH)

export const REPO_URL = required('REPO_URL', process.env.REPO_URL)
export const REPO_SLUG = required('REPO_SLUG', process.env.REPO_SLUG)
export const CATALOG_NAME = required('CATALOG_NAME', process.env.CATALOG_NAME)

/** The MCP page's route segment, and so a reserved plugin name — loadSite() refuses it. */
export const MCP_PAGE_DIR = 'mcp'

/** The words every page title ends with. */
export const SITE_IDENTITY = 'Agent Skills for MapleStory Universe'

export const MCP_PAGE_IDENTITY = 'MapleStory Universe resource tools'

/** An absolute page URL from a route path: '' for the catalog page, 'msu' for a plugin,
 *  'msu/maple-make' for a skill. Always ends in a slash, matching `trailingSlash: true`. */
export const pageUrl = (path: string): string =>
  path === '' ? SITE_URL : `${SITE_URL}${path.replace(/^\/|\/$/g, '')}/`

/** A path inside the deployed site for a raw attribute Next will not prefix. */
export const asset = (path: string): string => `${BASE_PATH}/${path.replace(/^\//, '')}`

export const repoFile = (path: string): string =>
  `${REPO_URL}/blob/main/${path.replace(/^\//, '')}`

export const repoTree = (path: string): string =>
  `${REPO_URL}/tree/main/${path.replace(/^\//, '')}`
