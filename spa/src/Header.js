import React from 'react'
import styled from 'react-emotion'

const Title = styled('h1')({
  fontSize: 40,
  marginBottom: 0,
})

const SubTitle = styled('h2')({
  fontSize: 24,
  marginTop: 0,
  marginBottom: 24,
})

const Header = () => (
  <>
    <Title>Expat Cinema</Title>
    <SubTitle>Foreign movies with English subtitles</SubTitle>
  </>
)

export default Header
