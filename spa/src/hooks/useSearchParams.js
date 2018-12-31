import React, { useContext, createContext } from 'react'

const URLSearchParams = createContext()

export class URLSearchParamsProvider extends React.Component {
  state = {
    url: new URL(document.location),
  }

  render() {
    const getItem = (key, initialValue) => {
      try {
        const value = this.state.url.searchParams.get(key)
          ? JSON.parse(this.state.url.searchParams.get(key))
          : initialValue

        return value
      } catch (error) {
        return initialValue
      }
    }

    const setItem = (key, value) => {
      const url = new URL(this.state.url)

      if (value) {
        url.searchParams.set(key, JSON.stringify(value))
      } else {
        url.searchParams.delete(key)
      }

      window.history.replaceState(window.history.state, '', url)
      this.setState({ url })
    }

    return (
      <URLSearchParams.Provider value={{ getItem, setItem }}>
        {this.props.children}
      </URLSearchParams.Provider>
    )
  }
}

const useSearchParams = (key, initialValue) => {
  const context = useContext(URLSearchParams)

  const item = context.getItem(key, initialValue)
  const setItem = value => context.setItem(key, value)

  return [item, setItem]
}

export default useSearchParams
