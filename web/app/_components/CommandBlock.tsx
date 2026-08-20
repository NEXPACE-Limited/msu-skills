import { CopyButton } from './CopyButton'

/** One command, with the only interactive element on most of these pages. The text is the
 *  single source for both what is shown and what is copied, so the two cannot drift. */
export function CommandBlock({ children }: { children: string }) {
  return (
    <div className="cmd">
      <pre>
        <code>{children}</code>
      </pre>
      <CopyButton text={children} />
    </div>
  )
}

export function CommandList({ commands }: { commands: string[] }) {
  return (
    <div className="cmds">
      {commands.map(command => (
        <CommandBlock key={command}>{command}</CommandBlock>
      ))}
    </div>
  )
}
