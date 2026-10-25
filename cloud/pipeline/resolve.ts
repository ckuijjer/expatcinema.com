import { buildMovies, makeSlugsUnique } from '../metadata/buildMovies'
import type { MetadataLookups } from '../metadata/resolveMetadata'
import {
  getSharedLabelKey,
  getSharedLabelSplits,
  isIgnoredLabel,
  isNoteLabel,
  splitOffLabel,
  type SharedLabel,
} from '../metadata/sharedLabels'
import { compactTitle, getMetadataLookupKey } from '../metadata/titleResolver'
import type { Metadata } from '../metadata/types'
import { makeScreeningsUniqueAndSorted } from '../scrapers/utils/makeScreeningsUniqueAndSorted'
import { logger } from '../powertools'
import { Screening } from '../types'

// What the public screenings.json has: the movie a screening was matched to,
// and not the director, which is only used for the matching
export type ResolvedScreening = Omit<Screening, 'director'> & {
  movieId?: string
}

const sameTitle = (left?: string, right?: string) =>
  left !== undefined &&
  right !== undefined &&
  left.trim().toLowerCase() === right.trim().toLowerCase()

// The festival or series, and the notes, in the labels that were taken from a
// title: a label before or after it is an event, one between parentheses a
// note, and a label that says something about the screening ("Q&A", "4K")
// a note wherever it stands
const eventAndNotes = (labels: SharedLabel[]) => {
  const named = labels.filter(({ label }) => !isIgnoredLabel(label))
  // what is said about the screening is a note, wherever it stands
  const events = named.filter(
    ({ kind, label }) => kind !== 'parenthesis' && !isNoteLabel(label),
  )
  const [event, ...others] = [
    ...events.filter(({ kind }) => kind === 'prefix'),
    ...events.filter(({ kind }) => kind === 'suffix'),
  ]
  const notes = [
    ...others,
    ...named.filter((label) => !events.includes(label)),
  ].map(({ label }) => label)

  return { event: event?.label, notes }
}

