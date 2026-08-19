'use client'

import { useEffect, useState } from 'react'
import { MoonIcon, SunIcon, SystemIcon } from './Icons'

type Setting = 'system' | 'light' | 'dark'

const ORDER: Setting[] = ['system', 'light', 'dark']

const LABEL: Record<Setting, string> = {
  system: 'Theme: following the system',
  light: 'Theme: light',
  dark: 'Theme: dark'
}

const ICON = { system: SystemIcon, light: SunIcon, dark: MoonIcon }

/**
 * Three states, not two. Setting `color-scheme` to a concrete value stops
 * `prefers-color-scheme` from matching, so "follow the system" cannot be expressed by the
 * resolved mode alone — it needs its own stored setting. The inline script in the layout
 * has already stamped both attributes before this mounts; this only ever changes them.
 */
export function ThemeToggle() {
  const [setting, setSetting] = useState<Setting>('system')

  useEffect(() => {
    const stamped = document.documentElement.getAttribute('data-theme-setting')
    if (stamped === 'light' || stamped === 'dark' || stamped === 'system') setSetting(stamped)
  }, [])

  const cycle = () => {
    const next = ORDER[(ORDER.indexOf(setting) + 1) % ORDER.length]
    const mode =
      next === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : next

    document.documentElement.setAttribute('data-theme-setting', next)
    document.documentElement.setAttribute('data-color-mode', mode)
    try {
      localStorage.setItem('msu-theme', next)
    } catch {
      // Private browsing denies storage. The choice still applies to this page.
    }
    setSetting(next)
  }

  const Icon = ICON[setting]

  return (
    <button type="button" className="theme" onClick={cycle} aria-label={LABEL[setting]} title={LABEL[setting]}>
      <Icon />
    </button>
  )
}
