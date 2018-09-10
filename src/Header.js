import React from 'react'
import styled from 'react-emotion'

const Title = styled('div')({
  fontSize: 48,
})

const SubTitle = styled('div')({
  fontSize: 32,
})

const Header = () => (
  <>
    <Title>Expat Cinema</Title>
    <SubTitle>Foreign movies with English subtitles</SubTitle>
  </>
)

export default Header
