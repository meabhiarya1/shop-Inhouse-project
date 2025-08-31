import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_TOKEN_KEY = 'auth_token'
const STORAGE_USER_KEY = 'auth_user'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(STORAGE_TOKEN_KEY)
      const savedUser = localStorage.getItem(STORAGE_USER_KEY)
      if (savedToken) setToken(savedToken)
      if (savedUser) setUser(JSON.parse(savedUser))
    } catch {}
    setInitialized(true)
  }, [])

  const login = (newToken, newUser) => {
    setToken(newToken)
    setUser(newUser || null)
    try {
      localStorage.setItem(STORAGE_TOKEN_KEY, newToken)
      if (newUser) localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(newUser))
    } catch {}
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    try {
      localStorage.removeItem(STORAGE_TOKEN_KEY)
      localStorage.removeItem(STORAGE_USER_KEY)
    } catch {}
  }

  const value = useMemo(() => ({
    isAuthenticated: Boolean(token),
    token,
    user,
    initialized,
    login,
    logout,
  }), [token, user, initialized])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
