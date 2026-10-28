import {
  ENGLISH_SUBTITLES_OVERRIDES,
  extractPageText,
  hasEnglishSubtitles,
  parseDirector,
  parseTitle,
  parseYear,
} from '../scrapers/ventilator'

// the article of https://amsterdamalternative.nl/agenda/23251
const mumbi = extractPageText(`<article class="body agenda">
<h1 class="event-title">Africadelic: Memory of Princess Mumbi (Special Screening)<br></h1>
<p>Time: 19.00 hrs (doors open: 18.45 hrs)<br />
Title:&nbsp; Memory of Princess Mumbi<br />
Director: Damien Hauser<br />
Country: Kenya and Switzerland<br />
Year: 2025<br />
Length: 80&#39;<br />
Language: English with English subtitles<br />
Extra: The short film Godpower (2026, 16&rsquo;, dir. Geoff Browne)</p>
</article>`)

// https://amsterdamalternative.nl/agenda/23013
const fangs = extractPageText(`<article class="body agenda">
<p>Fangs (Anyab) (1981, 1h 40m,<br />
Arabic, w/ English Subtitles)<br />
dir Mohammed Shebl)&nbsp;</p>
</article>`)

// https://amsterdamalternative.nl/agenda/22970
const zafzifa = extractPageText(`<article class="body agenda">
<p>A film by Peter Sant<br />
Duration: 99mins&nbsp;<br />
Country: Malta&nbsp;<br />
Language: Maltese with English subtitles</p>
</article>`)

// https://amsterdamalternative.nl/agenda/23253, which doesn't say anything about subtitles
const inn = extractPageText(`<article class="body agenda">
<p><strong>Doors open:&nbsp;</strong>19:00<br />
<strong>Film start:</strong> 19:15<br />
<strong>Title: </strong>Inn a State of Siege<br />
<strong>Director: </strong>Qali Nur<br />
<strong>Producer: </strong>Dženita Čamo</p>
</article>`)

describe('ventilator', () => {
  test('finds English subtitles in the different ways the pages say it', () => {
    expect(hasEnglishSubtitles(mumbi)).toBe(true)
    expect(hasEnglishSubtitles(fangs)).toBe(true)
    expect(hasEnglishSubtitles(zafzifa)).toBe(true)
  })

  test('has no English subtitles when the page does not say so', () => {
    expect(hasEnglishSubtitles(inn)).toBe(false)
    expect(hasEnglishSubtitles('')).toBe(false)
  })

  test('takes the title from the Title line, else from the event title', () => {
    expect(
      parseTitle(
        'Africadelic: Memory of Princess Mumbi (Special Screening)',
        mumbi,
      ),
    ).toBe('Memory of Princess Mumbi')
    expect(parseTitle('Fangs (Anyab) halloween screening', fangs)).toBe(
      'Fangs (Anyab)',
    )
    expect(parseTitle('Zafzifa', zafzifa)).toBe('Zafzifa')
    expect(
      parseTitle(
        'Ventilator Cinema presents: Inn a State of Siege (Special Screening)',
        '',
      ),
    ).toBe('Inn a State of Siege')
  })

  test('takes the year from the Year line or the parentheses after the title', () => {
    expect(parseYear(mumbi)).toBe(2025)
    expect(parseYear(fangs)).toBe(1981)
    expect(parseYear(zafzifa)).toBeUndefined()
  })

  test('takes the director from the Director line or after "dir"', () => {
    expect(parseDirector(mumbi)).toBe('Damien Hauser')
    expect(parseDirector(fangs)).toBe('Mohammed Shebl')
    expect(parseDirector(zafzifa)).toBeUndefined()
  })
})

describe('ENGLISH_SUBTITLES_OVERRIDES', () => {
  test("has Inn a State of Siege, whose page doesn't say it has English subtitles", () => {
    expect(ENGLISH_SUBTITLES_OVERRIDES.has(23253)).toBe(true)
  })
})
