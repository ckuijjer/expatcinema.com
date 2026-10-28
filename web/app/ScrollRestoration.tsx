'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

const MAX_FRAMES = 60

// Next puts a page opened with the back button at the top. The browser would
// put it where it was, but only for a page that is loaded again, and the links
// to a movie open inside the app. So the scroll position is kept before a link
// is followed, and put back when the back or forward button opens the page
// again.
export const ScrollRestoration = () => {
  const pathname = usePathname()
  const positions = useRef(new Map<string, number>())
  const backOrForward = useRef(false)

  useEffect(() => {
    const keep = () =>
      positions.current.set(location.pathname + location.search, scrollY)
    const onClick = (event: MouseEvent) => {
      if ((event.target as Element | null)?.closest?.('a[href]')) keep()
    }
    const onPopState = () => {
      backOrForward.current = true
    }

    document.addEventListener('click', onClick, true)
    window.addEventListener('popstate', onPopState)
    return () => {
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('popstate', onPopState)
    }
  }, [])

  useEffect(() => {
    if (!backOrForward.current) return
    backOrForward.current = false

    const y = positions.current.get(location.pathname + location.search)
    if (!y) return

    // Next scrolls to the top once more after the page is there, so it keeps
    // putting the position back for a second, until the visitor scrolls
    let frame = 0
    let stopped = false
    const stop = () => {
      stopped = true
    }
    const events = ['wheel', 'touchstart', 'keydown', 'mousedown'] as const
    events.forEach((name) =>
      window.addEventListener(name, stop, { once: true, passive: true }),
    )

    const restore = () => {
      if (stopped || frame++ > MAX_FRAMES) {
        events.forEach((name) => window.removeEventListener(name, stop))
        return
      }
      if (Math.abs(scrollY - y) > 2) scrollTo(0, y)
      requestAnimationFrame(restore)
    }
    requestAnimationFrame(restore)
  }, [pathname])

  return null
}
