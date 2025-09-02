import React from 'react'
import LoginPage from './components/LoginPage'
import Dashboard from './components/Dashboard'
import { useAuth } from './context/AuthContext'
import { Routes, Route, Navigate } from 'react-router-dom'
import Salesboard from './components/Salesboard'
import Categories from './components/Categories'

function PrivateRoute({ children }) {
  const { isAuthenticated, initialized } = useAuth()
  if (!initialized) return null
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/sales"
        element={
          <PrivateRoute>
            <Salesboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/categories"
        element={
          <PrivateRoute>
            <Categories />
          </PrivateRoute>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}





