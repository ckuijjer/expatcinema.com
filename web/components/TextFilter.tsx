import React, { ComponentProps, useState, useEffect } from 'react'
import { css } from '@emotion/react'

import { useKeypress, useSearch } from '../utils/hooks'

const Container = (props) => (
  <div
    css={css`
      position: 'relative';
    `}
    {...props}
  />
)

const Input = (props: ComponentProps<'input'>) => (
  <input
    name="search"
    css={css`
      padding: 12px;
      padding-right: 48px;
      box-sizing: border-box;
      width: 100%;
      font-size: 18px;
      border-radius: 4px;
      border: 2px solid var(--primary-color);
      margin: 0;
      background-color: var(--background-inverse-color);
      color: var(--text-inverse-color);
      outline-color: var(--primary-color);
    `}
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

export const TextFilter = () => {
  const { search, setSearch } = useSearch()

  return (
    <Container>
      <DebouncedInput
        placeholder="Search for movies, cinema's or cities"
        autoFocus
        value={search}
        onDebounce={setSearch}
        aria-label="Search for movies, cinema's or cities"
      />
    </Container>
  )
}
