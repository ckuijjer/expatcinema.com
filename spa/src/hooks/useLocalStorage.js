import React, { useContext, createContext } from 'react'

const LocalStorage = createContext()

export class LocalStorageProvider extends React.Component {
  state = {
    storage: {},
  }

  render() {
    const getItem = (key, initialValue) => {
      if (this.state.storage[key] === undefined) {
        try {
          const value = window.localStorage.getItem(key)
            ? JSON.parse(window.localStorage.getItem(key))
            : initialValue

          const storage = { ...this.state.storage, [key]: value }
          this.setState({ storage })

          return value
        } catch (error) {
          return initialValue
        }
      } else {
        return this.state.storage[key]
      }
    }

    const setItem = (key, value) => {
      window.localStorage.setItem(key, JSON.stringify(value))

      const storage = { ...this.state.storage, [key]: value }
      this.setState({ storage })
    }

    return (
      <LocalStorage.Provider value={{ getItem, setItem }}>
        {this.props.children}
      </LocalStorage.Provider>
    )
  }
}

// todo: error handling if there's no LocalStorageProvider?
const useLocalStorage = (key, initialValue) => {
  const context = useContext(LocalStorage)

  const item = context.getItem(key, initialValue)
  const setItem = (value) => context.setItem(key, value)

  return [item, setItem]
}

export default useLocalStorage
