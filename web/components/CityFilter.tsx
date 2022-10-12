import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { css } from '@emotion/react'
import cities from '../data/city.json'

const Container = (props) => (
  <div
    css={css({
      marginLeft: -16,
      marginRight: -16,
      marginTop: 12,
      marginBottom: 12,
    })}
    {...props}
  />
)

const ActiveLink = ({ children, href, as, ...rest }) => {
  const { asPath, isReady } = useRouter()

  const [isCurrent, setIsCurrent] = useState(false)
  useEffect(() => {
    if (isReady) {
      // Using URL().pathname to get rid of query and hash
      const linkPathname = new URL((as || href) as string, location.href)
        .pathname

      const activePathname = new URL(asPath, location.href).pathname

      setIsCurrent(linkPathname === activePathname)
    }
  }, [asPath, isReady, children, as, href, rest])

  return (
    <Link href={href} key={children} passHref>
      <a
        css={css({
          display: 'inline-block',
          fontSize: 24,
          color: isCurrent ? 'var(--primary-color)' : 'var(--text-muted-color)',
          padding: '12px 16px',
          cursor: 'pointer',
          textDecoration: 'none',
        })}
      >
        {children}
      </a>
    </Link>
  )
}

const CityFilter = () => {
  const router = useRouter()
  const { search } = router.query
  const searchQuery = search ? `?search=${search}` : ''

  const links = [
    { text: 'All', href: `/${searchQuery}` },
    ...cities.map(({ name }) => ({
      text: name,
      href: `/city/${name.toLowerCase()}${searchQuery}`,
    })),
  ]

  return (
    <Container>
      {links.map(({ text, href }) => (
        <ActiveLink href={href} key={text}>
          {text}
        </ActiveLink>
      ))}
    </Container>
  )
}

export default CityFilter
