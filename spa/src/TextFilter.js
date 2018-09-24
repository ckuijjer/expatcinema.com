import React from 'react'
import { view } from 'react-easy-state'
import { params } from 'react-easy-params'

const TextFilter = () => (
  <input
    placeholder="Type to search"
    style={{
      padding: 12,
      boxSizing: 'border-box',
      width: '100%',
      fontSize: 20,
      borderRadius: 4,
      border: '1px solid #aaa',
    }}
    autoFocus
    value={params.search || ''}
    onChange={e => (params.search = e.target.value)}
  />
)

export default view(TextFilter)
