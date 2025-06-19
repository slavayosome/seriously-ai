import { createClient } from '../supabase/client'
import { AuthResult } from '@seriously-ai/shared'

export interface LogoutOptions {
  everywhere?: boolean // Logout from all devices/sessions
  clearCache?: boolean // Clear local storage and cache
  redirectTo?: string // Where to redirect after logout
  silent?: boolean // Don't show notifications
}

export interface LogoutResult extends AuthResult {
  clearedSessions?: number
  redirectUrl?: string
}

/**
 * Comprehensive logout with session invalidation
 * Handles both client and server-side cleanup
 */
export async function signOutWithInvalidation(
  options: LogoutOptions = {}
): Promise<LogoutResult> {
  const {
    everywhere = false,
    clearCache = true,
    redirectTo = '/auth/login',
    silent = false
  } = options

  try {
    const supabase = createClient()
    
    // Get current session info before logout
    const { data: { session } } = await supabase.auth.getSession()
    const sessionCount = session ? 1 : 0

    // Perform the actual logout
    // If everywhere is true, sign out from all sessions
    const { error } = await supabase.auth.signOut({
      scope: everywhere ? 'global' : 'local'
    })

    if (error) {
      return {
        success: false,
        error: `Logout failed: ${error.message}`,
      }
    }

    // Clear local storage and cache if requested
    if (clearCache) {
      await clearLocalAuthData()
    }

    // Clear any auth-related cookies manually if needed
    await clearAuthCookies()

    return {
      success: true,
      message: silent ? undefined : 'Successfully signed out',
      clearedSessions: everywhere ? sessionCount : 1,
      redirectUrl: redirectTo,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Logout failed',
    }
  }
}



/**
 * Force logout - immediately invalidate all sessions
 * Used for security purposes (password change, account compromise, etc.)
 */
export async function forceLogout(reason?: string): Promise<LogoutResult> {
  try {
    // Clear everything possible
    await Promise.all([
      signOutWithInvalidation({ 
        everywhere: true, 
        clearCache: true,
        silent: true 
      }),
      clearLocalAuthData(),
      clearAuthCookies(),
      clearSessionStorage()
    ])

    return {
      success: true,
      message: reason || 'Security logout completed',
      clearedSessions: -1, // Unknown count for forced logout
      redirectUrl: '/auth/login?forced=true',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Force logout failed',
    }
  }
}

/**
 * Logout from all devices/sessions
 * Useful for security purposes
 */
export async function logoutEverywhere(_reason?: string): Promise<LogoutResult> {
  return signOutWithInvalidation({
    everywhere: true,
    clearCache: true,
    redirectTo: '/auth/login?logged_out_everywhere=true'
  })
}

/**
 * Clear local authentication data
 * Removes tokens, user data, and cached auth information
 */
async function clearLocalAuthData(): Promise<void> {
  try {
    // Clear localStorage auth-related data
    const keysToRemove = [
      'supabase.auth.token',
      'sb-auth-token',
      'user-profile',
      'auth-state',
      'session-info'
    ]

    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key)
      } catch (error) {
        console.warn(`Failed to clear localStorage key: ${key}`, error)
      }
    })

    // Clear any custom cache implementations
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      const authCaches = cacheNames.filter(name => 
        name.includes('auth') || name.includes('session') || name.includes('user')
      )
      
      await Promise.all(
        authCaches.map(cacheName => caches.delete(cacheName))
      )
    }
  } catch (error) {
    console.warn('Error clearing local auth data:', error)
  }
}

/**
 * Clear session storage
 */
async function clearSessionStorage(): Promise<void> {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const keysToRemove = [
        'temp-auth-data',
        'oauth-state',
        'auth-redirect',
        'session-warning-shown'
      ]

      keysToRemove.forEach(key => {
        try {
          sessionStorage.removeItem(key)
        } catch (error) {
          console.warn(`Failed to clear sessionStorage key: ${key}`, error)
        }
      })
    }
  } catch (error) {
    console.warn('Error clearing session storage:', error)
  }
}

/**
 * Clear authentication cookies
 * Manually clear auth-related cookies that might persist
 */
async function clearAuthCookies(): Promise<void> {
  try {
    if (typeof document !== 'undefined') {
      // List of auth-related cookie names to clear
      const authCookieNames = [
        'sb-access-token',
        'sb-refresh-token',
        'supabase-auth-token',
        'auth-token',
        'session-id'
      ]

      authCookieNames.forEach(cookieName => {
        // Clear cookie by setting it to expire in the past
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}; secure; samesite=lax`
        // Also try clearing without domain for localhost
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=lax`
      })
    }
  } catch (error) {
    console.warn('Error clearing auth cookies:', error)
  }
}



/**
 * Check if logout is needed due to session expiry
 */
export async function checkLogoutRequired(): Promise<{
  required: boolean
  reason?: string
  action?: 'logout' | 'refresh' | 'force'
}> {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return {
        required: true,
        reason: 'No active session',
        action: 'logout'
      }
    }

    const now = Math.floor(Date.now() / 1000)
    const expiresAt = session.expires_at || 0
    const timeRemaining = expiresAt - now

    // Session expired
    if (timeRemaining <= 0) {
      return {
        required: true,
        reason: 'Session expired',
        action: 'logout'
      }
    }

    // Session about to expire (less than 5 minutes)
    if (timeRemaining < 300) {
      return {
        required: false,
        reason: 'Session expiring soon',
        action: 'refresh'
      }
    }

    return {
      required: false
    }
  } catch (error) {
    return {
      required: true,
      reason: 'Session check failed',
      action: 'force'
    }
  }
}

/**
 * Auto-logout functionality for expired sessions
 */
export async function autoLogoutIfExpired(): Promise<LogoutResult | null> {
  const check = await checkLogoutRequired()
  
  if (check.required) {
    switch (check.action) {
      case 'force':
        return forceLogout(check.reason)
      case 'logout':
        return signOutWithInvalidation({
          clearCache: true,
          redirectTo: '/auth/login?session_expired=true',
          silent: true
        })
      default:
        return null
    }
  }
  
  return null
}

/**
 * Setup automatic logout monitoring
 * Checks for session expiry and logs out automatically
 */
export function setupAutoLogout(
  checkInterval: number = 60000 // 1 minute
): () => void {
  const interval = setInterval(async () => {
    try {
      await autoLogoutIfExpired()
    } catch (error) {
      console.error('Auto-logout check failed:', error)
    }
  }, checkInterval)

  // Return cleanup function
  return () => clearInterval(interval)
} 