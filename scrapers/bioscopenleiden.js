const Xray = require('x-ray')
const xray = Xray()
const R = require('ramda')
const { DateTime } = require('luxon')

const DEBUG = false

const log = name => arg => {
  DEBUG && console.log(name, arg)
  return arg
}

xray('https://www.bioscopenleiden.nl', '.schedule .tab-content li', [
  {
    title: '.title',
    url: '.title@href',
  },
])
  .then(log('main page'))
  .then(results => {
    Promise.all(
      results
        .filter(x => x.title && x.title.startsWith('Expat Cinema'))
        .map(x => {
          return xray(x.url, 'body', [
            {
              title: '.h-title',
              date: '.sub-date',
              time: '.time',
              cinema: '.building',
            },
          ])
            .then(log('movie page'))
            .then(results => results.map(r => ({ ...r, url: x.url }))) // add the movie page's url
            .then(results =>
              results.map(r => ({
                ...r,
                title: r.title.replace('Expat Cinema: ', ''), // Remove Expat Cinema from the title
              })),
            )
            .then(results =>
              results.map(r => {
                const { date, time, ...rest } = r
                return {
                  ...rest,
                  date: DateTime.fromFormat(`${date} ${time}`, 'd MMMM H:mm')
                    .toUTC()
                    .toISO(), // create a iso8601 using the date and the time
                }
              }),
            )
        }),
    )
      .then(R.uniq) // remove duplicates
      .then(console.log)
  })
// .paginate('.nav-previous a@href')
// .limit(3)
// .write('results.json');
// .then(x => {
//   console.log('😀', x);
// })
// .catch(err => console.log('💔', err));