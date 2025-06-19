import { SESSION_CONFIG } from '@seriously-ai/shared'
import { createClient } from '../supabase/client'

export interface SessionInfo {
  isValid: boolean
  isExpired: boolean
  timeToExpiry: number
  sessionAge: number
  shouldRefresh: boolean
  user?: any
  session?: any
}

/**
 * Get detailed session information including expiry and refresh status
 */
export async function getSessionInfo(): Promise<SessionInfo> {
  try {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
      return {
        isValid: false,
        isExpired: true,
        timeToExpiry: 0,
        sessionAge: 0,
        shouldRefresh: false,
      }
    }

    const now = Math.floor(Date.now() / 1000)
    const expiresAt = session.expires_at || 0
    const timeToExpiry = expiresAt - now
    
    // Calculate session age (when it was first created)
    const sessionCreatedAt = session.user?.created_at 
      ? Math.floor(new Date(session.user.created_at).getTime() / 1000)
      : now
    
    const sessionAge = now - sessionCreatedAt
    
    // Check if session is within 7-day timebox
    const withinTimebox = sessionAge < SESSION_CONFIG.sessionTimeboxDuration
    
    // Check if we should refresh (when token expires in less than 5 minutes)
    const shouldRefresh = timeToExpiry < 300 // 5 minutes
    
    return {
      isValid: timeToExpiry > 0 && withinTimebox,
      isExpired: timeToExpiry <= 0 || !withinTimebox,
      timeToExpiry,
      sessionAge,
      shouldRefresh,
      user: session.user,
      session,
    }
  } catch (error) {
    console.error('Error getting session info:', error)
    return {
      isValid: false,
      isExpired: true,
      timeToExpiry: 0,
      sessionAge: 0,
      shouldRefresh: false,
    }
  }
}

/**
 * Manually refresh the current session
 */
export async function refreshSession(): Promise<{
  success: boolean
  error?: string
  session?: any
}> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.refreshSession()

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      session: data.session,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Check if session needs to be refreshed and do it automatically
 */
export async function ensureValidSession(): Promise<{
  success: boolean
  refreshed: boolean
  error?: string
}> {
  try {
    const sessionInfo = await getSessionInfo()
    
    if (!sessionInfo.isValid && sessionInfo.isExpired) {
      return {
        success: false,
        refreshed: false,
        error: 'Session expired and cannot be refreshed',
      }
    }
    
    if (sessionInfo.shouldRefresh) {
      const refreshResult = await refreshSession()
      
      if (!refreshResult.success) {
        return {
          success: false,
          refreshed: false,
          error: refreshResult.error,
        }
      }
      
      return {
        success: true,
        refreshed: true,
      }
    }
    
    return {
      success: sessionInfo.isValid,
      refreshed: false,
    }
  } catch (error) {
    return {
      success: false,
      refreshed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Format session duration for display
 */
export function formatSessionDuration(seconds: number): string {
  if (seconds <= 0) return 'Expired'
  
  const days = Math.floor(seconds / (24 * 60 * 60))
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60))
  const minutes = Math.floor((seconds % (60 * 60)) / 60)
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

/**
 * Set up automatic session refresh
 * This will check session status periodically and refresh when needed
 */
export function setupAutoRefresh(intervalMs: number = 5 * 60 * 1000): () => void {
  const interval = setInterval(async () => {
    try {
      await ensureValidSession()
    } catch (error) {
      console.error('Auto-refresh failed:', error)
    }
  }, intervalMs)
  
  // Return cleanup function
  return () => clearInterval(interval)
}

/**
 * Get session expiry warning message based on time remaining
 */
export function getSessionWarning(timeToExpiry: number): string | null {
  const minutes = Math.floor(timeToExpiry / 60)
  
  if (minutes <= 5) {
    return 'Your session will expire in less than 5 minutes. Please save your work.'
  } else if (minutes <= 15) {
    return 'Your session will expire soon. Please save your work.'
  } else if (minutes <= 60) {
    return 'Your session will expire in less than an hour.'
  }
  
  return null
} 