// The site's URL identity is derived from the catalog, never typed: a repository rename
// re-points basePath, every canonical, every sitemap <loc> and the OG image with no edit.
// lib/site.ts reads the results back out of `env` rather than repeating the arithmetic.
import { readFileSync } from 'node:fs'

const catalog = JSON.parse(
  readFileSync(new URL('../.claude-plugin/marketplace.json', import.meta.url), 'utf8')
)

const repoUrl = (catalog.plugins[0].repository ?? `${catalog.owner.url}/${catalog.name}`)
  .replace(/\.git$/, '')
const [owner, repo] = repoUrl.split('/').slice(-2)

const basePath = `/${repo}`
// Trailing slash is mandatory: URL resolution drops the last non-slash segment, so a
// relative og.png would otherwise resolve against the host root.
const siteUrl = `https://${owner.toLowerCase()}.github.io/${repo}/`

/** @type {import('next').NextConfig} */
export default {
  // Withheld in development on purpose. MEASURED in next/dist/server/dev/next-dev-server.js:
  // with output 'export' the dev server throws `Page "/[plugin]/page" is missing param …`
  // for any path generateStaticParams did not return, before the component runs, so
  // notFound() never fires and not-found.tsx is unreachable (`dynamicParams = false` does
  // not lift it). `next build` sets NODE_ENV to production, so the export always has it.
  ...(process.env.NODE_ENV === 'development' ? {} : { output: 'export' }),
  // Without this the export writes out/msu.html, and Pages serves no redirect from the
  // slash form every indexed URL uses.
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  // Development only: redirects are not applied when exporting, and in production the host
  // root belongs to the organisation's own pages repository. `basePath: false` keeps Next
  // from prefixing the source, which would redirect the site to itself.
  ...(process.env.NODE_ENV === 'development'
    ? {
        async redirects() {
          return [
            { source: '/', destination: `${basePath}/`, basePath: false, permanent: false }
          ]
        }
      }
    : {}),
  env: {
    SITE_URL: siteUrl,
    BASE_PATH: basePath,
    REPO_URL: repoUrl,
    REPO_SLUG: `${owner}/${repo}`,
    CATALOG_NAME: catalog.name
  }
}
