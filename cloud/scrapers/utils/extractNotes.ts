// A cinema adds things to the title of a film that are not part of the film's
// title, but are nice to know: "No Good Men + Q&A", "Goodbye Sisters (+ supporting
// film: Like Friend, Like Deer)". The title is what is looked up on TMDB, so these
// go from the title, and are kept as notes on the screening. What is a note
// differs per cinema, so a scraper chooses which of these it uses.

// without notes, `notes` is left out, so that a screening without any has none
export type TitleAndNotes = { title: string; notes?: string[] }

const tidyNote = (note: string) =>
  note
    .replace(/\bq\s*&\s*a\b/gi, 'Q&A')
    .replace(/\s+/g, ' ')
    .trim()

// What makes the text after a "+" an add-on, and not a second film
const NOTE =
  /q\s*&\s*a|lezing|lecture|talk|intro|inleiding|gesprek|discussion|supporting film|voorfilm|short\b/i

const withoutNote = (title: string): TitleAndNotes => ({ title })

// Everything after " + ", for a cinema that never shows a double feature as
// "A + B": "No Good Men + Q&A", "Azart – Come Make Art + Q&A"
export const extractPlusNote = (title: string): TitleAndNotes => {
  const match = title.match(/^(.+?)\s+\+\s+(.+)$/)

  return match
    ? { title: match[1].trim(), notes: [tidyNote(match[2])] }
    : withoutNote(title)
}

// A " + " or " (+ " that adds a Q&A, a talk, an introduction or a supporting
// film. Anything else after a "+" is left alone, as it can be a double feature:
// "Youri + Q&a Producer", "Love-22-Love + Lezing En Q&a", "Goodbye Sisters (+
// supporting film: Like Friend, Like Deer)"
export const extractAddOnNote = (title: string): TitleAndNotes => {
  const match =
    title.match(/^(.+?)\s*\(\+\s*(.+)\)$/) ?? title.match(/^(.+?)\s+\+\s+(.+)$/)

  return match && NOTE.test(match[2])
    ? { title: match[1].trim(), notes: [tidyNote(match[2])] }
    : withoutNote(title)
}

// "Shall We Dance? (30th Anniversary)", "Shall We Dance? - 30th Anniversary" or
// "Shall We Dance? 30th Anniversary", at the end of a title
const ANNIVERSARY =
  /(?:\s*\(|\s+[-–]\s+|\s+)(\d+(?:st|nd|rd|th) anniversary)\)?$/i

export const extractAnniversaryNote = (title: string): TitleAndNotes => {
  const match = title.match(ANNIVERSARY)

  return match
    ? {
        title: title.slice(0, match.index).trim(),
        notes: [match[1].replace(/anniversary/i, 'Anniversary')],
      }
    : withoutNote(title)
}

// Runs the extractors one after the other, each on the title the one before it
// left, and collects their notes
export const extractAll = (
  title: string,
  ...extractors: ((title: string) => TitleAndNotes)[]
): TitleAndNotes => {
  const notes: string[] = []
  const result = extractors.reduce((current, extract) => {
    const extracted = extract(current)
    notes.push(...(extracted.notes ?? []))
    return extracted.title
  }, title)

  return { title: result, ...(notes.length > 0 && { notes }) }
}
