// Quick trick to not get the "Cannot read property 'parentNode' of undefined" error for react-ga, see https://github.com/react-ga/react-ga/issues/96#issuecomment-355841953
jest.mock('react-ga')
