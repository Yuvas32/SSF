import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ScanStatusProvider } from './hooks/scanStatusContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ScanStatusProvider>
      <App />
    </ScanStatusProvider>
  </StrictMode>,
)
