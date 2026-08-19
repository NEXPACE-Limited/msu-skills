import { loadSite } from '@/lib/catalog'
import { asset, REPO_URL, repoFile } from '@/lib/site'

export async function Footer() {
  const { plugins } = await loadSite()

  return (
    <footer className="foot">
      <div className="wrap">
        <a href={REPO_URL}>GitHub</a>
        {/* Raw hrefs to published files, so they carry the base path themselves — Next
            applies it to next/link, not to a plain anchor. */}
        <a href={asset('llms.txt')}>llms.txt</a>
        <a href={asset('sitemap.xml')}>sitemap.xml</a>
        <a href={repoFile('CONTRIBUTING.md')}>Contributing</a>
        <span className="vers">
          {plugins.map(plugin => `${plugin.name} v${plugin.version}`).join(' · ')}
        </span>
      </div>
    </footer>
  )
}
