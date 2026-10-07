import {
  extractScreeningsFromMovieSource,
  parseYear,
} from '../scrapers/lantarenvenster'

// The film page of Lantarenvenster, reduced to what the scraper reads
const page = ({ title, details }: { title: string; details: string }) => `
<div class="page-content-aside"><div class="page-content">
  <div class="wp_theatre_prod all filmspecial">
    <h1 class="wp_theatre_prod_title">${title}</h1>
    <div class="wp_theatre_prod_director">Lukas Dhont</div>
  </div></div>
  <div class="page-aside">
    <div class="wpt_production_login_form" id="login_form"><table><tr>
      <th>zo 25 okt</th><td class="time"><label><input type="radio" name="event_id" value="180799" required />19:00</label></td></tr></table></div>
    <div class="cine-details">${details}</div>
    <div class="wp_theatre_prod_languages_spoken">Frans gesproken</div>
    <div class="wp_theatre_prod_languages_subtitles">
      Engels ondertiteld
    </div>
  </div>
</div>`

// https://www.lantarenvenster.nl/programma/coward-expat-cinema-roterdam/
const coward = page({
  title: 'Coward - Expat Cinema Roterdam',
  details:
    '<div class="wp_theatre_prod_country">België, Frankrijk, Nederland</div><div class="wp_theatre_prod_year">2026</div><div class="wp_theatre_prod_duration">127’</div>',
})

// https://www.lantarenvenster.nl/programma/archined-classic-hiroshima-mon-amour/
const hiroshima = page({
  title: 'Archined Classic: Hiroshima Mon Amour',
  details:
    '<div class="wp_theatre_prod_country">Frankrijk</div><div class="wp_theatre_prod_year">1959</div><div class="wp_theatre_prod_duration">100’</div>',
})

// https://www.lantarenvenster.nl/programma/surprise-film-king-kong-award/
const surprise = page({
  title: 'Surprise Film: King Kong Award',
  details:
    '<div class="wp_theatre_prod_country">Surprise</div><div class="wp_theatre_prod_duration">110’</div>',
})

// A page without a year in the details, but with one in the title
const withYearInTitle = page({
  title: 'Filmcollege: Iñárritu + Amores Perros (2000)',
  details: '<div class="wp_theatre_prod_duration">154’</div>',
})

describe('extractScreeningsFromMovieSource', () => {
  const years = async (html: string) =>
    (
      await extractScreeningsFromMovieSource(html, 'https://example.com/x/')
    ).map(({ year }) => year)

  test('takes the year of the film from the details', async () => {
    expect(await years(coward)).toEqual([2026])
    expect(await years(hiroshima)).toEqual([1959])
  })

  test('has no year for a film without one', async () => {
    const [screening] = await extractScreeningsFromMovieSource(
      surprise,
      'https://www.lantarenvenster.nl/programma/surprise-film-king-kong-award/',
    )

    expect(screening).toMatchObject({
      title: 'Surprise Film: King Kong Award',
      year: undefined,
      cinema: 'Lantarenvenster',
    })
  })

  test('falls back to the year in the title', async () => {
    expect(await years(withYearInTitle)).toEqual([2000])
  })

  test('keeps the title, url and cinema', async () => {
    expect(
      await extractScreeningsFromMovieSource(
        coward,
        'https://example.com/coward/',
      ),
    ).toMatchObject([
      {
        title: 'Coward - Expat Cinema Roterdam',
        url: 'https://example.com/coward/',
        cinema: 'Lantarenvenster',
      },
    ])
  })
})

describe('parseYear', () => {
  test.each([
    ['2026', 2026],
    [' 1959 ', 1959],
  ])('%p is the year %p', (value, expected) => {
    expect(parseYear(value)).toBe(expected)
  })

  test.each([
    [undefined],
    [''],
    ['Surprise'],
    ['1983-2026'],
    ['2026 / 2027'],
    ['127’'],
    ['1066'],
    ['2999'],
  ])('%p is no year', (value) => {
    expect(parseYear(value)).toBeUndefined()
  })
})
