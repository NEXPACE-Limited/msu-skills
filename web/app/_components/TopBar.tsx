import Link from 'next/link'

import { loadSite } from '@/lib/catalog'
import { asset, MCP_PAGE_DIR, REPO_URL } from '@/lib/site'
import { shortNote } from '@/lib/text'
import { GitHubIcon } from './Icons'
import { hueFor } from './hue'
import { SkillSearch, type SearchItem } from './SkillSearch'
import { ThemeToggle } from './ThemeToggle'

export async function TopBar() {
  const { plugins } = await loadSite()

  const items: SearchItem[] = plugins.flatMap((plugin, index) =>
    plugin.skills.map(skill => ({
      name: skill.name,
      plugin: plugin.name,
      invoke: `${plugin.name}:${skill.name}`,
      note: shortNote(skill.description),
      href: `/${plugin.name}/${skill.name}/`,
      hue: hueFor(index)
    }))
  )

  return (
    <header className="topbar">
      <div className="wrap">
        <Link className="mark" href="/">
          {/* The logo is its own file, not the favicon. The favicon's URL is cached by
              browsers and crawlers and its box is cropped for 16px chrome; a wordmark
              that has to be re-spaced must not drag the tab icon along with it. */}
          <img src={asset('logo.svg')} width={26} height={26} alt="" />
          <b>msu-skills</b>
        </Link>

        <SkillSearch items={items} />

        <nav className="topnav">
          <Link className="opt" href="/#plugins">
            Plugins
          </Link>
          <Link className="opt" href={`/${MCP_PAGE_DIR}/`}>
            MCP
          </Link>
          <a href={REPO_URL} aria-label="GitHub repository">
            <GitHubIcon />
            <span className="lbl">GitHub</span>
          </a>
        </nav>

        <ThemeToggle />
      </div>
    </header>
  )
}
