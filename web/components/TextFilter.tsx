import React, { ComponentProps, useState, useEffect } from 'react'
import { css } from '@emotion/react'
import mobile from 'is-mobile'

import Cross from './icons/cross.svg'
import { useSearch } from './useSearch'

const Container = (props) => (
  <div
    css={css({
      position: 'relative',
    })}
    {...props}
  />
)

const Input = (props: ComponentProps<'input'>) => (
  <input
    name="search"
    css={css({
      padding: 12,
      paddingRight: 48,
      boxSizing: 'border-box',
      width: '100%',
      fontSize: 18,
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

type DebouncedInputProps = {
  onDebounce: (value: string) => void
  delay?: number
} & ComponentProps<'input'>

const DebouncedInput = ({
  onDebounce,
  delay = 200,
  ...rest
}: DebouncedInputProps) => {
  const [value, setValue] = useState(rest.value || '')

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onDebounce(value)
    }, delay)

    return () => clearTimeout(timeoutId)
  }, [value, delay])

  return (
    <Input
      {...rest}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyUp={(e) => {
        if (e.key === 'Escape') {
          console.log('onEscape')
          setValue('')
        }
      }}
    />
  )
}

const TextFilter = () => {
  const { search, setSearch } = useSearch()

  return (
    <Container>
      <DebouncedInput
        placeholder="Type to search"
        autoFocus={!mobile({ tablet: true })}
        value={search}
        onDebounce={setSearch}
        aria-label="Type to search"
      />
    </Container>
  )
}

export default TextFilter
