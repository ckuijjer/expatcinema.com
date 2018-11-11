const fs = require('fs')
const { DateTime } = require('luxon')

const all = require('../screenings.json')

const { year, month, day } = DateTime.local()
const today = DateTime.fromObject({ year, month, day })

const filtered = all.filter(({ date }) => DateTime.fromISO(date) >= today)

fs.writeFileSync('src/data/screenings.json', JSON.stringify(filtered, null, 2))
