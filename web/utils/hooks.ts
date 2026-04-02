'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef } from 'react'

const removeDiacritics = (str: string) =>
  str.normalize('NFD').replace(/\p{Diacritic}/gu, '')

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
