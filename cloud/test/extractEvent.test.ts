import { extractEvent, withEvent } from '../scrapers/utils/extractEvent'

describe('extractEvent', () => {
  test.each([
    ['Imagine Film Festival: Cure', 'Cure', 'Imagine Film Festival'],
    [
      'Imagine Film Festival: the Wig (+ the Flesh Dress Short)',
      'the Wig (+ the Flesh Dress Short)',
      'Imagine Film Festival',
    ],
    ['Docs: Image', 'Image', 'Docs'],
    [
      'Cinema Aperitivo: Cold War (Incl. Drink and Antipasti Platter)',
      'Cold War (Incl. Drink and Antipasti Platter)',
      'Cinema Aperitivo',
    ],
    [
      'Palestine Cinema Days Around the World: Foo',
      'Foo',
      'Palestine Cinema Days',
    ],
    ['Construction Site | AFFR on Tour', 'Construction Site', 'AFFR on Tour'],
    ['Foo | Cinemasia26', 'Foo', 'Cinemasia'],
    [
      'One Cut of the Dead - NextGen Cinema',
      'One Cut of the Dead',
      'NextGen Cinema',
    ],
    // after the title case of the Lantarenvenster scraper
    [
      'One Cut of the Dead - Nextgen Cinema',
      'One Cut of the Dead',
      'NextGen Cinema',
    ],
    ['Red Rooms (2023) - Nextgen Cinema', 'Red Rooms (2023)', 'NextGen Cinema'],
    ['imagine film festival: Cure', 'Cure', 'Imagine Film Festival'],
  ])('%p', (title, expectedTitle, event) => {
    expect(extractEvent(title)).toEqual({ title: expectedTitle, event })
  })

  test.each([
    'Kusama: Infinity',
    'Mishima: A Life in Four Chapters',
    'National Theatre Live: Fleabag',
    'Docs:',
    'Cure',
    // a film of the same name, or a subtitle with a dash
    'NextGen Cinema',
    'Mission: Impossible - Fallout',
    'Cinema - Nextgen Cinema Club',
  ])('leaves %p alone', (title) => {
    expect(extractEvent(title)).toEqual({ title, event: undefined })
  })

  test('withEvent moves the event out of the title, and keeps a given one', () => {
    const base = { url: 'u', cinema: 'c', date: new Date(0) }

    expect(withEvent({ ...base, title: 'Docs: Image' })).toEqual({
      ...base,
      title: 'Image',
      event: 'Docs',
    })
    expect(
      withEvent({ ...base, title: 'Docs: Image', event: 'Mine' }).event,
    ).toBe('Mine')
    expect(withEvent({ ...base, title: 'Cure' })).toEqual({
      ...base,
      title: 'Cure',
    })
  })
})
