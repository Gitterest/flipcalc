import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { ProAccessProvider } from './components/ProAccessProvider'
import { ThemeProvider } from './components/ThemeProvider'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <ProAccessProvider>
          <App />
        </ProAccessProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
