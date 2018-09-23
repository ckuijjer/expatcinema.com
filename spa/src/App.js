import React from 'react'
import styled from 'react-emotion'

import About from './About'
import Calendar from './Calendar'
import TextFilter from './TextFilter'
import CityFilter from './CityFilter'
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
    cities: [],
  }

  handleSearch = e => {
    this.setState({ search: e.target.value })
  }

  handleCityChange = cities => this.setState(state => ({ cities }))

  render() {
    return (
      <>
        <Container>
          <Content>
            <Header />
            <TextFilter
              value={this.state.search}
              onChange={this.handleSearch}
            />
            <CityFilter onChange={this.handleCityChange} />
            <Calendar cities={this.state.cities} search={this.state.search} />
          </Content>
        </Container>
        {/* <Container style={{ backgroundColor: '#fbfbfb' }}>
          <Content>
            <About />
          </Content>
        </Container> */}
      </>
    )
  }
}

export default App
