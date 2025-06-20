import { useCallback, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { createClient } from '../lib/supabase/client'
import { ClientAuthHelpers, UniversalAuthHelpers } from '../lib/auth/client-helpers'
import { signOut } from '../lib/auth/service'

/**
 * Hook for authentication state
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshAuth = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [currentUser, currentSession] = await Promise.all([
        ClientAuthHelpers.getCurrentUser(),
        ClientAuthHelpers.getCurrentSession()
      ])
      
      setUser(currentUser)
      setSession(currentSession)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication error')
      setUser(null)
      setSession(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshAuth()

    // Listen for auth changes
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setSession(null)
        }
      }
    )

    // Setup automatic logout monitoring with dynamic import
    let cleanupAutoLogout: (() => void) | undefined

    const setupLogoutMonitoring = async () => {
      try {
        const { setupAutoLogout } = await import('../lib/auth/logout')
        cleanupAutoLogout = setupAutoLogout()
      } catch (error) {
        console.warn('Failed to setup auto logout:', error)
      }
    }

    setupLogoutMonitoring()

    return () => {
      subscription.unsubscribe()
      if (cleanupAutoLogout) {
        cleanupAutoLogout()
      }
    }
  }, [refreshAuth])

  const logout = useCallback(async () => {
    try {
      setLoading(true)
      const result = await signOut()
      
      if (result.success) {
        setUser(null)
        setSession(null)
      } else {
        setError(result.error || 'Logout failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout error')
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    user,
    session,
    loading,
    error,
    isAuthenticated: !!user,
    refreshAuth,
    logout,
  }
}

/**
 * Hook for authentication loading state
 */
export function useAuthLoading() {
  const { loading } = useAuth()
  return loading
}

/**
 * Hook for requiring authentication
 */
export function useRequireAuth() {
  const { user, loading, error } = useAuth()
  
  return {
    authenticated: !!user,
    loading,
    error,
    shouldRedirect: !loading && !user,
  }
}

/**
 * Hook for user profile data
 */
export function useUserProfile() {
  const [profile, setProfile] = useState<{ id: string; email?: string; display_name?: string; avatar_url?: string; created_at?: string; updated_at?: string; onboarding_completed?: boolean } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const profileData = await ClientAuthHelpers.getUserProfile()
      setProfile(profileData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profile fetch error')
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [user])

  const updateProfile = useCallback(async (updates: Record<string, unknown>) => {
    try {
      setError(null)
      const result = await ClientAuthHelpers.updateUserProfile(updates)
      
      if (result.success) {
        await refreshProfile()
        return result
      } else {
        setError(result.error || 'Update failed')
        return result
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Update error'
      setError(error)
      return { success: false, error }
    }
  }, [refreshProfile])

  useEffect(() => {
    refreshProfile()
  }, [refreshProfile])

  return {
    profile,
    loading,
    error,
    refreshProfile,
    updateProfile,
    hasCompletedOnboarding: profile?.onboarding_completed === true,
  }
}

/**
 * Hook for user roles and permissions
 */
export function useUserRole() {
  const [roles, setRoles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setRoles([])
      setLoading(false)
      return
    }

    const userRoles = []
    if (user.user_metadata?.role) userRoles.push(user.user_metadata.role)
    if (user.app_metadata?.role) userRoles.push(user.app_metadata.role)
    
    setRoles(userRoles)
    setLoading(false)
  }, [user])

  const hasRole = useCallback((role: string) => {
    return roles.includes(role)
  }, [roles])

  const hasAnyRole = useCallback((roleList: string[]) => {
    return roleList.some(role => roles.includes(role))
  }, [roles])

  const hasAllRoles = useCallback((roleList: string[]) => {
    return roleList.every(role => roles.includes(role))
  }, [roles])

  return {
    roles,
    loading,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isAdmin: hasRole('admin'),
    isPremium: hasRole('premium'),
  }
}

/**
 * Hook for user display information
 */
export function useUserDisplay() {
  const { user } = useAuth()

  return {
    displayName: UniversalAuthHelpers.getDisplayName(user),
    avatarUrl: UniversalAuthHelpers.getAvatarUrl(user),
    isEmailVerified: UniversalAuthHelpers.isEmailVerified(user),
    authProviders: UniversalAuthHelpers.getAuthProviders(user),
    lastSignIn: UniversalAuthHelpers.formatLastSignIn(user),
    isNewUser: UniversalAuthHelpers.isNewUser(user),
    hasGoogleAuth: UniversalAuthHelpers.hasAuthProvider(user, 'google'),
    hasEmailAuth: UniversalAuthHelpers.hasAuthProvider(user, 'email'),
  }
}

/**
 * Hook for authentication checks and redirects
 */
export function useAuthGuard() {
  const { isAuthenticated, loading } = useAuth()

  const requireAuth = useCallback((redirectPath?: string) => {
    if (!loading && !isAuthenticated) {
      ClientAuthHelpers.redirectToLogin(redirectPath)
      return false
    }
    return true
  }, [isAuthenticated, loading])

  const redirectIfAuthenticated = useCallback((redirectTo: string = '/dashboard') => {
    if (!loading && isAuthenticated) {
      window.location.href = redirectTo
      return true
    }
    return false
  }, [isAuthenticated, loading])

  return {
    requireAuth,
    redirectIfAuthenticated,
    isReady: !loading,
    isAuthenticated,
  }
}

