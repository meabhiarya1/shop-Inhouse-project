import React, { useEffect } from 'react'
import LoginPage from './components/LoginPage'
import Dashboard from './components/Dashboard'
import { useAuth } from './context/AuthContext'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Salesboard from './components/Salesboard'
import Products from './components/Products'
import Categories from './components/Categories'
import { CartProvider } from './context/CartContext'
import CartModal from './components/CartModal'
import { setupAxiosInterceptors } from './utils/axiosConfig'

function PrivateRoute({ children }) {
  const { isAuthenticated, initialized } = useAuth()
  if (!initialized) return null
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Set up axios interceptors for automatic redirect on auth failure
  useEffect(() => {
    setupAxiosInterceptors(navigate, logout);
  }, [navigate, logout]);

  return (
    <CartProvider>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
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
        <Route
          path="/products"
          element={
            <PrivateRoute>
              <Products />
            </PrivateRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <CartModal />
    </CartProvider>
  )
}





