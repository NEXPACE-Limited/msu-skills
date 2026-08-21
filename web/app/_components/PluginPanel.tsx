import Link from 'next/link'

import type { Plugin } from '@/lib/types'
import { plural } from '@/lib/text'

/** A plugin as a field of its own colour. The link is the whole panel (see `a.panel`). */
export function PluginPanel({ plugin, hue }: { plugin: Plugin; hue: string }) {
  const server = plugin.servers[0]

  return (
    <Link className="panel" href={`/${plugin.name}/`} style={{ ['--fill' as string]: hue }}>
      <h3>{plugin.name}</h3>
      <p>{plugin.description}</p>
      <div className="meta">
        <span>v{plugin.version}</span>
        <span>{plural(plugin.skills.length, 'skill')}</span>
        <span>{server ? 'key required' : 'no credential'}</span>
        <span className="go">Open →</span>
      </div>
    </Link>
  )
}
