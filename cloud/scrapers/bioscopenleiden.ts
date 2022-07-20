import { DateTime } from 'luxon'
import debugFn from 'debug'
import got from 'got'

import { Screening } from '../types'
import splitTime from './splitTime'
import { times } from 'lodash'

const debug = debugFn('bioscopenleiden')

const example = {
  'after-ever-happy': {
    post_id: 17501,
    title: 'After Ever Happy',
    starring_short:
      'Josephine Langford, Hero Fiennes Tiffin, Chance Perdomo, Louise Lombard, Rob Estes, Arielle Kebbel, Carter Jenkins',
    synopsis:
      '<div class="row">\n<div class="text">In het vierde en laatste deel van de After-serie worden Tessa en Hardin gedwongen om volwassen te worden. Ze zijn tegen alle verwachtingen in nog bij elkaar, maar het spant er nu om of hun liefdesverhaal zal eindigen als een sprookje, of dat hun gepassioneerde maar giftige relatie definitief tot een einde komt.</div>\n<div></div>\n<div class="text">Een onthulling uit het verleden brengt de onvoorspelbare Hardin van slag en ook Tessa krijgt flink wat te verwerken. Ze is niet langer het lieve, eenvoudige meisje dat ze was toen ze Hardin leerde kennen. Hoe meer er naar boven komt uit Hardins tragische verleden, hoe harder hij iedereen van zich afstoot. Tessa begrijpt de heftige gevoelens die hij probeert te verbergen achter zijn stoere façade en is de enige die hem kan kalmeren. Hij heeft haar nodig, maar heeft zij hem ook nodig? Tessa twijfelt of ze hem kan redden zonder zichzelf te verliezen. Ze wil vechten voor hun relatie, maar voor wie vecht ze eigenlijk?</div>\n</div>\n',
    image: '',
    poster:
      'https://bioscopenleiden.nl/content/uploads/2022/04/After-Ever-Happy_ps_1_jpg_sd-high-1-729x1080.jpg',
    classification: [],
    spoken_language: {
      label: 'Taal',
      value: 'Engels',
    },
    language: {
      label: 'Ondertitels',
      value: 'Nederlands',
    },
    director_name: {
      label: 'Regie',
      value: 'Castille Landon',
    },
    duration: {
      label: 'Speeltijd',
      value: '95',
    },
    tags: {
      expected: 'Verwacht',
    },
    review: false,
    permalink: 'https://bioscopenleiden.nl/films/after-ever-happy/',
    poster_small:
      'https://bioscopenleiden.nl/content/uploads/2022/04/After-Ever-Happy_ps_1_jpg_sd-high-1-72x108.jpg',
    dates: {
      cinema_id: '6',
      release: '20220825',
      last_week: '',
    },
    times: [
      {
        child_id: 23593,
        provider_id: '52565',
        program_start: '202207181200',
        program_end: '202207181337',
        ticket_status: 'no-websale',
        cinema_id: '4',
        location: 'Trianon 3',
        tags: [],
        duration: '97',
      },
    ],
  },
}

type BioscopenLeidenAPIResponse = {
  [key: string]: BioscopenLeidenMovie
}

type BioscopenLeidenMovie = {
  post_id: number
  title: string
  starring_short: string
  synopsis: string
  image: string
  poster: string
  classification: string[]
  spoken_language: {
    label: string
    value: string
  }
  language: {
    label: string
    value: string
  }
  director_name: {
    label: string
    value: string
  }
  duration: {
    label: string
    value: string
  }
  tags: {
    expected: string
  }
  review: boolean
  permalink: string
  poster_small: string
  dates: {
    cinema_id: number
    release: string
    last_week: string
  }
  times?: {
    child_id: number
    provider_id: string
    program_start: string
    program_end: string
    ticket_status: string
    cinema_id: number
    location: string
    tags: string[]
    duration: string
  }[]
}

const extractFromMainPage = async (): Promise<Screening[]> => {
  const apiResponse: BioscopenLeidenAPIResponse = await got(
    'https://bioscopenleiden.nl/fk-feed/agenda',
  ).json()

  debug('extracted api response: %j', apiResponse)

  const moviesWithEnglishSubtitlesTimes: BioscopenLeidenMovie[] = Object.values(
    apiResponse,
  )
    // first filter out times that don't have a 'en subs' tag
    .map((movie: BioscopenLeidenMovie) => {
      return {
        ...movie,
        times: movie.times?.filter((time) =>
          time.tags.map((x) => x.toLowerCase()).includes('en subs'),
        ),
      }
    })
    .filter((movie: BioscopenLeidenMovie) => movie.times?.length > 0)

  debug(
    'movies with times having english subtitles: %j',
    moviesWithEnglishSubtitlesTimes,
  )

  const screenings = moviesWithEnglishSubtitlesTimes.flatMap((movie) => {
    return movie.times.map((time) => {
      const screening = {
        title: movie.title,
        url: movie.permalink,
        cinema: 'Kijkhuis', // assumes all bioscopenleiden movies are in Kijkhuis
        date: DateTime.fromFormat(
          time.program_start,
          'yyyyMMddHHmm',
        ).toJSDate(),
      }
      return screening
    })
  })

  debug('extracted screenings: %j', screenings)

  return screenings
}

if (require.main === module) {
  const sort = R.sortWith([
    (a, b) => DateTime.fromISO(a.date) - DateTime.fromISO(b.date),
    R.ascend(R.prop('cinema')),
    R.ascend(R.prop('title')),
    R.ascend(R.prop('url')),
  ])

  extractFromMainPage()
    .then(sort)
    .then((x) => JSON.stringify(x, null, 2))
    .then(console.log)

  // extractFromMoviePage({
  // url: 'https://www.filmhuisdenhaag.nl/agenda/event/styx',
  // }).then(console.log)
}

export default extractFromMainPage
