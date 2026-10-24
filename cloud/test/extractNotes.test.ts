import {
  extractAddOnNote,
  extractPlusNote,
} from '../scrapers/utils/extractNotes'

describe('extractPlusNote', () => {
  test.each([
    ['No Good Men + Q&A', 'No Good Men', ['Q&A']],
    ['Azart – Come Make Art + Q&A', 'Azart – Come Make Art', ['Q&A']],
    ['Youri + Q&a Producer', 'Youri', ['Q&A Producer']],
    ['Psychosexual Drama + Possession', 'Psychosexual Drama', ['Possession']],
    ['The Cycle of Love', 'The Cycle of Love', []],
    ['Schmutz Cinema (18+)', 'Schmutz Cinema (18+)', []],
  ])('%p', (input, title, notes) => {
    expect(extractPlusNote(input)).toEqual(
      notes.length ? { title, notes } : { title },
    )
  })
})

describe('extractAddOnNote', () => {
  test.each([
    ['Youri + Q&a Producer', 'Youri', ['Q&A Producer']],
    ['Love-22-Love + Lezing En Q&a', 'Love-22-Love', ['Lezing En Q&A']],
    [
      'Goodbye Sisters (+ supporting film: Like Friend, Like Deer)',
      'Goodbye Sisters',
      ['supporting film: Like Friend, Like Deer'],
    ],
    ['Film + Introductie', 'Film', ['Introductie']],
  ])('takes %p', (input, title, notes) => {
    expect(extractAddOnNote(input)).toEqual({ title, notes })
  })

  test.each([
    'Man of Marble + Man of Iron',
    'Psychosexual Drama + Possession',
    'Schmutz Cinema (18+)',
    'Wind, Talk to Me',
    'Let’s Talk About Aldo',
    'The Cycle of Love',
  ])('leaves %p alone', (input) => {
    expect(extractAddOnNote(input)).toEqual({ title: input })
  })
})
