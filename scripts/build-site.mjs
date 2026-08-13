#!/usr/bin/env node
// Renders the site from the repository itself: the catalog, every plugin manifest, and every
// SKILL.md frontmatter. Nothing about a plugin or a skill is retyped in site/, so adding
// either updates the pages with no edit to this script or to a template.
//
// Output: index.html for the catalog, plus <plugin>/index.html for each catalogued plugin.
//
// Usage: node scripts/build-site.mjs [outDir]      (default outDir: _site)
// Zero dependencies; Node 18+.

import { readFile, readdir, mkdir, writeFile, copyFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname, basename, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SITE = join(ROOT, 'site')
const PARTIALS = join(SITE, 'partials')
// resolve, not join: CI passes an absolute path outside the checkout.
const OUT = resolve(ROOT, process.argv[2] ?? '_site')

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const escape = value => String(value).replace(/[&<>"']/g, char => ESCAPES[char])

const plural = (count, noun) => (count === 1 ? `one ${noun}` : `${count} ${noun}s`)

const readJson = async path => {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch (error) {
    throw new Error(`cannot read ${path}: ${error.message}`)
  }
}

const listDirs = async path =>
  (await readdir(path, { withFileTypes: true }))
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort()

/** Parses the YAML frontmatter of a SKILL.md. Only flat `key: value` pairs are used, with
 *  wrapped continuation lines folded into the previous value. */
const parseFrontmatter = (text, path) => {
  const lines = text.split('\n')
  if (lines[0]?.trim() !== '---') {
    throw new Error(`${path}: no frontmatter block`)
  }
  const end = lines.findIndex((line, index) => index > 0 && line.trim() === '---')
  if (end === -1) {
    throw new Error(`${path}: frontmatter block is not closed`)
  }

  return lines.slice(1, end).reduce((fields, line) => {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (match) {
      const [, key, raw] = match
      return { ...fields, [key]: raw.replace(/^["']|["']$/g, '').trim(), _last: key }
    }
    const continued = line.trim()
    if (!continued || !fields._last) return fields
    return { ...fields, [fields._last]: `${fields[fields._last]} ${continued}`.trim() }
  }, {})
}

/** Everything the skill ships besides SKILL.md, at any depth: references/*.md for most,
 *  a library file at the skill root for others. */
const countBundled = async dir => {
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

const readSkill = async (pluginDir, name) => {
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

const readPlugin = async entry => {
  const source = entry.source.replace(/^\.\//, '').replace(/\/$/, '')
  const dir = join(ROOT, source)
  const manifest = await readJson(join(dir, '.claude-plugin', 'plugin.json'))

  const mcpPath = join(dir, '.mcp.json')
  const servers = existsSync(mcpPath)
    ? Object.keys((await readJson(mcpPath)).mcpServers ?? {})
    : []

  const skillsDir = join(dir, 'skills')
  const names = existsSync(skillsDir) ? await listDirs(skillsDir) : []
  const skills = await Promise.all(names.map(name => readSkill(dir, name)))

  return {
    name: manifest.name,
    display: manifest.displayName ?? entry.displayName ?? manifest.name,
    description: manifest.description ?? entry.description ?? '',
    version: manifest.version,
    source,
    servers,
    skills
  }
}

const serverList = servers => servers.map(name => `<code>${escape(name)}</code>`).join(', ')

const mcpSummary = servers =>
  servers.length === 0
    ? 'None — this plugin needs no credential'
    : `${serverList(servers)} — automatic in Claude Code`

/* ── page fragments ──────────────────────────────────────────────────────────────── */

const pluginCard = plugin => `
        <a class="plugin-card" href="./${escape(plugin.name)}/">
          <div class="plugin-card-main">
            <header class="plugin-card-head">
              <h3>${escape(plugin.display)}</h3>
              <code>${escape(plugin.name)}</code>
              <span class="plugin-card-ver">v${escape(plugin.version)}</span>
            </header>
            <p class="plugin-card-desc">${escape(plugin.description)}</p>
          </div>
          <div class="plugin-card-side">
            <ul class="plugin-card-skills">
${plugin.skills.map(skill => `              <li>${escape(skill.name)}</li>`).join('\n')}
            </ul>
            <p class="plugin-card-foot">
              <span>${plural(plugin.skills.length, 'skill')}</span>
              <span>${plugin.servers.length === 0 ? 'no credential' : `${escape(plugin.servers.join(', '))} MCP`}</span>
              <span class="plugin-card-go">Open<span aria-hidden="true"> →</span></span>
            </p>
          </div>
        </a>`

const skillCard = (skill, plugin, repoUrl) => {
  const path = `${plugin.source}/skills/${escape(skill.name)}`
  const browse = skill.hasReferences
    ? `<a href="${repoUrl}/tree/main/${path}/references">Browse references →</a>`
    : skill.bundled > 0
      ? `<a href="${repoUrl}/tree/main/${path}">Browse the folder →</a>`
      : ''

  return `
        <article class="skill">
          <header class="skill-head">
            <h3 class="skill-name">${escape(skill.name)}</h3>
            <span class="skill-plugin">${escape(plugin.name)}:${escape(skill.name)}</span>
          </header>
          <div class="fm">
            <span class="fm-rule">---</span>
            <span class="fm-row"><span class="fm-key">name:</span> <span class="fm-val">${escape(skill.name)}</span></span>
            <span class="fm-row"><span class="fm-key">description:</span> <span class="fm-val">${escape(skill.description)}</span></span>
            <span class="fm-rule">---</span>
          </div>
          <dl class="skill-meta">
${skill.bundled > 0 ? `            <div><dt>Bundled files</dt><dd>${skill.bundled}</dd></div>\n` : ''}            <div><dt>Requires</dt><dd>${plugin.servers.length === 0 ? 'No credential' : `${serverList(plugin.servers)} MCP`}</dd></div>
          </dl>
          <p class="skill-links">
            <a href="${repoUrl}/blob/main/${path}/SKILL.md">Read SKILL.md →</a>
            ${browse}
          </p>
        </article>`
}

/* ── rendering ───────────────────────────────────────────────────────────────────── */

const loadPartials = async () => {
  const files = (await readdir(PARTIALS)).filter(file => file.endsWith('.html'))
  const entries = await Promise.all(
    files.map(async file => [basename(file, '.html'), await readFile(join(PARTIALS, file), 'utf8')])
  )
  return Object.fromEntries(entries)
}

const render = (template, partials, tokens, label) => {
  const withPartials = template.replace(/\{\{>([a-z-]+)\}\}/g, (match, name) => {
    if (!(name in partials)) {
      throw new Error(`${label}: no partial named '${name}' in site/partials/`)
    }
    return partials[name]
  })

  const html = Object.entries(tokens).reduce(
    (page, [token, value]) => page.replaceAll(`{{${token}}}`, value),
    withPartials
  )

  const unresolved = html.match(/\{\{[A-Z_]+\}\}/g)
  if (unresolved) {
    throw new Error(`${label}: token(s) with no value: ${[...new Set(unresolved)].join(', ')}`)
  }
  return html
}

const writePage = async (relativePath, html) => {
  const path = join(OUT, relativePath)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, html)
}

/** Empties the output directory so a deleted plugin or skill leaves no stale page behind.
 *  CI always builds into a fresh directory; this is what keeps a local rebuild honest.
 *  The path comes from argv, so it is only emptied when it is safe to: never the repo or a
 *  directory above it, and never a directory holding anything but a previous build. */
const resetOutputDir = async () => {
  if (OUT === ROOT || ROOT === OUT || ROOT.startsWith(OUT + sep)) {
    throw new Error(`refusing to empty ${OUT}: it contains the repository`)
  }

  if (existsSync(OUT)) {
    const entries = await readdir(OUT)
    if (entries.length > 0 && !entries.includes('index.html')) {
      throw new Error(
        `refusing to empty ${OUT}: it holds files that are not a previous build ` +
          `(no index.html). Pass an empty directory, or delete it yourself.`
      )
    }
    await rm(OUT, { recursive: true, force: true })
  }

  await mkdir(OUT, { recursive: true })
}

const copyAssets = async () => {
  const assets = (await readdir(SITE, { withFileTypes: true }))
    .filter(entry => entry.isFile() && entry.name !== 'template.html' && entry.name !== 'plugin.html')
    .map(entry => entry.name)
  await Promise.all(assets.map(file => copyFile(join(SITE, file), join(OUT, file))))
  return assets
}

const build = async () => {
  const catalog = await readJson(join(ROOT, '.claude-plugin', 'marketplace.json'))
  const entries = catalog.plugins.filter(entry => typeof entry.source === 'string')
  if (entries.length === 0) {
    throw new Error('the catalog lists no plugin with a local source path')
  }

  const plugins = await Promise.all(entries.map(readPlugin))
  const skillCount = plugins.reduce((total, plugin) => total + plugin.skills.length, 0)
  if (skillCount === 0) {
    throw new Error('no SKILL.md found under any catalogued plugin')
  }

  // Whichever plugin owns an MCP server is the one the MCP section documents. A plugin
  // that owns none needs no setup, so it is never the subject there.
  const mcpOwner = plugins.find(plugin => plugin.servers.length > 0) ?? plugins[0]

  const repoUrl = (entries[0].repository ?? `${catalog.owner.url}/${catalog.name}`).replace(/\.git$/, '')
  const [owner, repo] = repoUrl.split('/').slice(-2)
  const siteUrl = `https://${owner.toLowerCase()}.github.io/${repo}/`
  const catalogSentence = escape(catalog.description.replace(/\.?$/, '.'))

  // Tokens every page shares. Page-specific ones are merged in below.
  const common = {
    CATALOG_NAME: escape(catalog.name),
    CATALOG_DESCRIPTION: escape(catalog.description),
    REPO_URL: repoUrl,
    REPO_SLUG: `${owner}/${repo}`,
    REPO_NAME: repo,
    PLUGIN_VERSIONS: plugins
      .map(plugin => `${escape(plugin.name)} v${escape(plugin.version)}`)
      .join(' · ')
  }

  await resetOutputDir()

  const partials = await loadPartials()

  const indexHtml = render(
    await readFile(join(SITE, 'template.html'), 'utf8'),
    partials,
    {
      ...common,
      ROOT: './',
      PAGE_TITLE: `${escape(catalog.name)} — Agent Skills for MapleStory Universe`,
      PAGE_DESCRIPTION: `${catalogSentence} Install the skills into Claude Code, the skills CLI, or any agent that reads SKILL.md.`,
      PAGE_URL: siteUrl,
      CATALOG_SENTENCE: catalogSentence,
      PLUGIN_COUNT_PHRASE: plural(plugins.length, 'plugin'),
      SKILL_COUNT_PHRASE: plural(skillCount, 'skill'),
      PLUGIN_INSTALL_LINES: plugins
        .map(plugin => `/plugin install ${escape(plugin.name)}@${escape(catalog.name)}`)
        .join('\n'),
      MCP_PLUGIN: escape(mcpOwner.name),
      MCP_SOURCE: escape(mcpOwner.source),
      MCP_SERVER: escape(mcpOwner.servers[0] ?? ''),
      PLUGIN_CARDS: plugins.map(pluginCard).join('\n')
    },
    'site/template.html'
  )
  await writePage('index.html', indexHtml)

  const pluginTemplate = await readFile(join(SITE, 'plugin.html'), 'utf8')
  for (const plugin of plugins) {
    const html = render(
      pluginTemplate,
      partials,
      {
        ...common,
        ROOT: '../',
        PAGE_TITLE: `${escape(plugin.name)} — ${escape(catalog.name)}`,
        PAGE_DESCRIPTION: escape(plugin.description.replace(/\.?$/, '.')),
        PAGE_URL: `${siteUrl}${plugin.name}/`,
        PLUGIN_NAME: escape(plugin.name),
        PLUGIN_DISPLAY: escape(plugin.display),
        PLUGIN_DESCRIPTION: escape(plugin.description),
        PLUGIN_VERSION: escape(plugin.version),
        PLUGIN_REF: `${escape(plugin.name)}@${escape(catalog.name)}`,
        PLUGIN_SOURCE: escape(plugin.source),
        PLUGIN_SKILL_COUNT_PHRASE: plural(plugin.skills.length, 'skill'),
        PLUGIN_MCP_SUMMARY: mcpSummary(plugin.servers),
        SKILL_CARDS: plugin.skills.map(skill => skillCard(skill, plugin, repoUrl)).join('\n')
      },
      `site/plugin.html (${plugin.name})`
    )
    await writePage(join(plugin.name, 'index.html'), html)
  }

  const assets = await copyAssets()

  process.stdout.write(
    `${basename(OUT)}/ — ${plugins.length + 1} page(s), ` +
      `${plugins.length} plugin(s), ${skillCount} skill(s), ${assets.length} asset(s)\n`
  )
}

build().catch(error => {
  process.stderr.write(`build-site: ${error.message}\n`)
  process.exit(1)
})
