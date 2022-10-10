import React, { useEffect } from 'react'
import { css } from '@emotion/react'
import mobile from 'is-mobile'

import Cross from './cross.svg'
import { useRouter } from 'next/router'

const Container = (props) => (
  <div
    css={css({
      position: 'relative',
    })}
    {...props}
  />
)

const Input = (props) => (
  <input
    css={css({
      padding: 12,
      paddingRight: 48,
      boxSizing: 'border-box',
      width: '100%',
      fontSize: 20,
      borderRadius: 4,
      border: '1px solid #aaa',
      margin: 0,
      backgroundColor: 'var(--background-color)',
      color: 'var(--text-color)',
    })}
    {...props}
  />
)

const ClearButton = (props) => (
  <div
    css={css({
      position: 'absolute',
      right: 8,
      top: 8,
      width: 32,
      height: 32,
      boxSizing: 'border-box',
      paddingTop: 4,
      paddingLeft: 4,
      cursor: 'pointer',
    })}
    {...props}
  />
)

const TextFilter = () => {
  const router = useRouter()
  const { search } = router.query

  return (
    <Container>
      <Input
        placeholder="Type to search"
        autoFocus={!mobile({ tablet: true })}
        value={search ?? ''}
        onChange={(e) => {
          if (e.target.value === '') {
            const { search, ...rest } = router.query
            router.replace({ query: { ...rest } })
          } else {
            router.replace({
              query: { ...router.query, search: e.target.value },
            })
          }
        }}
        onKeyUp={(e) => {
          if (e.key === 'Escape') {
            const { search, ...rest } = router.query
            router.replace({ query: { ...rest } })
          }
        }}
        aria-label="Type to search"
      />
      {search && (
        <ClearButton
          onClick={() => {
            const { search, ...rest } = router.query
            router.replace({ query: { ...rest } })
          }}
        >
          <Cross />
        </ClearButton>
      )}
    </Container>
  )
}

export default TextFilter
