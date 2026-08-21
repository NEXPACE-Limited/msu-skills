'use client'

import { Command } from 'cmdk'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SearchIcon } from './Icons'

export type SearchItem = {
  name: string
  plugin: string
  invoke: string
  /** The first sentence of the description — the same shortening llms.txt uses. */
  note: string
  href: string
  hue: string
}

/** Search over the catalog's skills: substring matching over name, plugin and description.
 *  No facets — the frontmatter carries no axis worth filtering on. */
export function SkillSearch({ items }: { items: SearchItem[] }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(current => !current)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const plugins = new Set(items.map(item => item.plugin)).size

  return (
    <>
      <button type="button" className="find" onClick={() => setOpen(true)}>
        <SearchIcon />
        <span className="flbl">Search skills</span>
        <kbd>⌘K</kbd>
      </button>

      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Search skills"
        overlayClassName="pal-veil"
        contentClassName="pal"
      >
        <div className="pal-top">
          <SearchIcon />
          <Command.Input placeholder="Search skills by name or by what they do" />
          <span className="pal-esc">esc</span>
        </div>

        <Command.List className="pal-list">
          <Command.Empty className="pal-empty">
            <b>No skill matches that</b>
            This catalog holds {items.length} skills across {plugins} plugins. Clear the box to
            see all of them.
          </Command.Empty>

          {items.map(item => (
            <Command.Item
              key={item.href}
              className="pal-item"
              style={{ ['--fill' as string]: item.hue }}
              value={`${item.name} ${item.plugin} ${item.invoke} ${item.note}`}
              onSelect={() => {
                setOpen(false)
                router.push(item.href)
              }}
            >
              <span className="dot" />
              <span>
                <span className="nm">{item.name}</span>
                <span className="ds">{item.note}</span>
              </span>
            </Command.Item>
          ))}
        </Command.List>

        <div className="pal-foot">
          <span>↑↓ move</span>
          <span>↵ open</span>
          <span>
            {items.length} skills · {plugins} plugins
          </span>
        </div>
      </Command.Dialog>
    </>
  )
}
