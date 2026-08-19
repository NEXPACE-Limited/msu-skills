'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertIcon, CheckIcon, CopyIcon } from './Icons'

type State = 'idle' | 'done' | 'blocked'

const LABEL: Record<State, string> = {
  idle: 'Copy command',
  done: 'Copied',
  // navigator.clipboard is secure-context only, so a page opened over file:// — which is
  // how a rendered export gets reviewed by hand — cannot copy at all. Saying so beats a
  // button that silently does nothing.
  blocked: 'Copy blocked — select the text instead'
}

export function CopyButton({ text }: { text: string }) {
  const [state, setState] = useState<State>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const flash = (next: State) => {
    setState(next)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), 1800)
  }

  const copy = async () => {
    if (!navigator.clipboard || !window.isSecureContext) {
      flash('blocked')
      return
    }
    try {
      // A leading prompt marker is punctuation for the reader, never part of the command.
      await navigator.clipboard.writeText(text.replace(/^\$\s+/gm, ''))
      flash('done')
    } catch {
      flash('blocked')
    }
  }

  return (
    <button
      type="button"
      className="cp"
      data-state={state === 'idle' ? undefined : state}
      aria-label={LABEL[state]}
      title={LABEL[state]}
      onClick={copy}
    >
      {state === 'done' ? <CheckIcon /> : state === 'blocked' ? <AlertIcon /> : <CopyIcon />}
    </button>
  )
}
