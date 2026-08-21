import { loadSite } from '@/lib/catalog'
import { publishedUrls, sitemapXml } from '@/lib/feeds'

/** A Route Handler rather than app/sitemap.ts: the built-in convention serialises with its
 *  own indentation, so continuity with the published file is unreachable that way. */
export const dynamic = 'force-static'

export async function GET() {
  const data = await loadSite()
  return new Response(sitemapXml(publishedUrls(data)), {
    headers: { 'content-type': 'application/xml; charset=utf-8' }
  })
}
