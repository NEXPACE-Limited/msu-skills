/**
 * One skill, read off disk: its frontmatter, what it bundles, and whether it ships a
 * references/ directory. Ported from scripts/build-site.mjs:119-180 with the parsing
 * semantics unchanged — the same SKILL.md files feed a sitemap and an llms.txt that are
 * compared against that generator's output.
 */

import { existsSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import type { Skill } from './types'

/** The record being built and the key a continuation line folds into. The source carried
 *  that key as a `_last` field on the same accumulator; holding it beside the record keeps a
 *  synthetic key out of what callers read. */
type Frontmatter = {
  readonly fields: Record<string, string>
  readonly last: string | null
}

/** Parses the YAML frontmatter of a SKILL.md. Only flat `key: value` pairs are used, with
 *  wrapped continuation lines folded into the previous value. */
export const parseFrontmatter = (text: string, path: string): Record<string, string> => {
  const lines = text.split('\n')
  if (lines[0]?.trim() !== '---') {
    throw new Error(`${path}: no frontmatter block`)
  }
  const end = lines.findIndex((line, index) => index > 0 && line.trim() === '---')
  if (end === -1) {
    throw new Error(`${path}: frontmatter block is not closed`)
  }

  const parsed = lines.slice(1, end).reduce<Frontmatter>(
    (state, line) => {
      const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
      if (match) {
        const [, key, raw] = match
        // `description: >` and `description: |` carry the text on the lines below, so the
        // indicator itself is not the value. Both fold to one line here — a card shows the
        // description as a single paragraph either way.
        const value = /^[|>][+-]?\d*$/.test(raw.trim())
          ? ''
          : raw.replace(/^["']|["']$/g, '').trim()
        return { fields: { ...state.fields, [key]: value }, last: key }
      }
      const continued = line.trim()
      if (!continued || !state.last) return state
      return {
        fields: {
          ...state.fields,
          [state.last]: `${state.fields[state.last]} ${continued}`.trim()
        },
        last: state.last
      }
    },
    { fields: {}, last: null }
  )

  return parsed.fields
}

/** Everything the skill ships besides SKILL.md, at any depth: references/*.md for most,
 *  a library file at the skill root for others. */
export const countBundled = async (dir: string): Promise<number> => {
  const entries = await readdir(dir, { withFileTypes: true })
  const counts = await Promise.all(
    entries.map(entry => {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) return countBundled(path)
      return Promise.resolve(entry.name === 'SKILL.md' ? 0 : 1)
    })
  )
  return counts.reduce((total, count) => total + count, 0)
}

export const readSkill = async (pluginDir: string, name: string): Promise<Skill> => {
  const dir = join(pluginDir, 'skills', name)
  const path = join(dir, 'SKILL.md')
  const fields = parseFrontmatter(await readFile(path, 'utf8'), path)

  if (fields.name !== name) {
    throw new Error(`${path}: frontmatter name '${fields.name}' != directory name '${name}'`)
  }
  if (!fields.description) {
    throw new Error(`${path}: frontmatter has no description`)
  }

  return {
    name,
    description: fields.description,
    bundled: await countBundled(dir),
    // Not every skill has one, and a card must not link to a directory that is not there.
    hasReferences: existsSync(join(dir, 'references'))
  }
}
