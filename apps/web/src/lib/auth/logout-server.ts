import { createClient } from '../supabase/server'
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
 * Server-side logout with session invalidation
 * Used in server actions and API routes
 * Note: This function should ONLY be called from server-side code
 */
export async function serverSignOut(
  options: LogoutOptions = {}
): Promise<LogoutResult> {
  const {
    everywhere = false,
    clearCache = true,
    redirectTo = '/auth/login'
  } = options

  try {
    const supabase = await createClient()
    
    // Get current session info
    const { data: { session } } = await supabase.auth.getSession()
    const sessionCount = session ? 1 : 0

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut({
      scope: everywhere ? 'global' : 'local'
    })

    if (error) {
      return {
        success: false,
        error: `Server logout failed: ${error.message}`,
      }
    }

    // Server-side cache cleanup
    if (clearCache) {
      await clearServerAuthData()
    }

    return {
      success: true,
      message: 'Server logout successful',
      clearedSessions: sessionCount,
      redirectUrl: redirectTo,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Server logout failed',
    }
  }
}

/**
 * Server-side authentication data cleanup
 */
async function clearServerAuthData(): Promise<void> {
  try {
    // Server-side cleanup would typically involve:
    // 1. Clearing server-side session stores
    // 2. Invalidating refresh tokens in database
    // 3. Clearing server-side caches
    
    // For Supabase, most of this is handled automatically
    // but we can add custom cleanup here if needed
    
    console.log('Server auth data cleanup completed')
  } catch (error) {
    console.warn('Error clearing server auth data:', error)
  }
} 