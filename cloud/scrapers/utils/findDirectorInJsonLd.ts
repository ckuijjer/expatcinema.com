import { cleanDirector } from './cleanDirector'

const toNames = (director: unknown): string[] => {
  if (typeof director === 'string') return [director]
  if (Array.isArray(director)) return director.flatMap(toNames)
  if (director && typeof director === 'object' && 'name' in director) {
    return toNames((director as { name: unknown }).name)
  }
  return []
}

const findDirectors = (node: unknown): string[] => {
  if (Array.isArray(node)) return node.flatMap(findDirectors)
  if (!node || typeof node !== 'object') return []

  const { director, ...rest } = node as Record<string, unknown>
  const names = toNames(director)

  return names.length > 0 ? names : Object.values(rest).flatMap(findDirectors)
}

// The first `director` in the JSON-LD blocks of a page, as a string. The
// director is a string, a Person or a list of those, on a Movie or nested in an
// event. Blocks that aren't valid JSON are skipped.
export const findDirectorInJsonLd = (blocks?: string | string[]) =>
  cleanDirector(
    [blocks ?? []]
      .flat()
      .flatMap((block) => {
        try {
          return findDirectors(JSON.parse(block))
        } catch {
          return []
        }
      })
      .filter(Boolean)
      .filter((name, index, names) => names.indexOf(name) === index)
      .join(', '),
  )
