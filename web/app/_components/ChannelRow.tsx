import type { ReactNode } from 'react'

import { CommandList } from './CommandBlock'

/**
 * One install channel: what it is on the left, what to run on the right.
 *
 * Both halves are wrapper elements the grid needs — the row is two columns, and the
 * stylesheet reaches the state line through `.channel > div > p.state`, so flattening
 * either one loses the layout and the type.
 */
export function ChannelRow({
  title,
  blurb,
  commands,
  state
}: {
  title: string
  // ReactNode rather than string: the spec's blurbs carry inline <code> (`--skill`,
  // `~/.codex/config.toml`). A plain string still satisfies it.
  blurb?: ReactNode
  commands: string[]
  state?: ReactNode
}) {
  return (
    <article className="channel">
      <div>
        <h3>{title}</h3>
        {blurb && <p>{blurb}</p>}
        {state && <p className="state">{state}</p>}
      </div>
      <CommandList commands={commands} />
    </article>
  )
}
