import React from 'react'
import styled from '@emotion/styled'
import { useStaticQuery, graphql, Link } from 'gatsby'
import { css } from '@emotion/react'
import { useLocation } from '@reach/router'

const Container = styled('div')({
  marginLeft: -16,
  marginRight: -16,
  marginTop: 12,
  marginBottom: 12,
})

const CityFilter = () => {
  const data = useStaticQuery(graphql`
    query CityFilterQuery {
      allCity {
        nodes {
          name
        }
      }
    }
  `)

  const location = useLocation()

  const links = [
    { text: 'All', to: '/' },
    ...data.allCity.nodes.map(({ name }) => ({
      text: name,
      to: `/city/${name.toLowerCase()}`,
    })),
  ]
    .map(({ text, to }) => ({
      text,
      to,
      isCurrent: encodeURI(to) === location.pathname,
    }))
    .map(({ to, ...rest }) => ({ to: `${to}${location.search}`, ...rest }))

  return (
    <Container>
      {links.map(({ text, to, isCurrent }) => (
        <Link
          to={to}
          css={css({
            display: 'inline-block',
            fontSize: 24,
            color: isCurrent ? '#0650d0' : '#888',
            padding: '12px 16px',
            cursor: 'pointer',
            textDecoration: 'none',
          })}
          key={text}
        >
          {text}
        </Link>
      ))}
    </Container>
  )
}

export default CityFilter
