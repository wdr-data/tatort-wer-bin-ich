import React from 'react'
import ReactDOM from 'react-dom/client'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import './index.css'
import App from './App'
import reportWebVitals from './reportWebVitals'

const theme = createTheme({
  typography: {
    fontFamily: ['Thesis', 'sans-serif'].join(','),
    allVariants: {
      color: '#000000'
    },
    body1: {
      marginBottom: '.75rem',
      marginTop: '0'
    },
    h1: {
      fontSize: '2rem'
    },
    h2: {
      fontSize: '1.5rem'
    }
  },
  shape: {
    borderRadius: 0
  },
  palette: {
    primary: {
      main: 'rgb(4, 3, 73)'
    },
    secondary: {
      main: 'rgb(55, 69, 217)'
    }
  }
})

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
