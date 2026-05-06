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

export const useKeypress = (key: string, action: () => void) => {
  const actionRef = useRef(action)
  useLayoutEffect(() => {
    actionRef.current = action
  })

  useEffect(() => {
    const onKeyup = (e: KeyboardEvent) => {
      if (e.key === key) {
        actionRef.current()
      }
    }

    window.addEventListener('keyup', onKeyup)
    return () => window.removeEventListener('keyup', onKeyup)
  }, [key])
}
