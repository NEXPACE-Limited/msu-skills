import type { ReactNode } from 'react'

import { CommandList } from './CommandBlock'

/** One install channel: what it is on the left, what to run on the right. Both halves are
 *  wrapper elements the grid needs, and the stylesheet reaches the state line through
 *  `.channel > div > p.state`. */
export function ChannelRow({
  title,
  blurb,
  commands,
  state
}: {
  title: string
  // ReactNode so a blurb can carry inline <code>; a plain string still satisfies it.
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
