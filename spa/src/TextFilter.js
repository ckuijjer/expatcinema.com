import React from 'react'

const Filter = ({ value, onChange }) => (
  <input
    placeholder="Type to search"
    style={{
      padding: 12,
      boxSizing: 'border-box',
      width: '100%',
      fontSize: 20,
    }}
    autoFocus
    value={value}
    onChange={onChange}
  />
)

export default Filter
