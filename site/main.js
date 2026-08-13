// Copy-to-clipboard for every command block. No dependencies, no build step.

const RESET_MS = 1600

const label = (button, text, state) => {
  button.textContent = text
  button.setAttribute('aria-label', text === 'Copy' ? 'Copy command to clipboard' : text)
  if (state) {
    button.dataset.state = state
  } else {
    delete button.dataset.state
  }
}

const copy = async button => {
  const block = button.closest('.cmd')?.querySelector('pre code')
  if (!block) return

  try {
    await navigator.clipboard.writeText(block.textContent.trim())
    label(button, 'Copied', 'done')
  } catch {
    // Clipboard access is denied over insecure origins and in some embedded views.
    label(button, 'Select and copy', 'done')
  }

  window.setTimeout(() => label(button, 'Copy'), RESET_MS)
}

for (const button of document.querySelectorAll('.copy')) {
  label(button, 'Copy')
  button.addEventListener('click', () => copy(button))
}

// The install paths stay fully visible without JavaScript. When scripting is available,
// enhance them into one keyboard-accessible choice with a single focused command panel.
const setupInstallPicker = picker => {
  const tablist = picker.querySelector('[data-install-tabs]')
  const tabs = [...picker.querySelectorAll('[data-install-tab]')]
  const panels = [...picker.querySelectorAll('[data-install-panel]')]
  if (!tablist || tabs.length === 0 || tabs.length !== panels.length) return

  const activate = (index, moveFocus = false) => {
    tabs.forEach((tab, tabIndex) => {
      const selected = tabIndex === index
      tab.setAttribute('aria-selected', String(selected))
      tab.tabIndex = selected ? 0 : -1
      panels[tabIndex].hidden = !selected
    })

    if (moveFocus) tabs[index].focus()
  }

  tablist.setAttribute('role', 'tablist')
  tablist.setAttribute('aria-label', 'Install channel')

  tabs.forEach((tab, index) => {
    const key = tab.dataset.installTab
    const panel = panels.find(candidate => candidate.dataset.installPanel === key)
    if (!key || !panel) return

    tab.id = `install-tab-${key}`
    tab.setAttribute('role', 'tab')
    tab.setAttribute('aria-controls', panel.id)
    panel.setAttribute('role', 'tabpanel')
    panel.setAttribute('aria-labelledby', tab.id)

    tab.addEventListener('click', () => activate(index))
    tab.addEventListener('keydown', event => {
      const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End']
      if (!keys.includes(event.key)) return

      event.preventDefault()
      if (event.key === 'Home') return activate(0, true)
      if (event.key === 'End') return activate(tabs.length - 1, true)

      const direction = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1
      activate((index + direction + tabs.length) % tabs.length, true)
    })
  })

  activate(0)
  picker.classList.add('is-enhanced')
  tablist.hidden = false
}

for (const picker of document.querySelectorAll('[data-install-picker]')) {
  setupInstallPicker(picker)
}
