'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ComponentProps } from 'react'

// A link to a movie page that opens inside the app, without loading the site
// again. Not prefetched when it scrolls into view, as there are hundreds on a
// page (`prefetch={false}`), which also turns off Next's own prefetch on hover,
// so it is done here: on hover and on keyboard focus.
export const MovieLink = ({
  href,
  ...props
}: Omit<ComponentProps<typeof Link>, 'prefetch' | 'href'> & {
  href: string
}) => {
  const router = useRouter()
  const prefetch = () => router.prefetch(href)

  return (
    <Link
      href={href}
      prefetch={false}
      onMouseEnter={prefetch}
      onFocus={prefetch}
      {...props}
    />
  )
}
