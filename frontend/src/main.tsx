import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import './index.css'
import App from './App.tsx'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import Protected from './components/Protected'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>  
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <Protected>
                <App />
              </Protected>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
