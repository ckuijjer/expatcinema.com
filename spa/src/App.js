import React from 'react'
import styled from 'react-emotion'

import About from './About'
import Calendar from './Calendar'
import Filter from './Filter'
import Header from './Header'

const Container = styled('div')({})

const Content = styled('div')({
  margin: '0 auto',

  paddingLeft: 16,
  paddingRight: 16,
  maxWidth: 960,
})

class App extends React.Component {
  state = {
    search: '',
  }

  handleChange = e => {
    this.setState({ search: e.target.value })
  }

  render() {
    return (
      <>
        <Container>
          <Content>
            <Header />
            {/* <Filter value={this.state.search} onChange={this.handleChange} /> */}
            <Calendar />
          </Content>
        </Container>
        <Container style={{ backgroundColor: '#fbfbfb' }}>
          <Content>
            <About />
          </Content>
        </Container>
      </>
    )
  }
}

export default App
