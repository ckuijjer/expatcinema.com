'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import { removeDiacritics } from './removeDiacritics'

type UseSearch = {
  search: string
  searchComponents: string[]
  searchQuery: string
  setSearch: (search: string) => void
}

export const useSearch = (): UseSearch => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const search = searchParams?.get('search') ?? ''

  const searchComponents =
    search === '' ? [] : removeDiacritics(search.toLowerCase()).split(/\s+/)

  const searchQuery = search ? `?search=${search}` : ''

  const setSearch = (value?: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    if (!value) {
      params.delete('search')
    } else {
      params.set('search', value)
    }
    const query = params.toString()
    router.replace(`${pathname}${query ? `?${query}` : ''}`)
  }

  return {
    search,
    searchComponents,
    searchQuery,
    setSearch,
  }
}

export const useScrollFade = (ref: React.RefObject<HTMLElement | null>) => {
  const [showFade, setShowFade] = useState(true)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const update = () => {
      const hasOverflow = el.scrollWidth > el.clientWidth
      const isAtEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1
      setShowFade(hasOverflow && !isAtEnd)
    }

    const observer = new ResizeObserver(update)
    observer.observe(el)
    el.addEventListener('scroll', update)
    update()

    return () => {
      observer.disconnect()
      el.removeEventListener('scroll', update)
    }
  }, [ref])

  return showFade
}

const isEditable = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

// Runs the action when the key is pressed. Unless `inInputs` is set, a key typed
// into a form field is ignored, so a shortcut like "/" can still be typed in
// the search box.
export const useKeypress = (
  key: string,
  action: () => void,
  { inInputs = false }: { inInputs?: boolean } = {},
) => {
  const actionRef = useRef(action)
  useLayoutEffect(() => {
    actionRef.current = action
  })

  useEffect(() => {
    const onKeyup = (e: KeyboardEvent) => {
      if (e.key !== key) return
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (!inInputs && isEditable(e.target)) return

      actionRef.current()
    }

    window.addEventListener('keyup', onKeyup)
    return () => window.removeEventListener('keyup', onKeyup)
  }, [key, inInputs])
}

// Runs the action on keydown when `matches` accepts the event, and stops the
// browser from also acting on it (Firefox opens quick find on "/", Chrome
// focuses the address bar on Ctrl+K). A shortcut typed into a form field is
// ignored unless `inInputs` is set.
export const useShortcut = (
  matches: (e: KeyboardEvent) => boolean,
  action: () => void,
  { inInputs = false }: { inInputs?: boolean } = {},
) => {
  const matchesRef = useRef(matches)
  const actionRef = useRef(action)
  useLayoutEffect(() => {
    matchesRef.current = matches
    actionRef.current = action
  })

  useEffect(() => {
    const onKeydown = (e: KeyboardEvent) => {
      if (e.repeat || e.isComposing || !matchesRef.current(e)) return
      if (!inInputs && isEditable(e.target)) return

      e.preventDefault()
      actionRef.current()
    }

    window.addEventListener('keydown', onKeydown)
    return () => window.removeEventListener('keydown', onKeydown)
  }, [inInputs])
}
