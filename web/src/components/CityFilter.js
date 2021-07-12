import React from 'react'
import styled from '@emotion/styled'
import { useStaticQuery, graphql, Link } from 'gatsby'
import { css } from '@emotion/react'
import { useLocation } from '@reach/router'

const Container = styled('div')({
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

  console.log({ links })

  return (
    <Container>
      {links.map(({ text, to, isCurrent }) => (
        <Link
          to={to}
          css={css({
            display: 'inline-block',
            fontSize: 24,
            color: isCurrent ? '#0650d0' : '#888',
            paddingRight: 20,
            cursor: 'pointer',
            textDecoration: 'none',
          })}
        >
          {text}
        </Link>
      ))}
    </Container>
  )
}

export default CityFilter
