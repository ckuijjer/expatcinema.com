import { getScraperName } from './scraperNames'

// The keys of the analytics points on 2026-10-12
const keys = `all allWithMovieId amstelveen bioscopenleiden castellum chasse
  cinecenter cinecitta cinemadevlugt cinemathepulse cinerama concordia debalie
  defilmhallen desien deuitkijk dewittdordrecht dokhuis eyefilm fchyena
  filmhuisbreda filmhuisbussum filmhuiscavia filmhuisdenhaag filmhuisdespiegel
  filmhuislumen filmkoepel filmtheaterhilversum florafilmtheater focusarnhem
  forumgroningen hartlooper heerenstraattheater hetdocumentairepaviljoen
  ketelhuis kinorotterdam kriterion lab1 lab111 lantarenvenster lumiere lux
  melkweg natlab rialto rialtovu schuur slachtstraat sliekerfilm springhaver
  studiok themovies worm`.split(/\s+/)

describe('getScraperName', () => {
  test.each(keys)('knows %s', (key) => {
    expect(getScraperName(key)).not.toBe(key)
  })

  test.each([
    ['lab1', 'Lab-1'],
    ['eyefilm', 'Eye'],
    ['kinorotterdam', 'Kino'],
    ['hartlooper', 'Louis Hartlooper Complex'],
    ['allWithMovieId', 'Matched with TMDB'],
  ])('shows %s as %s', (key, name) => {
    expect(getScraperName(key)).toBe(name)
  })

  test('shows the key of an unknown scraper', () => {
    expect(getScraperName('newcinema')).toBe('newcinema')
  })
})
