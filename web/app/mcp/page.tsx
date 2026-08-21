import type { Metadata } from 'next'

import { loadSite } from '@/lib/catalog'
import { transportLabel } from '@/lib/mcp'
import { MCP_PAGE_DIR, MCP_PAGE_IDENTITY, pageUrl } from '@/lib/site'
import { plural } from '@/lib/text'
import { Breadcrumb } from '../_components/Breadcrumb'
import { ChannelRow } from '../_components/ChannelRow'
import { KeyValue } from '../_components/KeyValue'
import { SkillEntry } from '../_components/SkillEntry'
import { ToolCard } from '../_components/ToolCard'
import { headClassFor, hueFor } from '../_components/hue'

/** The environment variable every hand-setup snippet reads the key from. README and
 *  install.sh both spell it this way; no manifest declares it. */
const KEY_ENV = 'MSU_OPENAPI_KEY'

/** One `mcp add`, in the flag order README publishes. */
const addCommand = (cli: string, flags: string, server: string, url: string): string =>
  `${cli} mcp add${flags} ${server} ${url}`

export async function generateMetadata(): Promise<Metadata> {
  const { mcpServer, mcpOwner } = await loadSite()
  const url = pageUrl(MCP_PAGE_DIR)

  return {
    title: mcpServer.name,
    description:
      `${mcpServer.name} serves ${MCP_PAGE_IDENTITY} to an agent. Declared by the ` +
      `${mcpOwner.name} plugin, automatic on Claude Code and set up by hand everywhere else.`,
    alternates: { canonical: url },
    openGraph: { url }
  }
}

export default async function McpPage() {
  const { catalog, plugins, mcpOwner, mcpServer, mcpSkills } = await loadSite()

  // The server wears the colour of the plugin that declares it.
  const ownerIndex = plugins.indexOf(mcpOwner)

  // .mcp.json carries one credential header; the first key is the one the userConfig
  // reference was resolved from.
  const header = Object.keys(mcpServer.headers ?? {})[0]
  const transport = transportLabel(mcpServer.type)

  const rows = [
    ...(transport ? [{ label: 'transport', value: transport }] : []),
    ...(mcpServer.url ? [{ label: 'url', value: mcpServer.url }] : []),
    ...(header ? [{ label: 'header', value: header }] : []),
    ...(mcpServer.credentialTitle
      ? [{ label: 'credential', value: mcpServer.credentialTitle }]
      : [])
  ]

  // A flag a declared value cannot fill is dropped rather than printed as `undefined`.
  const flags =
    (mcpServer.type ? ` --transport ${mcpServer.type}` : '') +
    (header ? ` --header "${header}: $${KEY_ENV}"` : '')

  // A transport with no URL gets no snippets instead of three broken ones.
  const setup =
    mcpServer.url === undefined
      ? undefined
      : {
          codex: [
            `[mcp_servers.${mcpServer.name}]`,
            `url = "${mcpServer.url}"`,
            // env_http_headers names the variable; the CLI reads its value at runtime.
            ...(header ? [`env_http_headers = { "${header}" = "${KEY_ENV}" }`] : [])
          ].join('\n'),
          gemini: addCommand('gemini', flags, mcpServer.name, mcpServer.url),
          kimi: addCommand('kimi', flags, mcpServer.name, mcpServer.url)
        }

  return (
    <main>
      <section className={`colorhead ${headClassFor(ownerIndex)}`}>
        <div className="wrap">
          <Breadcrumb
            trail={[{ name: catalog.name, href: '/' }, { name: MCP_PAGE_DIR }]}
          />
          <div className="headgrid">
            <div>
              <p className="kicker">MCP server · owned by {mcpOwner.name}</p>
              <h1 className="h-xl">{mcpServer.name}</h1>
            </div>
            <div>
              <p className="lede">
                {MCP_PAGE_IDENTITY}. One server, owned by one plugin — downstream plugins
                consume it through a dependency, never by redefining it.
              </p>
              <div className="tags">
                <span className="tag">{plural(mcpServer.tools.length, 'tool')}</span>
                <span className="tag">
                  {plural(mcpSkills.length, 'skill')}{' '}
                  {mcpSkills.length === 1 ? 'calls' : 'call'} it
                </span>
                {mcpServer.credentialTitle && <span className="tag">key required</span>}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <p className="kicker">Connection</p>
          <h2 className="h-lg">What the plugin declares</h2>
          <p className="lede">
            Every value here is read from the plugin&rsquo;s own <code>.mcp.json</code>, so
            this page cannot describe the server differently from the file that defines it.
          </p>
          <KeyValue rows={rows} />
          {mcpServer.credentialNote && (
            <p className="cmd-note">{mcpServer.credentialNote}</p>
          )}
          <p className="cmd-note">
            Never commit it — pass it through the environment.
          </p>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <p className="kicker">Tools</p>
          <h2 className="h-lg">What the server answers</h2>
          <div className="tools">
            {mcpServer.tools.map(tool => (
              <ToolCard key={tool.name} tool={tool} />
            ))}
          </div>
        </div>
      </section>

      {setup && (
        <section className="band">
          <div className="wrap">
            <p className="kicker">Setup by hand</p>
            <h2 className="h-lg">Every channel but Claude Code</h2>
            <div className="channels">
              <ChannelRow
                title="Codex CLI"
                blurb={
                  <>
                    Add to <code>~/.codex/config.toml</code>. The key is read from the
                    environment at runtime.
                  </>
                }
                commands={[setup.codex]}
              />
              <ChannelRow
                title="Gemini CLI"
                blurb="One command. The key has to be exported when the server is registered."
                commands={[setup.gemini]}
              />
              <ChannelRow title="Kimi CLI" blurb="Same shape as Gemini." commands={[setup.kimi]} />
            </div>
          </div>
        </section>
      )}

      <section className="band">
        <div className="wrap">
          <p className="kicker">Callers</p>
          <h2 className="h-lg">Skills that need this server</h2>
          <div className="skills">
            {mcpSkills.map(({ skill, plugin }) => (
              <SkillEntry
                key={`${plugin.name}:${skill.name}`}
                skill={skill}
                plugin={plugin}
                hue={hueFor(plugins.indexOf(plugin))}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
