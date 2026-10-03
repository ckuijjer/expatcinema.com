import { DateTime } from 'luxon'

import { Screening } from './getScreenings'

export const getScreeningDates = (screenings: Screening[]): string[] =>
  [
    ...new Set(
      screenings.map(
        (s) =>
          DateTime.fromISO(s.date, { setZone: true })
            .setZone('Europe/Amsterdam')
            .toISODate() ?? '',
      ),
    ),
  ].sort()
