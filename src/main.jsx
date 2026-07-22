import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './styles/global.css'
import App from './App.jsx'
import { ToastProvider } from './components/feedback/Toast'
import { DataProvider } from './shared/context/DataProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <DataProvider>
        <App />
      </DataProvider>
    </ToastProvider>
  </StrictMode>,
)
