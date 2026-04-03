import { DateTime } from 'luxon'

export const Time = ({ children }: { children: DateTime }) => {
  return (
    <div style={{ fontSize: 18 }}>
      {children
        .setZone('Europe/Amsterdam')
        .toLocaleString(DateTime.TIME_24_SIMPLE, { locale: 'en-GB' })}
    </div>
  )
}
