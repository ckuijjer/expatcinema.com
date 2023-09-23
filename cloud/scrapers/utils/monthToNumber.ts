export const fullMonthToNumberDutch = (month: string) => {
  const monthNumber =
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

  if (monthNumber === 0) {
    throw new Error(
      `invalid month ${month}, might you need the English version of this function?`,
    )
  }

  return monthNumber
}

export const shortMonthToNumberDutch = (month: string) => {
  const monthNumber =
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

  if (monthNumber === 0) {
    throw new Error(
      `invalid month ${month}, might you need the English version of this function?`,
    )
  }

  return monthNumber
}

export const shortMonthToNumberEnglish = (month: string) => {
  const monthNumber =
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
    ].indexOf(month.toLowerCase()) + 1

  if (monthNumber === 0) {
    throw new Error(
      `invalid month ${month}, might you need the Dutch version of this function?`,
    )
  }

  return monthNumber
}
