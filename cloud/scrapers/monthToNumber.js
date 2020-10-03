const fullMonthToNumber = (month) =>
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
  ].indexOf(month.toLowerCase()) + 1

const shortMonthToNumber = (month) =>
  [
    'jan',
    'feb',
    'mrt',
    'apr',
    'mei',
    'jun',
    'jul',
    'aug',
    'sep',
    'okt',
    'nov',
    'dec',
  ].indexOf(month.toLowerCase()) + 1

exports.fullMonthToNumber = fullMonthToNumber
exports.shortMonthToNumber = shortMonthToNumber
