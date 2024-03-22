const monthToNumber = (name: string, listOfMonths: string[], month: string) => {
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
  return monthToNumber(
    'fullMonthToNumberDutch',
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
    ],
    month,
  )
}

export function shortMonthToNumberDutch(month: string) {
  return monthToNumber(
    'shortMonthToNumberDutch',
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
    ],
    month,
  )
}

export function fullMonthToNumberEnglish(month: string) {
  return monthToNumber(
    'fullMonthToNumberEnglish',
    [
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
    ],
    month,
  )
}

export function shortMonthToNumberEnglish(month: string) {
  return monthToNumber(
    'shortMonthToNumberEnglish',
    [
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
    ],
    month,
  )
}