/**
 * Hook for session management
 */
export function useSession() {
  const { session } = useAuth()
  const [sessionInfo, setSessionInfo] = useState<{
    isValid: boolean
    isExpired: boolean
    timeToExpiry: number
    shouldRefresh: boolean
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      setSessionInfo(null)
      setLoading(false)
      return
    }

    const getSessionInfo = async () => {
      try {
        // Import session utilities
        const { getSessionInfo } = await import('../lib/auth/session')
        const info = await getSessionInfo()
        setSessionInfo(info)
      } catch (error) {
        console.error('Error getting session info:', error)
        setSessionInfo(null)
      } finally {
        setLoading(false)
      }
    }

    getSessionInfo()
  }, [session])

  return {
    session,
    sessionInfo,
    loading,
    isValid: sessionInfo?.isValid ?? false,
    isExpired: sessionInfo?.isExpired ?? true,
    timeToExpiry: sessionInfo?.timeToExpiry ?? 0,
    shouldRefresh: sessionInfo?.shouldRefresh ?? false,
  }
}

/**
 * Hook for handling auth events and profile synchronization
 */
export function useAuthProfileSync() {
  const { user, session } = useAuth()
  const [syncing, setSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  const syncProfileFromAuth = useCallback(async (forceSync = false) => {
    if (!user || !session) return { success: false, error: 'No authenticated user' }

    // Check if we need to sync (don't sync too frequently unless forced)
    if (!forceSync && lastSyncTime && Date.now() - lastSyncTime.getTime() < 60000) {
      return { success: true, message: 'Sync skipped - too frequent' }
    }

    try {
      setSyncing(true)
      
      // Get current profile
      const currentProfile = await ClientAuthHelpers.getUserProfile()
      
      // Prepare profile updates from auth metadata
      const updates: Record<string, unknown> = {}
      
      // Sync display name from auth metadata
      const authDisplayName = user.user_metadata?.full_name || 
                             user.user_metadata?.name ||
                             user.identities?.find(i => i.provider === 'google')?.identity_data?.full_name ||
                             user.identities?.find(i => i.provider === 'google')?.identity_data?.name
                             
      if (authDisplayName && authDisplayName !== currentProfile?.display_name) {
        updates.display_name = authDisplayName
      }
      
      // Sync avatar URL from auth metadata
      const authAvatarUrl = user.user_metadata?.avatar_url ||
                           user.user_metadata?.picture ||
                           user.identities?.find(i => i.provider === 'google')?.identity_data?.avatar_url ||
                           user.identities?.find(i => i.provider === 'google')?.identity_data?.picture
                           
      if (authAvatarUrl && authAvatarUrl !== currentProfile?.avatar_url) {
        updates.avatar_url = authAvatarUrl
      }
      
      // Sync email if changed
      if (user.email && user.email !== currentProfile?.email) {
        updates.email = user.email
      }
      
      // Update profile if there are changes
      if (Object.keys(updates).length > 0) {
        const result = await ClientAuthHelpers.updateUserProfile(updates)
        if (!result.success) {
          return { success: false, error: result.error }
        }
      }
      
      setLastSyncTime(new Date())
      return { 
        success: true, 
        message: `Profile synced${Object.keys(updates).length > 0 ? ` (${Object.keys(updates).length} fields updated)` : ' (no changes)'}`,
        updatedFields: Object.keys(updates)
      }
      
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Profile sync failed' 
      }
    } finally {
      setSyncing(false)
    }
  }, [user, session, lastSyncTime])

  // Auto-sync on auth state changes
  useEffect(() => {
    if (user && session) {
      // Delay to ensure auth state is stable
      const timer = setTimeout(() => {
        syncProfileFromAuth()
      }, 1000)
      
      return () => clearTimeout(timer)
    }
    return undefined
  }, [user, session, syncProfileFromAuth])

  return {
    syncing,
    lastSyncTime,
    syncProfileFromAuth,
  }
}

/**
 * Hook for auth event listeners with profile sync
 */
export function useAuthEvents() {
  const [events, setEvents] = useState<Array<{ event: string, timestamp: Date, details?: { hasSession: boolean } }>>([])
  const { syncProfileFromAuth } = useAuthProfileSync()

  useEffect(() => {
    const supabase = createClient()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Log the event
        setEvents(prev => [
          { event, timestamp: new Date(), details: { hasSession: !!session } },
          ...prev.slice(0, 9) // Keep last 10 events
        ])

        // Handle specific events that require profile sync
        switch (event) {
          case 'SIGNED_IN':
            // Sync profile data from OAuth provider
            await syncProfileFromAuth(true)
            break
            
          case 'TOKEN_REFRESHED':
            // Check if user metadata changed and sync if needed
            await syncProfileFromAuth()
            break
            
          case 'USER_UPDATED':
            // User metadata or identities were updated
            await syncProfileFromAuth(true)
            break
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [syncProfileFromAuth])

  return {
    events,
    clearEvents: () => setEvents([]),
  }
} 