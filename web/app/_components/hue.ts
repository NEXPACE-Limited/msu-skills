/**
 * Colour is a plugin's identity, not decoration: every skill, card and page head takes the
 * hue of the plugin that ships it. The four values are favicon.svg's own petals, so the
 * palette is the brand rather than a theme picked to match it.
 *
 * Plugins draw from the list in catalog order and wrap, so a fifth plugin reuses the first
 * hue rather than needing a new colour invented for it.
 */
const HUES = ['var(--mint)', 'var(--blue)', 'var(--pink)', 'var(--purple)'] as const

export const hueFor = (pluginIndex: number): string => HUES[pluginIndex % HUES.length]

/** The modifier class the coloured page head takes, matching hueFor's order. */
const HEAD_CLASS = ['is-mint', 'is-blue', 'is-pink', 'is-purple'] as const

export const headClassFor = (pluginIndex: number): string =>
  HEAD_CLASS[pluginIndex % HEAD_CLASS.length]
