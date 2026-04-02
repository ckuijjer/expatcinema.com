'use client'

import React, {
  ComponentProps,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import { css } from 'styled-system/css'

import { useKeypress, useSearch } from '../utils/hooks'

const containerStyle = css({
  position: 'relative',
})

const inputStyle = css({
  padding: '12px',
  paddingRight: '48px',
  boxSizing: 'border-box',
  width: '100%',
  fontSize: '18px',
  borderRadius: '4px',
  border: '2px solid var(--primary-color)',
  margin: '0',
  backgroundColor: 'var(--background-inverse-color)',
  color: 'var(--text-inverse-color)',
  outlineColor: 'var(--primary-color)',
})

type DebouncedInputProps = {
  onDebounce: (value: string) => void
  delay?: number
} & ComponentProps<'input'>

const DebouncedInput = ({
  onDebounce,
  delay = 200,
  ...rest
}: DebouncedInputProps) => {
  const [value, setValue] = useState((rest.value as string) || '')
  const onDebounceRef = useRef(onDebounce)
  useLayoutEffect(() => {
    onDebounceRef.current = onDebounce
  })

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onDebounceRef.current(value)
    }, delay)

    return () => clearTimeout(timeoutId)
  }, [value, delay])

  useKeypress('Escape', () => setValue(''))

  return (
    <input
      name="search"
      className={inputStyle}
      {...rest}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  )
}

export const TextFilter = () => {
  const { search, setSearch } = useSearch()

  return (
    <div className={containerStyle}>
      <DebouncedInput
        placeholder="Search for movies, cinema's or cities"
        autoFocus
        value={search}
        onDebounce={setSearch}
        aria-label="Search for movies, cinema's or cities"
      />
    </div>
  )
}
