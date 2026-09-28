// Shared English-subtitle check for cinemas using the /fk-feed/agenda format
// (Kino, Hartlooper, Slachtstraat, Springhaver, De Filmhallen, The Movies,
// Bioscopen Leiden).
//
// A screening has English subtitles when either
// - its movie is labelled `{ label: 'Ondertitels', value: 'Engels' }`, or
// - the screening itself is tagged as such. Each cinema spells the tag
//   differently: "EN SUBS", "EN Subs", "EN subs", "ENGLISH SUBS".
// A screening tagged as having no subtitles is excluded, even when the movie
// label says English.

type FkFeedMovie = {
  language?: { label?: string; value?: string } | ''
}

type FkFeedTime = {
  tags?: string[]
}

const ENGLISH_SUBTITLES_TAG = /^(en|eng|english) subs$/i
const NO_SUBTITLES_TAG = /^(no subs|geen ondertiteling)$/i

const hasEnglishSubtitlesLabel = (movie: FkFeedMovie) =>
  typeof movie.language === 'object' &&
  movie.language?.label === 'Ondertitels' &&
  /^(engels|english)$/i.test(movie.language.value ?? '')

export const fkFeedHasEnglishSubtitles = (
  movie: FkFeedMovie,
  time: FkFeedTime,
) => {
  const tags = (time.tags ?? []).map((tag) => tag.trim())

  if (tags.some((tag) => NO_SUBTITLES_TAG.test(tag))) return false

  return (
    hasEnglishSubtitlesLabel(movie) ||
    tags.some((tag) => ENGLISH_SUBTITLES_TAG.test(tag))
  )
}
