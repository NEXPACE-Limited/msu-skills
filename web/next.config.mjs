// The site's URL identity is derived from the catalog, never typed here. Renaming the
// repository re-points basePath, every canonical, every sitemap <loc> and the OG image
// with no edit to this file — the same property scripts/build-site.mjs had at :529-531.
//
// This is the single derivation point. lib/site.ts reads the results back out of `env`
// rather than repeating the arithmetic, so the two can never disagree.
import { readFileSync } from 'node:fs'

const catalog = JSON.parse(
  readFileSync(new URL('../.claude-plugin/marketplace.json', import.meta.url), 'utf8')
)

const repoUrl = (catalog.plugins[0].repository ?? `${catalog.owner.url}/${catalog.name}`)
  .replace(/\.git$/, '')
const [owner, repo] = repoUrl.split('/').slice(-2)

const basePath = `/${repo}`
// Trailing slash is mandatory: `new URL('…/msu-skills')` resolves a relative og.png to
// the host root, because URL resolution drops the last non-slash segment.
const siteUrl = `https://${owner.toLowerCase()}.github.io/${repo}/`

/** @type {import('next').NextConfig} */
export default {
  // Production only, and the conditional is load-bearing rather than tidy. MEASURED in
  // next/dist/server/dev/next-dev-server.js: when `output` is 'export', the DEV server
  // throws `Page "/[plugin]/page" is missing param …` for any path that matches a dynamic
  // route but was not returned by generateStaticParams — before the component runs, so
  // notFound() never fires and not-found.tsx is unreachable. The guard is spelled
  // `output === 'export'` and consults nothing else, which is why `dynamicParams = false`
  // does not lift it. Withholding the value in dev is what lets an unknown path fall
  // through to the route, hit notFound(), and render the 404 page the way a static host
  // serves out/404.html for a path with no file behind it.
  //
  // The export itself is unaffected: `next build` sets NODE_ENV to production, so the
  // build that CI runs and Pages publishes always has output: 'export'. Nothing about the
  // exported bytes is decided here.
  ...(process.env.NODE_ENV === 'development' ? {} : { output: 'export' }),
  // Without this the export writes out/msu.html, and GitHub Pages then serves
  // /msu-skills/msu with no redirect from the slash form every indexed URL uses.
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  // Development only, and it has to be: `next build` warns three times that redirects are
  // not applied when exporting, and it is right — a static host has nothing to run them.
  // It costs nothing in production either, because there is no production `/` to fix:
  // Pages serves this site AT the base path, and the host root belongs to the
  // organisation's own pages repository. This exists so the one URL a developer types by
  // hand lands somewhere. `basePath: false` keeps Next from prefixing the source, which
  // would make the rule redirect the site to itself.
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