// Phase: resolve. Joins the screenings with what they were matched to, and
// builds what is published from the lookups: the screenings with their movieId,
// the movies, the record of every lookup, and the lists to review.
export const resolveScreenings = (
  screenings: Screening[],
  {
    metadata,
    metadataLookups,
  }: { metadata: Metadata[]; metadataLookups: MetadataLookups },
) => {
  const metadataByLookupKey = new Map(
    metadata.map((entry) => [
      getMetadataLookupKey(entry.query, entry.year),
      entry,
    ]),
  )

  // A title that only matched without a label that several titles at its
  // cinema share ("Docs: Naza"), has that label as its event: it is confirmed
  // by the film it matched. An event a scraper set itself is kept.
  const sharedLabelSplits = getSharedLabelSplits(screenings)
  const detectedEvents = new Map<
    string,
    {
      cinema: string
      event: string
      status: 'applied' | 'candidate'
      titles: Set<string>
      screenings: number
    }
  >()

  // A title that matched through one part of it ("Cinema Aperitivo: Cold War"
  // through "Cold War"), has the other part as its event when the film is also
  // shown under just that part's name: then the rest is something the cinema
  // adds, not a subtitle. Without such a plain screening it is a candidate to
  // review.
  const plainMovieIds = new Set<string>()
  for (const { title, year } of screenings) {
    const entry = metadataByLookupKey.get(getMetadataLookupKey(title, year))

    if (
      entry?.movieId &&
      entry.match.method !== 'title-part' &&
      entry.match.method !== 'shared-label'
    ) {
      plainMovieIds.add(entry.movieId)
    }
  }

  const detectFromTitlePart = (
    screening: Screening,
    matched: Metadata | undefined,
  ) => {
    const stripped = matched?.match.strippedTitle
    if (matched?.match.method !== 'title-part' || !stripped) return undefined

    const split = splitOffLabel(screening.title, stripped)
    if (!split || isIgnoredLabel(split.label)) return undefined

    // "Cold War (Zimna wojna)": the film's own name in another language
    const isNameOfFilm = [
      matched.title,
      matched.originalTitle,
      ...(matched.tmdb?.alternativeTitles ?? []),
    ].some((name) => name && compactTitle(name) === compactTitle(split.label))
    if (isNameOfFilm) return undefined

    return {
      title: stripped,
      ...eventAndNotes([split]),
      corroborated: Boolean(
        matched.movieId && plainMovieIds.has(matched.movieId),
      ),
    }
  }

  const resolvedScreenings: ResolvedScreening[] = makeScreeningsUniqueAndSorted(
    screenings.map((screening) => {
      const matched = metadataByLookupKey.get(
        getMetadataLookupKey(screening.title, screening.year),
      )

      // The director is only used while scraping, it isn't needed in the
      // public screenings.json
      const { director, ...withoutDirector } = screening

      const split =
        matched?.match.method === 'shared-label'
          ? sharedLabelSplits.get(getSharedLabelKey(screening))
          : undefined
      const fromSharedLabel =
        split && sameTitle(split.title, matched?.match.strippedTitle)
          ? { title: split.title, ...eventAndNotes(split.labels) }
          : undefined
      const fromTitlePart = fromSharedLabel
        ? undefined
        : detectFromTitlePart(screening, matched)

      // an uncorroborated title part only goes to the review list
      const candidate = fromTitlePart && !fromTitlePart.corroborated
      const detected = candidate
        ? undefined
        : (fromSharedLabel ?? fromTitlePart)
      const reported = fromSharedLabel ?? fromTitlePart

      if (reported?.event && !screening.event) {
        const key = `${screening.cinema}\u0000${reported.event}`
        const status = candidate ? 'candidate' : 'applied'
        const record = detectedEvents.get(key) ?? {
          cinema: screening.cinema,
          event: reported.event,
          status,
          titles: new Set<string>(),
          screenings: 0,
        }

        if (status === 'applied') record.status = 'applied'
        record.titles.add(reported.title)
        record.screenings++
        detectedEvents.set(key, record)
      }

      const notes = [
        ...new Set([...(screening.notes ?? []), ...(detected?.notes ?? [])]),
      ]

      return {
        ...withoutDirector,
        ...(detected && { title: detected.title }),
        ...(!screening.event && detected?.event && { event: detected.event }),
        ...(notes.length > 0 && { notes }),
        movieId: matched?.movieId,
      }
    }),
  )

  const { movies, clashes } = makeSlugsUnique(buildMovies(metadata))

  clashes.forEach(({ slug, movies }) => {
    // usually a cinema with a wrong year, that got a screening matched to
    // another movie than the other cinemas
    logger.warn('movies share a slug', { slug, movies })
  })

  const toTitleMatchRecord = (entry: Metadata) => {
    const rawTitles = Array.from(
      metadataLookups.get(getMetadataLookupKey(entry.query, entry.year))
        ?.rawTitles ?? [],
    )

    return {
      query: entry.query,
      year: entry.year,
      titleRaw: rawTitles[0],
      titleRawVariants: rawTitles,
      movieId: entry.movieId,
      title: entry.title,
      originalTitle: entry.originalTitle,
      imdbId: entry.imdbId,
      tmdbId: entry.tmdb?.id,
      match: entry.match,
    }
  }

  return {
    screenings: resolvedScreenings,
    movies,
    titleMatches: metadata.map(toTitleMatchRecord),
    review: {
      ambiguous: metadata
        .filter((entry) => entry.match.status === 'ambiguous')
        .map(toTitleMatchRecord),
      unmatched: metadata
        .filter((entry) => entry.match.status === 'unmatched')
        .map(toTitleMatchRecord),
      // the events that were found in the title, to check, and to put in the
      // list of known events when the name should be a fixed one
      detectedEvents: [...detectedEvents.values()]
        .map(({ titles, ...event }) => ({
          ...event,
          titles: [...titles].sort(),
        }))
        .sort(
          (a, b) =>
            a.cinema.localeCompare(b.cinema) || a.event.localeCompare(b.event),
        ),
      // matched, but the director of the screenings isn't one of the film's
      directorDisagreements: metadata
        .filter(
          (entry) =>
            entry.match.status === 'matched' &&
            entry.match.directorMatch === 'disagree',
        )
        .map(toTitleMatchRecord),
    },
  }
}
