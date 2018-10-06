const Xray = require('x-ray')
const R = require('ramda')
const { DateTime } = require('luxon')

const debug = require('debug')('bioscopenleiden')

const debugPromise = (format, ...debugArgs) => arg => {
  debug(format, ...debugArgs, arg)
  return arg
}
const xray = Xray()
  .concurrency(3)
  .throttle(3, 300)

const monthToNumber = month =>
  [
    'januari',
    'februari',
    'maart',
    'april',
    'mei',
    'juni',
    'juli',
    'augustus',
    'september',
    'oktober',
    'november',
    'december',
  ].indexOf(month) + 1

const splitTime = time => time.split(':').map(x => Number(x))

const extractFromMoviePage = ({ url }) =>
  xray(url, 'body', [
    {
      title: '.h-title',
      date: '.sub-date',
      time: '.time',
      cinema: '.building',
    },
  ])
    .then(debugPromise('movie page'))
    .then(results =>
      results
        .map(r => ({ ...r, url })) // add the movie page's url
        .map(r => ({
          ...r,
          title: r.title.replace('Expat Cinema: ', ''), // Remove Expat Cinema from the title
        }))
        .map(r => {
          const { date, time, ...rest } = r
          const [dayString, monthString] = date.split(' ')
          const day = Number(dayString)
          const month = monthToNumber(monthString)
          const [hour, minute] = splitTime(time)

          return {
            ...rest,
            date: DateTime.fromObject({
              day,
              month,
              hour,
              minute,
            })
              .toUTC()
              .toISO(),
          }
        }),
    )

const extractFromMainPage = () =>
  xray('https://www.bioscopenleiden.nl', '.schedule .tab-content li', [
    {
      title: '.title',
      url: '.title@href',
    },
  ])
    .then(debugPromise('main page'))
    .then(
      results =>
        Promise.all(
          results
            .filter(x => x.title && x.title.startsWith('Expat Cinema'))
            .map(extractFromMoviePage),
        )
          .then(R.flatten)
          .then(R.uniq), // remove duplicates
    )

if (require.main === module) {
  extractFromMainPage()
    .then(x => JSON.stringify(x, null, 2))
    .then(console.log)
}

module.exports = extractFromMainPage

// .paginate('.nav-previous a@href')
// .limit(3)
// .write('results.json');
// .then(x => {
//   console.log('😀', x);
// })
// .catch(err => console.log('💔', err));
