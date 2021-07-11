import React from 'react'
import styled from '@emotion/styled'
import { useStaticQuery, graphql, Link } from 'gatsby'
import { ClassNames } from '@emotion/react'

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

  const links = [
    { text: 'All', to: '/' },
    ...data.allCity.nodes.map(({ name }) => ({
      text: name,
      to: `/city/${name.toLowerCase()}`,
    })),
  ]

  return (
    <Container>
      {links.map(({ text, to }) => (
        <ClassNames>
          {({ css }) => (
            <Link
              to={to}
              css={css({
                display: 'inline-block',
                fontSize: 24,
                color: '#888',
                paddingRight: 20,
                cursor: 'pointer',
                textDecoration: 'none',
              })}
              activeClassName={css({
                color: '#0650d0',
              })}
            >
              {text}
            </Link>
          )}
        </ClassNames>
      ))}
    </Container>
  )
}

export default CityFilter
