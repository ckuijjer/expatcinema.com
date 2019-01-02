import React from 'react'
import styled from 'react-emotion'

import { ReactComponent as Cross } from './cross.svg'
import { useSearchParams } from './hooks'

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
  const [search, setSearch] = useSearchParams('search', '')

  return (
    <Container>
      <Input
        placeholder="Type to search"
        autoFocus
        value={search}
        onChange={e => setSearch(e.target.value)}
        onKeyUp={e => e.key === 'Escape' && setSearch()}
      />
      {search && (
        <ClearButton onClick={() => setSearch()}>
          <Cross />
        </ClearButton>
      )}
    </Container>
  )
}

export default TextFilter
