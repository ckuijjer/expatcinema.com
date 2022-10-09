import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { css } from '@emotion/react'
import { useQueryParam, StringParam } from 'use-query-params'
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

const CityFilter = () => {
  const router = useRouter()
  const [search] = useQueryParam('search', StringParam)
  const searchQuery = search ? `?search=${search}` : ''

  const links = [
    { text: 'All', href: '/' },
    ...cities.map(({ name }) => ({
      text: name,
      href: `/city/${name.toLowerCase()}`,
    })),
  ]
    .map(({ text, href }) => ({
      text,
      href,
      isCurrent: encodeURI(href) === router.pathname,
    }))
    .map(({ href, ...rest }) => ({ href: `${href}${searchQuery}`, ...rest }))

  return (
    <Container>
      {links.map(({ text, href, isCurrent }) => (
        <Link href={href} key={text}>
          <span
            css={css({
              display: 'inline-block',
              fontSize: 24,
              color: isCurrent
                ? 'var(--primary-color)'
                : 'var(--text-muted-color)',
              padding: '12px 16px',
              cursor: 'pointer',
              textDecoration: 'none',
            })}
          >
            {text}
          </span>
        </Link>
      ))}
    </Container>
  )
}

export default CityFilter
