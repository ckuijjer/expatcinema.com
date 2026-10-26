import { parseTitle as desien } from '../scrapers/desien'
import { parseTitle as filmhuisdenhaag } from '../scrapers/filmhuisdenhaag'
import { parseTitle as forumgroningen } from '../scrapers/forumgroningen'
import { parseTitle as hartlooper } from '../scrapers/hartlooper'
import { parseTitle as kinorotterdam } from '../scrapers/kinorotterdam'
import { parseTitle as lumiere } from '../scrapers/lumiere'
import {
  extractAll,
  extractAgeRatingNote,
  extractAnniversaryNote,
} from '../scrapers/utils/extractNotes'

describe('extractAnniversaryNote', () => {
  test.each([
    'Shall We Dance? (30th Anniversary)',
    'Shall We Dance? - 30th Anniversary',
    'Shall We Dance? – 30th anniversary',
    'Shall We Dance? 30th anniversary',
  ])('takes the anniversary from %s', (title) => {
    expect(extractAnniversaryNote(title)).toEqual({
      title: 'Shall We Dance?',
      notes: ['30th Anniversary'],
    })
  })

  test('leaves a title without one as it is', () => {
    expect(extractAnniversaryNote('The 5th Element')).toEqual({
      title: 'The 5th Element',
    })
  })
})

describe('extractAgeRatingNote', () => {
  test.each([
    ['Schmutz Cinema (18+)', 'Schmutz Cinema', '18+'],
    ['Schmutz Cinema (16 +)', 'Schmutz Cinema', '16+'],
    ['Schmutz Cinema ( 18+ )', 'Schmutz Cinema', '18+'],
  ])('takes the age rating from %s', (raw, title, note) => {
    expect(extractAgeRatingNote(raw)).toEqual({ title, notes: [note] })
  })

  test.each([
    'Cure',
    'Schmutz Cinema (2026)',
    'Schmutz Cinema 18+',
    '18+ (Schmutz)',
    'Goodbye Sisters (+ supporting film: Like Friend)',
  ])('leaves %s as it is', (title) => {
    expect(extractAgeRatingNote(title)).toEqual({ title })
  })
})

describe('hartlooper', () => {
  test('has the age rating as a note, and not in the title', () => {
    expect(hartlooper('Schmutz Cinema (18+)')).toEqual({
      title: 'Schmutz Cinema',
      notes: ['18+'],
    })
  })

  test('leaves a title without notes with none', () => {
    expect(hartlooper('Molly Vs the Machines')).toEqual({
      title: 'Molly Vs the Machines',
    })
  })
})

describe('extractAll', () => {
  test('runs the extractors in order and collects the notes', () => {
    expect(
      extractAll(
        'A (x) (y)',
        (title) => ({ title: title.replace(' (y)', ''), notes: ['y'] }),
        (title) => ({ title: title.replace(' (x)', ''), notes: ['x'] }),
      ),
    ).toEqual({ title: 'A', notes: ['y', 'x'] })
  })

  test('has no notes when there are none', () => {
    expect(extractAll('A', (title) => ({ title }))).toEqual({ title: 'A' })
  })
})

describe('a 30th anniversary is a note', () => {
  const expected = {
    title: 'Shall We Dance?',
    notes: ['30th Anniversary'],
  }

  test.each([
    ['De Sien', desien, 'Shall We Dance? (30th Anniversary)'],
    ['Lumière', lumiere, 'Shall We Dance? (30th Anniversary)'],
    ['Forum Groningen', forumgroningen, 'Shall We Dance? - 30th Anniversary'],
    ['Kino', kinorotterdam, 'Shall We Dance? 30th anniversary'],
  ])('%s', (_, parseTitle, title) => {
    expect(parseTitle(title)).toEqual(expected)
  })

  test('Filmhuis Den Haag', () => {
    expect(
      filmhuisdenhaag('Shall We Dance? (30th Anniversary)', new Set()),
    ).toEqual(expected)
  })
})

describe('De Sien', () => {
  test('keeps the film title of a series prefix, and has no notes', () => {
    expect(desien('UQCF | Rebel Dykes')).toEqual({ title: 'Rebel Dykes' })
  })
})

describe('Lumière', () => {
  test('keeps both a supporting film and an anniversary', () => {
    expect(
      lumiere('Goodbye Sisters (+ supporting film: Like Friend, Like Deer)'),
    ).toEqual({
      title: 'Goodbye Sisters',
      notes: ['supporting film: Like Friend, Like Deer'],
    })
  })
})

describe('Forum Groningen', () => {
  test('takes the cut between brackets as a note', () => {
    expect(
      forumgroningen("The Fight [The William Greaves Director's Cut]"),
    ).toEqual({
      title: 'The Fight',
      notes: ["The William Greaves Director's Cut"],
    })
  })

  test('leaves a normal title as it is', () => {
    expect(forumgroningen('Cure')).toEqual({ title: 'Cure' })
  })
})

describe('Kino', () => {
  test.each([
    ['Amélie (2001) –', { title: 'Amélie' }],
    [
      'Amélie (2001) – 25th anniversary',
      { title: 'Amélie', notes: ['25th Anniversary'] },
    ],
    ['Perfect Days (2023)', { title: 'Perfect Days' }],
    ['Kinoxeur: Cure', { title: 'Cure' }],
    ['Dune – Part 1 & 2', { title: 'Dune', notes: ['Part 1 & 2'] }],
    [
      'Lawrence of Arabia – A 70mm Presentation',
      { title: 'Lawrence of Arabia', notes: ['A 70mm Presentation'] },
    ],
  ])('splits %s', (title, expected) => {
    expect(kinorotterdam(title)).toEqual(expected)
  })
})
