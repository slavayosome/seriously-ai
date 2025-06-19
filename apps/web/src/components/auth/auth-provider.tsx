'use client'

import { ReactNode } from 'react'
import { useAuthEvents, useAuthProfileSync } from '../../hooks/use-auth'

interface AuthProviderProps {
  children: ReactNode
}

/**
 * AuthProvider component that handles automatic profile synchronization
 * and auth event management throughout the application
 */
export function AuthProvider({ children }: AuthProviderProps) {
  // Initialize auth event listeners with profile sync
  useAuthEvents()
  
  // Initialize profile sync functionality
  const { syncing } = useAuthProfileSync()

  // Optionally, you could display a sync indicator
  // For now, we'll just run the hooks silently in the background

  return (
    <>
      {children}
      {/* Optional: Global sync indicator */}
      {syncing && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-3 py-2 rounded-md text-sm z-50">
          Syncing profile...
        </div>
      )}
    </>
  )
}

export default AuthProvider 