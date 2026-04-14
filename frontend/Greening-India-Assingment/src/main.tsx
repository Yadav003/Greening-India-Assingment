import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import AppErrorBoundary from './components/AppErrorBoundary'
import { AuthProvider } from './context/AuthProvider'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </AppErrorBoundary>,
)
