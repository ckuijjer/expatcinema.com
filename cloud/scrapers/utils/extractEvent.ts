import { Screening } from '../../types'

// A cinema shows some films as part of a festival or a series, and puts the
// name in the title: "Imagine Film Festival: Cure", "Construction Site | AFFR on
// Tour". Only known names are taken, because "Kusama: Infinity" and "Mishima:
// A Life in Four Chapters" have a colon too, and are just the films.
const EVENTS: { name: string; pattern: RegExp }[] = [
  { name: 'Imagine Film Festival', pattern: /^Imagine Film Festival:\s+/i },
  { name: 'Club Imagine', pattern: /^Club Imagine:\s+/i },
  {
    name: 'Amsterdam Polish Film Festival',
    pattern: /^Amsterdam Polish Film Festival:\s+/i,
  },
  { name: 'CinéDialoog', pattern: /^CinéDialoog:\s+/i },
  { name: 'Cinekid', pattern: /^Cinekid:\s+/i },
  { name: 'Coming Out Day', pattern: /^Coming Out Day:\s+/i },
  { name: 'Cinema Aperitivo', pattern: /^Cinema Aperitivo:\s+/i },
  { name: 'Cinema Mythologica', pattern: /^Cinema Mythologica:\s+/i },
  { name: 'Film & Food', pattern: /^Film & Food:\s+/i },
  { name: 'Filmcollege', pattern: /^Filmcollege:\s+/i },
  { name: 'Framed X Kaboom Anime', pattern: /^Framed X Kaboom Anime:\s+/i },
  { name: 'Docs', pattern: /^Docs:\s+/i },
  { name: 'Kitkatclub', pattern: /^Kitkatclub:\s+/i },
  {
    name: 'Palestine Cinema Days',
    pattern: /^Palestine Cinema Days(?: Around the World)?:\s+/i,
  },
  { name: 'AFFR on Tour', pattern: /\s+\|\s+AFFR on Tour$/i },
  { name: 'Cinemasia', pattern: /\s*\|\s*cinemasia\d*$/i },
]

// The title without the name of the event, and the event
export const extractEvent = (title: string) => {
  for (const { name, pattern } of EVENTS) {
    const stripped = title.replace(pattern, '').trim()

    if (stripped !== title.trim() && stripped !== '') {
      return { title: stripped, event: name }
    }
  }

  return { title, event: undefined }
}

// A screening that has an event of its own (a scraper that knows it better)
// keeps it
export const withEvent = (screening: Screening): Screening => {
  const { title, event } = extractEvent(screening.title)

  return event
    ? { ...screening, title, event: screening.event ?? event }
    : screening
}
