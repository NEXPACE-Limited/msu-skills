import Link from 'next/link'

import type { Plugin, Skill } from '@/lib/types'
import { plural } from '@/lib/text'
import { splitSay } from './say'

/** One skill, full width: descriptions vary more than four-fold in length, so rows that
 *  need no common height are the only shape that neither clips nor leaves holes. The rest
 *  of the description sits in a <details>, which discloses without JavaScript. */
export function SkillEntry({
  skill,
  plugin,
  hue,
  showInvoke = true
}: {
  skill: Skill
  plugin: Plugin
  hue: string
  showInvoke?: boolean
}) {
  const { first, rest } = splitSay(skill.description)

  return (
    // data-skill is the anchor CI greps to prove every skill has a card on its own plugin's
    // page. An attribute rather than a class, so the check is not tied to the design.
    <article className="skill" data-skill={skill.name} style={{ ['--fill' as string]: hue }}>
      <div className="skill-id">
        <h3 className="skill-name">
          <span className="dot" />
          <Link href={`/${plugin.name}/${skill.name}/`}>{skill.name}</Link>
        </h3>
        <div className="tags">
          {showInvoke && (
            <span className="tag">
              {plugin.name}:{skill.name}
            </span>
          )}
          {plugin.servers.length > 0 && (
            <span className="tag hot">needs {plugin.servers[0].name}</span>
          )}
          <span className="tag">
            {skill.bundled === 0 ? 'one file only' : plural(skill.bundled, 'file')}
          </span>
        </div>
      </div>

      <div className="skill-body">
        <p className="skill-say">{first}</p>
        {rest && (
          <details className="more">
            <summary>Read the rest</summary>
            <p className="skill-say rest">{rest}</p>
          </details>
        )}
      </div>
    </article>
  )
}
