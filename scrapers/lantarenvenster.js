const Xray = require('x-ray')
const R = require('ramda')
const { DateTime } = require('luxon')

const xray = Xray({
  filters: {
    trim: value => (typeof value === 'string' ? value.trim() : value),
  },
})

const DEBUG = true
const log = name => arg => {
  DEBUG && console.log(name, JSON.stringify(arg, null, 2))
  return arg
}

const hasEnglishSubtitles = ({ subtitles }) =>
  subtitles === 'Engels ondertiteld'

const splitTime = time => time.split(':').map(x => Number(x))

const monthToNumber = month =>
  [
    'jan',
    'feb',
    'maa',
    'apr',
    'mei',
    'jun',
    'jul',
    'aug',
    'sep',
    'okt',
    'nov',
    'dec',
  ].indexOf(month) + 1

const flatten = (acc, cur) => [...acc, ...cur]

const extractFromMoviePage = ({ url }) => {
  console.log(`extracting ${url}`)

  return xray(url, '.page-content-aside', {
    title: '.wp_theatre_prod_title',
    subtitles: '.wp_theatre_prod_languages_subtitles | trim',
    screenings: xray('.wpt_production_login_form tr', [
      {
        date: 'th | trim',
        times: ['td | trim'],
      },
    ]),
  })
    .then(log(`extracted xray ${url}:`))
    .then(movie => {
      if (!hasEnglishSubtitles(movie)) return []

      return movie.screenings
        .map(({ date, times }) => {
          return times
            .filter(time => time) // remove empty times
            .map(time => {
              const [dayOfWeek, dayString, monthString] = date.split(' ')
              const day = Number(dayString)
              const month = monthToNumber(monthString)
              const [hour, minute] = splitTime(time)

              return {
                title: movie.title,
                url,
                cinema: 'Lantarenvenster',
                date: DateTime.fromObject({
                  day,
                  month,
                  hour,
                  minute,
                })
                  .toUTC()
                  .toISO(),
              }
            })
        })
        .reduce(flatten, [])
    })
    .then(log(`extracted done ${url}:`))
}

const extractFromMainPage = () => {
  return (
    xray(
      'https://www.lantarenvenster.nl/#all',
      '.wp_theatre_event.film-groep',
      [
        {
          url: '> a@href',
          title: '.wp_theatre_event_title',
        },
      ],
    )
      .then(R.uniq) // as the agenda has lots of duplicate movie urls, make it unique
      .then(log('main page'))
      .then(results => Promise.all(results.map(extractFromMoviePage)))
      // .then(results => results.filter(x => x))
      .then(log('before flatten'))
      .then(results => results.reduce(flatten, []))
      .then(log('done'))
  )
}

{
  /* <div class="wp_theatre_prod_languages_subtitles">
			Engels ondertiteld		</div> */
}

// extractFromMainPage()

// Promise.resolve([
//   {
//     url: 'https://www.lantarenvenster.nl/programma/rivers-edge/',
//   },
//   { url: 'https://www.lantarenvenster.nl/programma/la-priere/' },
//   { url: 'https://www.lantarenvenster.nl/programma/think-again-junpei/' },
// ])
//   .then(R.uniq) // as the agenda has lots of duplicate movie urls, make it unique
//   .then(log('main page'))
//   .then(results => Promise.all(results.map(extractFromMoviePage)))
//   // .then(results => results.filter(x => x))
//   .then(results => results.reduce(flatten, []))
//   .then(log('done'))

// extractFromMoviePage({
//   url: 'https://www.lantarenvenster.nl/programma/think-again-junpei/',
// })
extractFromMoviePage({
  url: 'https://www.lantarenvenster.nl/programma/kanazawa-shutter-girl/',
})
