const FULL_MONTHS_DUTCH = [
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
]

const SHORT_MONTHS_DUTCH = [
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
]

const FULL_MONTHS_ENGLISH = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
]

const SHORT_MONTHS_ENGLISH = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
]

export function monthToNumber(month: string) {
  const lowerCaseMonth = month.toLowerCase()

  const monthNumber =
    FULL_MONTHS_DUTCH.indexOf(lowerCaseMonth) + 1 ||
    SHORT_MONTHS_DUTCH.indexOf(lowerCaseMonth) + 1 ||
    FULL_MONTHS_ENGLISH.indexOf(lowerCaseMonth) + 1 ||
    SHORT_MONTHS_ENGLISH.indexOf(lowerCaseMonth) + 1

  if (monthNumber === 0) {
    throw new Error(`monthToNumber: invalid month ${lowerCaseMonth}`)
  }

  return monthNumber
}

const monthToNumberWithWarning = (
  name: string,
  listOfMonths: string[],
  month: string,
) => {
  const lowerCaseMonth = month.toLowerCase()

  const monthNumber = listOfMonths.indexOf(lowerCaseMonth) + 1
  if (monthNumber === 0) {
    throw new Error(
      `${name}: invalid month ${lowerCaseMonth}, might you need another function?`,
    )
  }

  return monthNumber
}

export function fullMonthToNumberDutch(month: string) {
  return monthToNumberWithWarning(
    'fullMonthToNumberDutch',
    FULL_MONTHS_DUTCH,
    month,
  )
}

export function shortMonthToNumberDutch(month: string) {
  return monthToNumberWithWarning(
    'shortMonthToNumberDutch',
    SHORT_MONTHS_DUTCH,
    month,
  )
}

export function fullMonthToNumberEnglish(month: string) {
  return monthToNumberWithWarning(
    'fullMonthToNumberEnglish',
    FULL_MONTHS_ENGLISH,
    month,
  )
}

export function shortMonthToNumberEnglish(month: string) {
  return monthToNumberWithWarning(
    'shortMonthToNumberEnglish',
    SHORT_MONTHS_ENGLISH,
    month,
  )
}
