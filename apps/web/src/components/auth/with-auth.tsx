'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthLoading, useRequireAuth } from '../../hooks/use-auth'

interface WithAuthOptions {
  redirectTo?: string
  allowUnauthenticated?: boolean
  showLoading?: boolean
  loadingComponent?: React.ComponentType
}

/**
 * Higher-order component to protect routes that require authentication
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const {
    redirectTo = '/auth/login',
    allowUnauthenticated = false,
    showLoading = true,
    loadingComponent: LoadingComponent,
  } = options

  return function AuthenticatedComponent(props: P) {
    const router = useRouter()
    const { authenticated, loading, shouldRedirect } = useRequireAuth()
    const authLoading = useAuthLoading()

    useEffect(() => {
      if (shouldRedirect && !allowUnauthenticated) {
        const currentPath = window.location.pathname
        const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`
        router.push(redirectUrl)
      }
    }, [shouldRedirect, allowUnauthenticated, router])

    // Show loading state
    if ((loading || authLoading) && showLoading) {
      if (LoadingComponent) {
        return <LoadingComponent />
      }
      
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      )
    }

    // Don't render if not authenticated and not allowing unauthenticated access
    if (!authenticated && !allowUnauthenticated) {
      return null
    }

    return <Component {...props} />
  }
}

/**
 * Simple loading component
 */
export function AuthLoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}

/**
 * Auth guard component for wrapping content
 */
interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
  fallback?: React.ReactNode
  requireAuth?: boolean
}

export function AuthGuard({ 
  children, 
  redirectTo = '/auth/login',
  fallback,
  requireAuth = true 
}: AuthGuardProps) {
  const router = useRouter()
  const { authenticated, loading } = useRequireAuth()

  useEffect(() => {
    if (!loading && !authenticated && requireAuth) {
      const currentPath = window.location.pathname
      const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`
      router.push(redirectUrl)
    }
  }, [authenticated, loading, requireAuth, router, redirectTo])

  if (loading) {
    return fallback || <AuthLoadingSpinner />
  }

  if (!authenticated && requireAuth) {
    return fallback || null
  }

  return <>{children}</>
}

/**
 * Component for conditional rendering based on auth status
 */
interface ConditionalAuthProps {
  children: React.ReactNode
  authenticated?: React.ReactNode
  unauthenticated?: React.ReactNode
  loading?: React.ReactNode
}

export function ConditionalAuth({ 
  children, 
  authenticated, 
  unauthenticated, 
  loading 
}: ConditionalAuthProps) {
  const { authenticated: isAuth, loading: isLoading } = useRequireAuth()

  if (isLoading && loading) {
    return <>{loading}</>
  }

  if (isAuth && authenticated) {
    return <>{authenticated}</>
  }

  if (!isAuth && unauthenticated) {
    return <>{unauthenticated}</>
  }

  return <>{children}</>
}

/**
 * Hook for creating protected pages
 */
export function useProtectedPage(redirectTo = '/auth/login') {
  const router = useRouter()
  const { authenticated, loading } = useRequireAuth()

  useEffect(() => {
    if (!loading && !authenticated) {
      const currentPath = window.location.pathname
      const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`
      router.push(redirectUrl)
    }
  }, [authenticated, loading, router, redirectTo])

  return { authenticated, loading }
} 