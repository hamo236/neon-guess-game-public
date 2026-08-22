import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { GameStateProvider } from './context/GameStateContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <GameStateProvider>
        <App />
      </GameStateProvider>
    </BrowserRouter>
  </React.StrictMode>,
)

