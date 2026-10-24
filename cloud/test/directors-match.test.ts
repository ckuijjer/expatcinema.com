import { compareDirectors, parseDirectorNames } from '../metadata/directors'

describe('parseDirectorNames', () => {
  test.each([
    [['Yuval Abraham, Rachel Szor'], ['yuval abraham', 'rachel szor']],
    [
      ['Daisuke Nishio (1, 3, 4), Kazuhisa Takenouchi (2)'],
      ['daisuke nishio', 'kazuhisa takenouchi'],
    ],
    [
      ['Daisuke Nishio & Kazuhisa Takenouchi '],
      ['daisuke nishio', 'kazuhisa takenouchi'],
    ],
    [
      ['Volodymyr Pashchuck en Khrystyna Lutsyk'],
      ['volodymyr pashchuck', 'khrystyna lutsyk'],
    ],
    [['Jūzō Itami', 'Jūzō Itami'], ['juzo itami']],
    [[''], []],
    [undefined, []],
  ])('%p', (directors, names) => {
    expect(parseDirectorNames(directors)).toEqual(names)
  })
})

describe('compareDirectors', () => {
  test.each([
    [['Lukas Dhont'], ['Lukas Dhont'], 'agree'],
    [['Andrej Zvjagintsev'], ['Andrey Zvyagintsev'], 'agree'],
    [['Jūzō Itami'], ['Juzo Itami'], 'agree'],
    [['Yuval Abraham, Rachel Szor'], ['Basel Adra', 'Rachel Szor'], 'agree'],
    [['D. Villeneuve'], ['Denis Villeneuve'], 'agree'],
    [['Yusuke Iwasaki'], ['Iwasaki Yusuke'], 'agree'],
    [["Ueda Shin'ichirô"], ['Shinichiro Ueda'], 'agree'],
    [['Patrick Tam'], ['Patrick Tam Kar-Ming'], 'agree'],
    [['Stefan Djordjevic'], ['Stefan Đorđević'], 'agree'],
    [['Kasper Kalle'], ["Kasper 'Kalle' Skovsbøl"], 'agree'],
    [['Xu Jingwei'], ['Zao Xu'], 'disagree'],
    [
      ['Drie vrienden denken dat hun nachten nooit zullen eindigen op straat'],
      ['Michiel van Erp'],
      'unknown',
    ],
    [['Orson Welles'], ['Wim Wenders'], 'disagree'],
    [['Michael Mann'], ['Michael Haneke'], 'disagree'],
    [['Lukas Dhont'], [], 'unknown'],
    [[], ['Lukas Dhont'], 'unknown'],
    [undefined, undefined, 'unknown'],
  ])('%p vs %p is %s', (cinema, tmdb, expected) => {
    expect(compareDirectors(cinema, tmdb)).toBe(expected)
  })
})
