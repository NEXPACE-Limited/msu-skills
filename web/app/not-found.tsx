import type { Metadata } from 'next'
import Link from 'next/link'

import { loadSite } from '@/lib/catalog'
import { plural } from '@/lib/text'

export const metadata: Metadata = {
  title: 'Page not found',
  // Without this, /404/ and /_not-found/ export as indexable pages with no canonical.
  robots: { index: false, follow: false }
}

export default async function NotFound() {
  const { catalog, plugins, skillCount } = await loadSite()

  return (
    <main>
      <section className="hero">
        <div className="wrap">
          <div className="petal-row" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </div>
          <p className="kicker">404</p>
          <h1 className="h-xl">No page at this address.</h1>
          <p className="lede">
            A renamed skill, a retired plugin, or a hand-typed path all land here. The
            route below is generated from the catalog, so it leads to what is published
            today.
          </p>
          <div className="panels">
            {/* Component prose, not catalog.description: that field is scoped to one
                plugin's subject and would describe this card as a plugin rather than as
                the catalog. It names no plugin and counts nothing, so a new plugin does
                not date it. */}
            <Link className="panel" href="/">
              <h3>{catalog.name}</h3>
              <p>
                The catalog page — every plugin it publishes, the install command for
                whichever agent you run, and the terms that travel with them.
              </p>
              <div className="meta">
                <span>{plural(plugins.length, 'plugin')}</span>
                <span>{plural(skillCount, 'skill')}</span>
                <span className="go">Home →</span>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
