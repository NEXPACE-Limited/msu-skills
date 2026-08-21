import { CopyButton } from './CopyButton'

/** One command. The text is the single source for what is shown and what is copied. */
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
