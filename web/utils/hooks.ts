import { useRouter } from 'next/router'
import { useEffect } from 'react'
import removeAccents from 'remove-accents'

type UseSearch = {
  search: string
  searchComponents: string[]
  searchQuery: string
  setSearch: (search: string) => void
}

export const useSearch = (): UseSearch => {
  const router = useRouter()
  const { search: rawSearch } = router.query

  const search = (Array.isArray(rawSearch) ? rawSearch[0] : rawSearch) ?? ''

  const searchComponents =
    search === '' ? [] : removeAccents(search.toLowerCase()).split(/\s+/)

  const searchQuery = search ? `?search=${search}` : ''

  const setSearch = (value?: string) => {
    if (value == '') {
      const { search, ...rest } = router.query
      router.replace({ query: { ...rest } })
    } else {
      router.replace({
        query: { ...router.query, search: value },
      })
    }
  }

  return {
    search,
    searchComponents,
    searchQuery,
    setSearch,
  }
}

export const useKeypress = (key, action) => {
  useEffect(() => {
    const onKeyup = (e) => {
      if (e.key === key) {
        action()
      }
    }

    window.addEventListener('keyup', onKeyup)
    return () => window.removeEventListener('keyup', onKeyup)
  }, [])
}
