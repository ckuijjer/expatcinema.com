import React, { ComponentProps, useState, useEffect } from 'react'
import { css } from '@emotion/react'
import mobile from 'is-mobile'

import { useKeypress, useSearch } from '../utils/hooks'

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
      border: '2px solid var(--primary-color)',
      margin: 0,
      backgroundColor: 'var(--background-inverse-color)',
      color: 'var(--text-inverse-color)',
      outlineColor: 'var(--primary-color)',
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

  useKeypress('Escape', () => setValue(''))

  return (
    <Input {...rest} value={value} onChange={(e) => setValue(e.target.value)} />
  )
}

const TextFilter = () => {
  const { search, setSearch } = useSearch()

  return (
    <Container>
      <DebouncedInput
        placeholder="Search for movies, cinema's or cities"
        autoFocus={!mobile({ tablet: true })}
        value={search}
        onDebounce={setSearch}
        aria-label="Search for movies, cinema's or cities"
      />
    </Container>
  )
}

export default TextFilter
