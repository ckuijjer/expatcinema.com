import React from 'react'
import styled from 'react-emotion'
import { view } from 'react-easy-state'
import { params } from 'react-easy-params'

import Cross from './Cross'

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
  // backgroundColor: '#0650d0',
  cursor: 'pointer',
})

const TextFilter = () => (
  <Container>
    <Input
      placeholder="Type to search"
      autoFocus
      value={params.search || ''}
      onChange={e => (params.search = e.target.value)}
    />
    {params.search && (
      <ClearButton onClick={() => (params.search = '')}>
        <Cross />
      </ClearButton>
    )}
  </Container>
)

export default view(TextFilter)
