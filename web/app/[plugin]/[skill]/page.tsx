import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { CSSProperties } from 'react'

import { loadSite } from '@/lib/catalog'
import { MCP_PAGE_DIR, pageUrl, REPO_SLUG, repoFile, repoTree } from '@/lib/site'
import { plural } from '@/lib/text'
import { Breadcrumb } from '../../_components/Breadcrumb'
import { CommandBlock } from '../../_components/CommandBlock'
import { hueFor } from '../../_components/hue'
import { splitSay } from '../../_components/say'

type Params = { plugin: string; skill: string }
type Props = { params: Promise<Params> }

/** Body prose for this column; globals.css carries no class for it and `.lede` is the
 *  larger, narrower face meant for text above the fold. */
const PROSE: CSSProperties = {
  margin: '0 0 26px',
  fontSize: '17px',
  lineHeight: 1.55,
  color: 'var(--ink-2)',
  maxWidth: '60ch'
}

/** The plugin and skill a route addresses, plus the plugin's hue from its catalog position. */
const findSkill = async ({ plugin: pluginName, skill: skillName }: Params) => {
  const { catalog, plugins } = await loadSite()
  const index = plugins.findIndex(entry => entry.name === pluginName)
  const plugin = index === -1 ? undefined : plugins[index]
  const skill = plugin?.skills.find(entry => entry.name === skillName)
  // Unreachable from generateStaticParams; the answer if the route is asked for outside
  // the exported set.
  if (!plugin || !skill) notFound()

  return { catalog, plugin, skill, hue: hueFor(index) }
}

export async function generateStaticParams(): Promise<Params[]> {
  const { plugins } = await loadSite()
  return plugins.flatMap(plugin =>
    plugin.skills.map(skill => ({ plugin: plugin.name, skill: skill.name }))
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { catalog, plugin, skill } = await findSkill(await params)
  const url = pageUrl(`${plugin.name}/${skill.name}`)

  return {
    // The root layout's template appends the site identity.
    title: skill.name,
    // The frontmatter's own sentence — the same text the page shows.
    description: skill.description,
    alternates: { canonical: url },
    // MEASURED (next/dist/lib/metadata/resolve-metadata.js): a page's `openGraph` REPLACES
    // the layout's rather than merging, so type, siteName and images are restated here.
    openGraph: {
      url,
      type: 'website',
      siteName: catalog.name,
      images: [{ url: 'og.png', width: 1200, height: 630 }]
    }
  }
}

export default async function SkillPage({ params }: Props) {
  const { catalog, plugin, skill, hue } = await findSkill(await params)
  const { first, rest } = splitSay(skill.description)
  const server = plugin.servers[0]

  const skillDir = `${plugin.source}/skills/${skill.name}`
  // hasReferences, not bundled > 0: a skill can ship a file at its own root instead, and a
  // link to a references/ that is not there would 404.
  const extras = skill.hasReferences
    ? { href: repoTree(`${skillDir}/references`), label: 'Browse references/ on GitHub →' }
    : { href: repoTree(skillDir), label: 'Browse the skill directory on GitHub →' }

  return (
    <main>
      <section className="colorhead" style={{ ['--fill' as string]: hue }}>
        <div className="wrap">
          <Breadcrumb
            trail={[
              { name: catalog.name, href: '/' },
              { name: plugin.name, href: `/${plugin.name}/` },
              { name: skill.name }
            ]}
          />
          <p className="kicker">Skill · {plugin.name}</p>
          <h1 className="h-xl">{skill.name}</h1>
          <div className="tags">
            <span className="tag">
              {plugin.name}:{skill.name}
            </span>
            <span className="tag">
              {skill.bundled === 0 ? 'no bundled files' : plural(skill.bundled, 'file')}
            </span>
            <span className="tag">{server ? `needs ${server.name}` : 'no MCP needed'}</span>
          </div>
          {/* --skill is the skills CLI's only selector, so this is the one command that
              installs this skill alone. */}
          <div className="head-cmd">
            <p className="cmd-label">Install just this skill</p>
            <CommandBlock>{`npx skills add ${REPO_SLUG} --skill ${skill.name}`}</CommandBlock>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <div className="two">
            <div>
              <p className="say-big">{first}</p>

              {/* The rest of the description is the matching input an agent reads to decide
                  whether to load the skill. Some descriptions are one sentence and have none. */}
              {rest && (
                <>
                  <p className="kicker">When it loads</p>
                  <p style={PROSE}>{rest}</p>
                </>
              )}

              {skill.bundled > 0 && (
                <>
                  <p className="kicker">What it ships</p>
                  <p style={PROSE}>
                    Besides its SKILL.md, this skill ships {plural(skill.bundled, 'file')}.{' '}
                    <a href={extras.href}>{extras.label}</a>
                  </p>
                </>
              )}
            </div>

            <aside className="aside">
              <div>
                <h4>Invoke</h4>
                <div className="v">
                  {plugin.name}:{skill.name}
                </div>
              </div>
              <div>
                <h4>Plugin</h4>
                <div className="v">
                  <Link href={`/${plugin.name}/`}>{plugin.name}</Link> v{plugin.version}
                </div>
              </div>
              <div>
                <h4>Bundled files</h4>
                <div className="v">
                  {skill.bundled === 0 ? 'None — one file' : plural(skill.bundled, 'file')}
                </div>
              </div>
              <div>
                <h4>MCP</h4>
                <div className="v">
                  {server ? (
                    <Link href={`/${MCP_PAGE_DIR}/`}>{server.name}</Link>
                  ) : (
                    'Not required'
                  )}
                </div>
              </div>
              <div>
                <h4>Source</h4>
                {/* The instruction body is not reproduced here; GitHub stays canonical. */}
                <div className="v">
                  <a href={repoFile(`${skillDir}/SKILL.md`)}>SKILL.md on GitHub →</a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  )
}
