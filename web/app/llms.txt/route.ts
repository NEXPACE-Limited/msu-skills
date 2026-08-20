import { loadSite } from '@/lib/catalog'
import { llmsTxt } from '@/lib/feeds'

export const dynamic = 'force-static'

export async function GET() {
  const data = await loadSite()
  return new Response(llmsTxt(data), {
    headers: { 'content-type': 'text/plain; charset=utf-8' }
  })
}
