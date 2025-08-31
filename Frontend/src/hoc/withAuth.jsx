import React from 'react'
import { useAuth } from '../context/AuthContext'

export default function withAuth(Wrapped) {
  return function Protected(props) {
    const { isAuthenticated, initialized } = useAuth()

    if (!initialized) return null
    if (!isAuthenticated) return null

    return <Wrapped {...props} />
  }
}
