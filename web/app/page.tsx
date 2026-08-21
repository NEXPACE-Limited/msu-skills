import type { Metadata } from 'next'

import { loadSite } from '@/lib/catalog'
import { organizationJsonLd } from '@/lib/jsonld'
import { pageUrl, REPO_SLUG } from '@/lib/site'
import { ChannelRow } from './_components/ChannelRow'
import { CommandBlock } from './_components/CommandBlock'
import { hueFor } from './_components/hue'
import { JsonLd } from './_components/JsonLd'
import { Notices } from './_components/Notices'
import { PluginPanel } from './_components/PluginPanel'
import { SkillEntry } from './_components/SkillEntry'

export async function generateMetadata(): Promise<Metadata> {
  const { catalog } = await loadSite()
  const url = pageUrl('')

  return {
    // No `title`. This page is the site, so the layout's default already reads
    // '<catalog> — <identity>'; setting one here would run it through the template and
    // repeat the identity.
    description: catalog.description,
    alternates: { canonical: url },
    // MEASURED against next 16.3.1, lib/metadata/resolve-metadata.js mergeMetadata(): a
    // page's `openGraph` REPLACES the layout's resolved one rather than merging into it,
    // so type, siteName and images are restated here or this page ships without them.
    // Only og:title and og:description are back-filled from the page's own metadata.
    openGraph: {
      url,
      type: 'website',
      siteName: catalog.name,
      images: [{ url: 'og.png', width: 1200, height: 630 }]
    }
  }
}

/** One figure in the hero strip. The noun is inflected from the figure, so a catalog that
 *  holds one plugin does not read '1 plugins'. */
function Count({ value, noun }: { value: number; noun: string }) {
  return (
    <span>
      <b>{value}</b> {value === 1 ? noun : `${noun}s`}
    </span>
  )
}

/** Capitalised because the headline below is the only caller and the count opens it. */
const NUMBER_WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight']

/** 'Two plugins' — a headline reads as prose rather than as a figure, but the figure is
 *  still the catalog's. A count past the table falls back to its digits. */
const spelledCount = (count: number, noun: string): string =>
  `${NUMBER_WORDS[count] ?? count} ${count === 1 ? noun : `${noun}s`}`

