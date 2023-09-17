import { useRouter } from 'next/router'

type UseSearch = {
  search: string
  lowerCasedSearch: string
  searchQuery: string
  setSearch: (search: string) => void
}

export const useSearch = (): UseSearch => {
  const router = useRouter()
  const { search: rawSearch } = router.query

  const search = (Array.isArray(rawSearch) ? rawSearch[0] : rawSearch) ?? ''

  const lowerCasedSearch = search.toLowerCase()

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
    lowerCasedSearch,
    searchQuery,
    setSearch,
  }
}
