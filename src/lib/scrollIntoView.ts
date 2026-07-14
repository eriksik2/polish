const SCROLL_PADDING_PX = 16

function getBottomNavClearance(): number {
  const nav = document.querySelector('nav')
  if (nav) {
    const rect = nav.getBoundingClientRect()
    if (rect.height > 0 && rect.top < window.innerHeight) {
      return window.innerHeight - rect.top + SCROLL_PADDING_PX
    }
  }
  return 80 + SCROLL_PADDING_PX
}

/** Scroll so an element sits above the bottom nav with comfortable padding */
export function scrollElementIntoView(el: HTMLElement | null, behavior: ScrollBehavior = 'smooth') {
  if (!el) return

  const run = () => {
    const clearance = getBottomNavClearance()
    const viewportBottom = (window.visualViewport?.height ?? window.innerHeight) - clearance
    const rect = el.getBoundingClientRect()
    const overflow = rect.bottom - viewportBottom
    if (overflow > 1) {
      window.scrollBy({ top: overflow, behavior })
    }
  }

  run()
  requestAnimationFrame(() => {
    run()
    requestAnimationFrame(run)
  })
}

export function scrollElementIntoViewRepeated(
  el: HTMLElement | null,
  delaysMs: number[] = [0, 50, 150, 300, 600, 1000],
) {
  const timers = delaysMs.map((delay) =>
    setTimeout(() => scrollElementIntoView(el, delay < 150 ? 'auto' : 'smooth'), delay),
  )
  return () => timers.forEach(clearTimeout)
}
