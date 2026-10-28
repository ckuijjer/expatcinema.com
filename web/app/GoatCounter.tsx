'use client'

import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { useEffect, useRef, useState } from 'react'

import { countPageView } from '../utils/goatcounter'
import { GOATCOUNTER_CODE } from '../utils/goatcounterCode'

// Counts the visits. The script doesn't count by itself (`no_onload`): the page
// is counted here once the script has loaded, and again for every page the app
// opens without loading it, with the path alone so a search is not part of it,
// and the page before it as the referrer.
export const GoatCounter = () => {
  const pathname = usePathname()
  const [loaded, setLoaded] = useState(false)
  const previousPathname = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!loaded) return

    // the page before this one, so a move from the home page to a film shows
    // up as a referrer in GoatCounter. Not for the first page of a visit
    countPageView(pathname, previousPathname.current)
    previousPathname.current = pathname
  }, [loaded, pathname])

  if (!GOATCOUNTER_CODE || process.env.NODE_ENV !== 'production') return null

  return (
    <Script
      async
      src="https://gc.zgo.at/count.js"
      data-goatcounter={`https://${GOATCOUNTER_CODE}.goatcounter.com/count`}
      data-goatcounter-settings='{"no_onload": true}'
      onLoad={() => setLoaded(true)}
    />
  )
}
