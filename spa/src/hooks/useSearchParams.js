import { useState } from 'react'

const useSearchParams = (key, initialValue) => {
  const [item, setInnerValue] = useState(() => {
    try {
      return window.localStorage.getItem(key)
        ? JSON.parse(window.localStorage.getItem(key))
        : initialValue
    } catch (error) {
      // Return default value if JSON parsing fails
      return initialValue
    }
  })

  const setValue = value => {
    console.log('setValue', { value })
    setInnerValue(value)
    window.localStorage.setItem(key, JSON.stringify(value))
  }

  return [item, setValue]
}

export default useSearchParams
