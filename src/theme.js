import { createTheme } from '@mui/material/styles'

// Bybit-like dark theme, slightly lighter
const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#111315', // lighter than Bybit black
      paper: '#16191c'
    },
    primary: { main: '#fda22b' }, // Bybit amber
    secondary: { main: '#4fc3f7' },
    text: { primary: '#f1f5f9', secondary: '#94a3b8' }
  },
  shape: { borderRadius: 14 },
  components: {
    MuiCard: {
      styleOverrides: { root: { border: '1px solid #22262b' } }
    }
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial, "Apple Color Emoji", "Segoe UI Emoji"'
  }
})

export default theme
