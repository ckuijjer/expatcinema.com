// Shared English-subtitle check for cinemas using the /fk-feed/agenda format
// (Kino, Hartlooper, Slachtstraat, Springhaver, De Filmhallen, The Movies,
// Bioscopen Leiden, Filmkoepel).
//
// A screening has English subtitles when either
// - its movie's subtitle label says English for this cinema, or
// - the screening itself is tagged as such. Each cinema spells the tag
//   differently: "EN SUBS", "EN Subs", "EN subs", "ENGLISH SUBS".
// A screening tagged as having no subtitles is excluded, even when the movie
// label says English.
//
// The subtitle label is free text. Most cinemas use a plain "Engels" or
// "English", but the Utrecht cinemas (Louis Hartlooper, Slachtstraat,
// Springhaver) share one database and qualify it per venue, e.g.
// "Nederlands (LHC), English (Springhaver)". Such a label only counts as
// English for the venues named with English, so a scraper passes the venue
// names it stands for in `venues`. Anything else ("English on the Czech
// parts") isn't treated as English; the screening then needs a tag.

type FkFeedMovie = {
  language?: { label?: string; value?: string } | ''
}

type FkFeedTime = {
  tags?: string[]
}

type Options = {
  // Venue names as they appear in qualified labels, e.g. ['Springhaver']
  venues?: string[]
  // Cinema-specific tags that also mean English subtitles
  extraTags?: string[]
}

const ENGLISH = /^(engels|english)$/i
const ENGLISH_SUBTITLES_TAG = /^(en|eng|english) subs$/i
const NO_SUBTITLES_TAG = /^(no subs|geen ondertiteling)$/i

// "Nederlands (LHC), English (Springhaver)" -> ['Springhaver']. Tolerates a
// missing closing parenthesis, as in "Nederlands (LHC, English (Springhaver)".
const englishVenues = (value: string) =>
  Array.from(
    value.matchAll(/\b(?:english|engels)\s*\(([^()]*)\)?/gi),
    ([, venues]) => venues.split(',').map((venue) => venue.trim()),
  ).flat()

const hasEnglishSubtitlesLabel = (movie: FkFeedMovie, venues: string[]) => {
  if (typeof movie.language !== 'object') return false
  if (movie.language?.label !== 'Ondertitels') return false

  const value = movie.language.value?.trim() ?? ''
  if (ENGLISH.test(value)) return true

  const labelVenues = englishVenues(value).map((venue) => venue.toLowerCase())
  return venues.some((venue) => labelVenues.includes(venue.toLowerCase()))
}

export const fkFeedHasEnglishSubtitles = (
  movie: FkFeedMovie,
  time: FkFeedTime,
  { venues = [], extraTags = [] }: Options = {},
) => {
  const tags = (time.tags ?? []).map((tag) => tag.trim())
  const extra = extraTags.map((tag) => tag.toLowerCase())

  if (tags.some((tag) => NO_SUBTITLES_TAG.test(tag))) return false

  return (
    hasEnglishSubtitlesLabel(movie, venues) ||
    tags.some(
      (tag) =>
        ENGLISH_SUBTITLES_TAG.test(tag) || extra.includes(tag.toLowerCase()),
    )
  )
}
