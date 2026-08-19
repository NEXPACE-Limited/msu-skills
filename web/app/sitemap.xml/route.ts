import { loadSite } from '@/lib/catalog'
import { publishedUrls, sitemapXml } from '@/lib/feeds'

/**
 * A Route Handler rather than app/sitemap.ts. MEASURED: the built-in convention needs
 * `dynamic = 'force-static'` under output:'export' or the build fails, and its serialiser
 * emits zero-indent <url>/<loc> where the previous generator emitted two and four spaces —
 * so byte-identity with the published file is unreachable that way. A handler returns the
 * ported string untouched.
 */
export const dynamic = 'force-static'

export async function GET() {
  const data = await loadSite()
  return new Response(sitemapXml(publishedUrls(data)), {
    headers: { 'content-type': 'application/xml; charset=utf-8' }
  })
}
