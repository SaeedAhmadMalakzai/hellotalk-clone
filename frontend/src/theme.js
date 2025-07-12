import { extendTheme } from '@chakra-ui/react';
import { createTheme } from '@mui/material/styles';

export const chakraTheme = extendTheme({
  colors: {
    brand: {
      50: '#e3f2ff',
      100: '#b3d4ff',
      200: '#80b5ff',
      300: '#4d96ff',
      400: '#1a78ff',
      500: '#005ee6',
      600: '#0048b4',
      700: '#003282',
      800: '#001c50',
      900: '#00061f'
    }
  },
  fonts: {
    heading: 'Segoe UI, Roboto, sans-serif',
    body: 'Segoe UI, Roboto, sans-serif'
  }
});

export const muiTheme = createTheme({
  palette: {
    primary: { main: '#1a78ff' },
    secondary: { main: '#ECC94B' },
    background: { default: '#f5f6fa' }
  },
  shape: {
    borderRadius: 8
  }
});
