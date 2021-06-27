import React from 'react'
import styled from '@emotion/styled'
import mobile from 'is-mobile'

import Cross from './cross.svg'
import { useQueryParam, StringParam } from 'use-query-params'

const Container = styled('div')({
  position: 'relative',
})

const Input = styled('input')({
  padding: 12,
  paddingRight: 48,
  boxSizing: 'border-box',
  width: '100%',
  fontSize: 20,
  borderRadius: 4,
  border: '1px solid #aaa',
  margin: 0,
})

const ClearButton = styled('div')({
  position: 'absolute',
  right: 8,
  top: 8,
  width: 32,
  height: 32,
  boxSizing: 'border-box',
  paddingTop: 4,
  paddingLeft: 4,
  cursor: 'pointer',
})

const TextFilter = () => {
  const [search, setSearch] = useQueryParam('search', StringParam)

  return (
    <Container>
      <Input
        placeholder="Type to search"
        autoFocus={!mobile({ tablet: true })}
        value={search ?? ''}
        onChange={(e) => {
          setSearch(e.target.value || undefined)
        }}
        onKeyUp={(e) => e.key === 'Escape' && setSearch(undefined)}
        aria-label="Type to search"
      />
      {search && (
        <ClearButton onClick={() => setSearch(undefined)}>
          <Cross />
        </ClearButton>
      )}
    </Container>
  )
}

export default TextFilter
