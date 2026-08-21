import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { loadSite } from '@/lib/catalog'
import { CATALOG_NAME, REPO_SLUG, pageUrl } from '@/lib/site'
import { plural } from '@/lib/text'
import type { Catalog, Plugin } from '@/lib/types'
import { Breadcrumb } from '../_components/Breadcrumb'
import { ChannelRow } from '../_components/ChannelRow'
import { SkillEntry } from '../_components/SkillEntry'
import { headClassFor, hueFor } from '../_components/hue'

type Params = { plugin: string }

type Located = {
  catalog: Catalog
  plugin: Plugin
  /** Position in catalog order, which is what assigns the plugin its hue. */
  index: number
}

/** The route segment is a plugin name, so the catalog is the only thing that can resolve
 *  it. No guard here for a plugin named `mcp`: loadSite() refuses that name before either
 *  export below sees a plugin list, and a second check would be a copy that can drift. */
const locate = async (name: string): Promise<Located | undefined> => {
  const { catalog, plugins } = await loadSite()
  const index = plugins.findIndex(plugin => plugin.name === name)
  return index === -1 ? undefined : { catalog, plugin: plugins[index], index }
}

export async function generateStaticParams(): Promise<Params[]> {
  const { plugins } = await loadSite()
  return plugins.map(plugin => ({ plugin: plugin.name }))
}

export async function generateMetadata({
  params
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { plugin: name } = await params
  const located = await locate(name)
  // The page itself answers an unknown name with notFound(); returning nothing here keeps
  // this function from throwing before that happens.
  if (!located) return {}

  const { plugin } = located
  const url = pageUrl(plugin.name)

  return {
    // Just the name: the root layout's template appends the site identity.
    title: plugin.name,
    description: plugin.description,
    alternates: { canonical: url },
    // MEASURED (next/dist/lib/metadata/resolve-metadata.js, the `case 'openGraph'` branch):
    // a page's openGraph REPLACES the layout's rather than merging into it, so declaring
    // only `url` would drop the og:image, og:site_name and og:type the previous generator
    // put on every page (site/partials/head.html:7-14). They are restated to keep parity.
    openGraph: {
      type: 'website',
      siteName: CATALOG_NAME,
      url,
      images: [{ url: 'og.png', width: 1200, height: 630 }]
    }
  }
}

export default async function PluginPage({ params }: { params: Promise<Params> }) {
  const { plugin: name } = await params
  const located = await locate(name)
  if (!located) notFound()

  const { catalog, plugin, index } = located
  const server = plugin.servers[0]
  const hue = hueFor(index)

  // Built from REPO_SLUG rather than written out, so a fork or a rename re-points the
  // command with no edit here.
  const installer =
    `curl -fsSL https://raw.githubusercontent.com/${REPO_SLUG}/main/install.sh` +
    ` | bash -s -- --plugin ${plugin.name}`

  return (
    <main>
      <section className={`colorhead ${headClassFor(index)}`}>
        <div className="wrap">
          <Breadcrumb trail={[{ name: catalog.name, href: '/' }, { name: plugin.name }]} />
          <div className="headgrid">
            <div>
              <p className="kicker">Plugin</p>
              <h1 className="h-xl">{plugin.name}</h1>
            </div>
            <div>
              <p className="lede">{plugin.description}</p>
              <div className="tags">
                <span className="tag">v{plugin.version}</span>
                <span className="tag">{plural(plugin.skills.length, 'skill')}</span>
                {/* The credential's own title, not a word for it: plugin.json names the key
                    and a plugin that declares none has nothing to name. */}
                <span className="tag">{server?.credentialTitle ?? 'no credential'}</span>
                <span className="tag">{server ? server.name : 'no MCP server'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <p className="kicker">Install</p>
          <h2 className="h-lg">Pick a channel</h2>
          <div className="channels">
            <ChannelRow
              title="Claude Code"
              blurb="The marketplace only has to be added once."
              commands={[`/plugin install ${plugin.name}@${CATALOG_NAME}`]}
            />
            <ChannelRow
              title="skills CLI"
              blurb={
                <>
                  No plugin boundary on this channel — every catalogued skill is offered.{' '}
                  <code>--skill</code> picks one.
                </>
              }
              commands={[`npx skills add ${REPO_SLUG}`]}
            />
            <ChannelRow
              title="Codex · Gemini · Kimi"
              blurb={
                <>
                  Piped from <code>main</code>. Review the script first if you would rather not
                  pipe a remote one into Bash.
                </>
              }
              commands={[installer]}
            />
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <p className="kicker">Skills · {plugin.skills.length}</p>
          <h2 className="h-lg">What each one does</h2>
          <div className="skills">
            {plugin.skills.map(skill => (
              <SkillEntry
                key={skill.name}
                skill={skill}
                plugin={plugin}
                hue={hue}
                // The plugin is the page, so `<plugin>:<skill>` on every row repeats it.
                showInvoke={false}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
