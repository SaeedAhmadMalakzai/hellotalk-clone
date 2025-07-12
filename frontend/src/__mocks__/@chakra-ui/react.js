const React = require('react');
const identity = (props) => React.createElement('div', props);

module.exports = {
  Box: identity,
  Button: identity,
  FormControl: identity,
  FormLabel: identity,
  Input: (props) => React.createElement('input', props),
  Text: identity,
  Heading: identity,
  Stack: identity,
  Alert: identity,
  AlertIcon: () => React.createElement('span', null),
  Spinner: () => React.createElement('div', null),
  ChakraProvider: ({children}) => React.createElement('div', null, children),
  ColorModeScript: () => null,
  useColorMode: () => ({ colorMode: 'light', toggleColorMode: () => {} }),
  useColorModeValue: (light, dark) => light,
};
