import { parseDirector as parseForumDirector } from '../scrapers/forumgroningen'
import { parseDirector as parseHeerenstraatDirector } from '../scrapers/heerenstraattheater'
import { parseDirector as parseIdfaDirector } from '../scrapers/hetdocumentairepaviljoen'
import { parseDirector as parseLab111Director } from '../scrapers/lab111'
import { extractDirector as extractBredaDirector } from '../scrapers/filmhuisbreda'
import { extractDirector as extractDeWittDirector } from '../scrapers/dewittdordrecht'
import { extractDirector as extractRialtoVuDirector } from '../scrapers/rialtovu'
import { extractDirector as extractSchuurDirector } from '../scrapers/schuur'
import { extractDirector as extractStudioKDirector } from '../scrapers/studiok'
import { parseFkFeedDirector } from '../scrapers/utils/parseFkFeedDirector'

describe('extracting the director', () => {
  test('fk-feed', () => {
    expect(
      parseFkFeedDirector({ value: 'Daisuke Nishio & Kazuhisa Takenouchi ' }),
    ).toBe('Daisuke Nishio & Kazuhisa Takenouchi')
    expect(parseFkFeedDirector('')).toBeUndefined()
    expect(parseFkFeedDirector(undefined)).toBeUndefined()
    expect(parseFkFeedDirector({ value: ' ' })).toBeUndefined()
  })

  test('Filmtheater De Witt', () => {
    expect(
      extractDeWittDirector(
        'Regie: Lukas Dhont (o.a. Girl, Close) - Acteurs: o.a. Emmanuel Macchia Lengte: 127 minuten',
      ),
    ).toBe('Lukas Dhont')
    expect(extractDeWittDirector('Lengte: 127 minuten')).toBeUndefined()
  })

  test('Filmhuis Breda', () => {
    expect(
      extractBredaDirector(
        'Lichaam & Geest MvdG Regie Sandra Radecka, Machiel Spruijt Gesproken taal Mongools Ondertitelde taal nederlands',
      ),
    ).toBe('Sandra Radecka, Machiel Spruijt')
    expect(extractBredaDirector('Gesproken taal Mongools')).toBeUndefined()
  })

  test('Forum Groningen', () => {
    expect(
      parseForumDirector([
        { label: 'Country', value: 'United Kingdom' },
        { label: 'Director', value: 'Orlando von Einsiedel' },
      ]),
    ).toBe('Orlando von Einsiedel')
    expect(parseForumDirector([])).toBeUndefined()
  })

  test('Heerenstraat Theater', () => {
    expect(
      parseHeerenstraatDirector([
        'Cast & Crew',
        'Robert ten Brink',
        'Regie',
        'Lucio Messercola',
        'Taal',
        'Nederlands / Dutch',
      ]),
    ).toBe('Lucio Messercola')
    expect(parseHeerenstraatDirector(['Taal', 'Nederlands'])).toBeUndefined()
    expect(parseHeerenstraatDirector(undefined)).toBeUndefined()
  })

  test('Het Documentaire Paviljoen', () => {
    expect(
      parseIdfaDirector([
        { fullName: 'Argos Films', role: { key: 'production' } },
        { fullName: 'Chris Marker', role: { key: 'director' } },
        { fullName: 'Second Director', role: { key: 'director' } },
      ]),
    ).toBe('Chris Marker, Second Director')
    expect(parseIdfaDirector(null)).toBeUndefined()
  })

  test('Lab111', () => {
    expect(
      parseLab111Director([
        { label: 'Jaar', value: '1964' },
        { label: 'Regisseur', value: 'Wim Wenders' },
      ]),
    ).toBe('Wim Wenders')
  })

  test('Rialto VU', () => {
    expect(
      extractRialtoVuDirector(
        '<p><strong>Regisseur:</strong> Katsuhiro Otomo</p>',
      ),
    ).toBe('Katsuhiro Otomo')
    expect(
      extractRialtoVuDirector('<p><strong>Regisseur</strong>: Lukas Dhont</p>'),
    ).toBe('Lukas Dhont')
    expect(
      extractRialtoVuDirector(
        '<strong>Regisseurs </strong>Yuval Abraham, Rachel Szor </p>',
      ),
    ).toBe('Yuval Abraham, Rachel Szor')
    expect(extractRialtoVuDirector('<p>No director</p>')).toBeUndefined()
  })

  test('Schuur', () => {
    expect(
      extractSchuurDirector(
        '<li><strong>Regie</strong> <span>Lukas Dhont</span></li>',
      ),
    ).toBe('Lukas Dhont')
    expect(extractSchuurDirector('<li>Nothing</li>')).toBeUndefined()
  })

  test('Studio/K', () => {
    expect(
      extractStudioKDirector(
        'Regie: Jan SvankmajerSpeelduur: 107 minJaar: 1994',
      ),
    ).toBe('Jan Svankmajer')
    expect(
      extractStudioKDirector('Regie: Jan SvankmajerCast: Petr Čepek'),
    ).toBe('Jan Svankmajer')
    expect(extractStudioKDirector('Speelduur: 107 min')).toBeUndefined()
  })
})
