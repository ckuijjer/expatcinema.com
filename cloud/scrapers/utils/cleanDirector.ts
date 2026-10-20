import { decode } from 'html-entities'

// Tidies the free text a cinema has for the director(s): decodes HTML
// entities, collapses whitespace and drops a leading label ("Regie:") and
// trailing punctuation. Returns undefined when nothing is left.
export const cleanDirector = (director?: string | null) => {
  const cleaned = decode(director ?? '')
    .replace(/^\s*(regie|regisseur|director|directed by)\s*:?\s+/i, '')
    .replace(/\s+/g, ' ')
    .replace(/[\s,;|&]+$/, '')
    .trim()

  return cleaned || undefined
}

// Finds the director in a list of "Label: value" lines, e.g. the metadata
// lines of a film page: ['Regie: Annemarie Jacir', 'Jaar: 2025']
export const findDirectorInLines = (lines: string[] = []) =>
  cleanDirector(
    lines
      .map((line) =>
        line.match(/^\s*(?:regie|regisseur|director)\s*:\s*(.+)$/i),
      )
      .find(Boolean)?.[1],
  )
