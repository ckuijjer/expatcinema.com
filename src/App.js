import React, { Component } from 'react'

import Calendar from './Calendar'
import Header from './Header'

class App extends Component {
  render() {
    return (
      <div className="App">
        <Header />
        <Calendar />
      </div>
    )
  }
}

export default App
