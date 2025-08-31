import React from 'react'
import LoginPage from './components/LoginPage'
import Dashboard from './components/Dashboard'
import { useAuth } from './context/AuthContext'

function App() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Dashboard /> : <LoginPage />
}

export default App





  