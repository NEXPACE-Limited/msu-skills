import type { Metadata } from 'next'
import Link from 'next/link'

import { loadSite } from '@/lib/catalog'
import { plural } from '@/lib/text'

export const metadata: Metadata = {
  title: 'Page not found',
  // MEASURED: without this, /404/ and /_not-found/ are exported as indexable pages that
  // declare no canonical of their own, and read as duplicates of the home page.
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
            A renamed skill, a retired plugin, or a hand-typed path all land here. Both
            routes below are generated from the catalog, so they lead to what is published
            today.
          </p>
          <div className="panels">
            <Link className="panel" href="/">
              <h3>{catalog.name}</h3>
              <p>{catalog.description}</p>
              <div className="meta">
                <span>{plural(plugins.length, 'plugin')}</span>
                <span>{plural(skillCount, 'skill')}</span>
                <span className="go">Home →</span>
              </div>
            </Link>
            <Link className="panel is-blue" href="/#skills">
              <h3>All skills</h3>
              <p>
                Every skill in the catalog, each shown with the description its agent reads
                to decide whether to load it.
              </p>
              <div className="meta">
                <span>{plural(skillCount, 'skill')}</span>
                <span className="go">Open →</span>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