export default async function CatalogPage() {
  const { catalog, plugins, skillCount } = await loadSite()

  // A server belongs to exactly one plugin — its .mcp.json sits inside that plugin's root
  // — so the plugins' servers concatenate without deduplication.
  const servers = plugins.flatMap(plugin => plugin.servers)

  // Every install string is composed from the repository identity and the catalog rather
  // than typed, so a fork or a rename never publishes someone else's commands.
  const marketplace = `/plugin marketplace add ${REPO_SLUG}`
  const installer = `https://raw.githubusercontent.com/${REPO_SLUG}/main/install.sh`

  // The two channels that select a plugin show one worked example, matching their 'install
  // a plugin' blurbs; each plugin's own page carries its own commands. loadSite() refuses a
  // catalog with no plugin, so this is always present.
  const example = plugins[0]

  return (
    <main>
      <section className="hero">
        <div className="wrap">
          {/* The four brand petals, in favicon order. Decorative: the colours carry no
              information a reader could miss. */}
          <div className="petal-row" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </div>
          <h1 className="h-xl">Teach your agent MapleStory.</h1>
          <p className="lede">
            Skills {catalog.owner.name} publishes for MapleStory Universe builder work — and
            the game-production tooling that goes with them. One command, on Claude Code,
            Codex, Gemini, and Kimi.
          </p>
          {/* All three channels, not just the first. The page's job is to hand over an
              install command, and which one a reader needs is decided by the agent they
              already run — so making two of them a scroll away asks a question the reader
              cannot answer by scrolling. */}
          <div className="hero-cmds">
            <div className="hero-cmd">
              <p className="cmd-label">Claude Code</p>
              <CommandBlock>{marketplace}</CommandBlock>
            </div>
            <div className="hero-cmd">
              <p className="cmd-label">skills CLI</p>
              <CommandBlock>{`npx skills add ${REPO_SLUG}`}</CommandBlock>
            </div>
            <div className="hero-cmd">
              <p className="cmd-label">Codex · Gemini · Kimi</p>
              <CommandBlock>{`curl -fsSL ${installer} | bash`}</CommandBlock>
            </div>
          </div>
          <p className="cmd-note">
            Same skills, same files, whichever you run. The channels differ only in what
            happens to the MCP server — see Install below.
          </p>
          <div className="counts">
            <Count value={plugins.length} noun="plugin" />
            <Count value={skillCount} noun="skill" />
            <Count value={servers.length} noun="MCP server" />
            {/* Not a manifest figure. Skills are shipped verbatim with no build, which is
                the claim this repeats. */}
            <Count value={0} noun="build step" />
          </div>
        </div>
      </section>

      {/* The topbar links to /#plugins, so this id is the target it needs. */}
      <section className="band" id="plugins">
        <div className="wrap">
          <p className="kicker">What&rsquo;s inside</p>
          <h2 className="h-lg">
            {spelledCount(plugins.length, 'plugin')}, one per coupling boundary
          </h2>
          <p className="lede">
            A plugin that needs no credential never acquires one. That is why each gets its
            own root, its own version, and its own colour here.
          </p>
          <div className="panels">
            {plugins.map((plugin, index) => (
              <PluginPanel key={plugin.name} plugin={plugin} hue={hueFor(index)} />
            ))}
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <p className="kicker">All skills · {skillCount}</p>
          <h2 className="h-lg">What each one does</h2>
          <p className="lede">
            These sentences are the product. Your agent reads them to decide whether to load
            the skill — so they are written to be matched, and shown here exactly as written.
          </p>
          <div className="skills">
            {/* Catalog order, and a skill takes the hue of the plugin that ships it —
                the same index the panel above it was drawn from. */}
            {plugins.flatMap((plugin, index) =>
              plugin.skills.map(skill => (
                <SkillEntry
                  key={`${plugin.name}:${skill.name}`}
                  skill={skill}
                  plugin={plugin}
                  hue={hueFor(index)}
                />
              ))
            )}
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <p className="kicker">Install</p>
          <h2 className="h-lg">Three channels, one source</h2>
          <p className="lede">
            The <code>SKILL.md</code> files are the only source and ship verbatim everywhere.
            Channels differ only in what happens to the MCP server.
          </p>
          <div className="channels">
            <ChannelRow
              title="Claude Code"
              blurb="Add this repository as a marketplace, then install a plugin from it."
              state={
                <>
                  MCP <b>automatic</b> — bundled, key via prompt
                </>
              }
              commands={[marketplace, `/plugin install ${example.name}@${catalog.name}`]}
            />
            <ChannelRow
              title="skills CLI"
              blurb={
                <>
                  Offers every catalogued plugin&rsquo;s skills at once. <code>--skill</code>{' '}
                  narrows it to one.
                </>
              }
              state={
                <>
                  MCP <b>manual</b> — set it up from the values on the MCP page
                </>
              }
              commands={[`npx skills add ${REPO_SLUG}`]}
            />
            <ChannelRow
              title="Codex · Gemini · Kimi"
              blurb="No Node.js or checkout needed — the installer pulls a temporary source snapshot and removes it."
              state={
                <>
                  MCP <b>best effort</b> — prints the Codex snippet, runs mcp add for the rest
                </>
              }
              commands={[
                `curl -fsSL ${installer} | bash`,
                `curl -fsSL ${installer} | bash -s -- --plugin ${example.name}`
              ]}
            />
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <p className="kicker">Important notes</p>
          <h2 className="h-lg">Terms that travel with the skills</h2>
          <Notices />
        </div>
      </section>

      <JsonLd json={organizationJsonLd(catalog)} />
    </main>
  )
}
