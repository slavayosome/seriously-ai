import { createClient } from '../supabase/client'
import { 
  AUTH_CONFIG, 
  AccountLinkingResult,
  AuthResult, 
  LinkAccountOptions,
  SignInWithEmailOptions,
  SignInWithOAuthOptions,
  isValidEmail,
  mapAuthError 
} from '@seriously-ai/shared'

/**
 * Send OTP to user's email for authentication
 * OTP expires after 1 hour as configured in Supabase
 */
export async function signInWithOTP(
  options: SignInWithEmailOptions
): Promise<AuthResult> {
  try {
    if (!isValidEmail(options.email)) {
      return {
        success: false,
        error: 'Please enter a valid email address',
      }
    }

    const supabase = createClient()
    
    const { error } = await supabase.auth.signInWithOtp({
      email: options.email,
      options: {
        shouldCreateUser: true,
        data: {
          // Include metadata for user profile creation
          onboarding_completed: false,
        },
      },
    })

    if (error) {
      return {
        success: false,
        error: mapAuthError(error),
      }
    }

    return {
      success: true,
      message: `We sent a 6-digit code to ${options.email}. Please check your inbox and enter the code to continue.`,
    }
  } catch (error) {
    return {
      success: false,
      error: mapAuthError(error as Error),
    }
  }
}

/**
 * Verify OTP code for authentication
 */
export async function verifyOTP(email: string, token: string): Promise<AuthResult> {
  try {
    if (!isValidEmail(email)) {
      return {
        success: false,
        error: 'Please enter a valid email address',
      }
    }

    if (!token || token.length !== 6) {
      return {
        success: false,
        error: 'Please enter a valid 6-digit code',
      }
    }

    const supabase = createClient()
    
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })

    if (error) {
      return {
        success: false,
        error: mapAuthError(error),
      }
    }

    if (!data.session) {
      return {
        success: false,
        error: 'Authentication failed. Please try again.',
      }
    }

    return {
      success: true,
      message: 'Successfully authenticated!',
      user: data.user,
      session: data.session,
    }
  } catch (error) {
    return {
      success: false,
      error: mapAuthError(error as Error),
    }
  }
}

/**
 * Resend OTP to user's email
 */
export async function resendOTP(email: string): Promise<AuthResult> {
  return signInWithOTP({ email })
}

/**
 * Sign in with Google OAuth with profile sync
 */
export async function signInWithGoogle(
  options: SignInWithOAuthOptions = { provider: 'google' }
): Promise<AuthResult> {
  try {
    const supabase = createClient()
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: options.provider,
      options: {
        redirectTo: options.redirectTo || AUTH_CONFIG.emailRedirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        // Request additional scopes for profile information
        scopes: 'email profile',
      },
    })

    if (error) {
      return {
        success: false,
        error: mapAuthError(error),
      }
    }

    // OAuth redirect will happen automatically
    return {
      success: true,
      message: 'Redirecting to Google for authentication...',
    }
  } catch (error) {
    return {
      success: false,
      error: mapAuthError(error as Error),
    }
  }
}

/**
 * Sync user profile data from auth metadata
 * This function can be called after OAuth sign-in to ensure profile is up-to-date
 */
export async function syncUserProfile(): Promise<AuthResult> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    // Get current profile
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Prepare profile updates from auth metadata
    const updates: Record<string, string | boolean | null> = {}
    
    // Sync display name from auth metadata (Google or user metadata)
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
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) {
        return {
          success: false,
          error: error.message,
        }
      }

      return {
        success: true,
        message: `Profile synced with ${Object.keys(updates).length} field(s) updated`,
      }
    }

    return {
      success: true,
      message: 'Profile is already up-to-date',
    }
  } catch (error) {
    return {
      success: false,
      error: mapAuthError(error as Error),
    }
  }
}

/**
 * Sign out the current user
 * Enhanced version with session invalidation
 */
export async function signOut(): Promise<AuthResult> {
  try {
    const supabase = createClient()
    
    // Get current session info before logout (for potential logging)
    const { data: { session } } = await supabase.auth.getSession()
    
    // Note: session info could be used for logout analytics if needed
    void session

    // Perform the actual logout
    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        success: false,
        error: mapAuthError(error),
      }
    }

    // Clear local storage and cache
    await clearLocalAuthDataSync()

    return {
      success: true,
      message: 'Successfully signed out',
    }
  } catch (error) {
    return {
      success: false,
      error: mapAuthError(error as Error),
    }
  }
}

/**
 * Clear local authentication data synchronously
 * Removes tokens, user data, and cached auth information
 */
async function clearLocalAuthDataSync(): Promise<void> {
  try {
    if (typeof window === 'undefined') return

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

    // Clear sessionStorage
    if (window.sessionStorage) {
      const sessionKeys = [
        'temp-auth-data',
        'oauth-state',
        'auth-redirect',
        'session-warning-shown'
      ]

      sessionKeys.forEach(key => {
        try {
          sessionStorage.removeItem(key)
        } catch (error) {
          console.warn(`Failed to clear sessionStorage key: ${key}`, error)
        }
      })
    }

    // Clear any custom cache implementations
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys()
        const authCaches = cacheNames.filter(name => 
          name.includes('auth') || name.includes('session') || name.includes('user')
        )
        
        await Promise.all(
          authCaches.map(cacheName => caches.delete(cacheName))
        )
      } catch (error) {
        console.warn('Failed to clear caches:', error)
      }
    }
  } catch (error) {
    console.warn('Error clearing local auth data:', error)
  }
}

/**
 * Get current user session
 */
export async function getCurrentUser() {
  try {
    const supabase = createClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      throw error
    }

    return user
  } catch (error) {
    return null
  }
}

/**
 * Get current session
 */
export async function getCurrentSession() {
  try {
    const supabase = createClient()
    
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      throw error
    }

    return session
  } catch (error) {
    console.error('Error getting current session:', error)
    return null
  }
}

/**
 * Link an OAuth provider to the current user's account
 */
export async function linkOAuthAccount(
  options: LinkAccountOptions
): Promise<AccountLinkingResult> {
  try {
    const supabase = createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'You must be logged in to link accounts',
      }
    }

    // Start OAuth linking flow
    const { error } = await supabase.auth.linkIdentity({
      provider: options.provider,
      options: {
        redirectTo: options.redirectTo || AUTH_CONFIG.emailRedirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      return {
        success: false,
        error: mapAuthError(error),
      }
    }

    return {
      success: true,
      message: `Redirecting to ${options.provider} to link your account...`,
      linkedProvider: options.provider,
    }
  } catch (error) {
    return {
      success: false,
      error: mapAuthError(error as Error),
    }
  }
}

/**
 * Unlink an OAuth provider from the current user's account
 */
export async function unlinkOAuthAccount(
  provider: 'google'
): Promise<AccountLinkingResult> {
  try {
    const supabase = createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'You must be logged in to unlink accounts',
      }
    }

    // Get user identities to find the one to unlink
    const identities = user.identities || []
    const providerIdentity = identities.find(identity => identity.provider === provider)
    
    if (!providerIdentity) {
      return {
        success: false,
        error: `No ${provider} account is linked to your profile`,
      }
    }

    // Check if user has at least one other way to sign in
    const emailIdentity = identities.find(identity => identity.provider === 'email')
    if (identities.length === 1 && !emailIdentity) {
      return {
        success: false,
        error: 'Cannot unlink the only authentication method. Please set up email authentication first.',
      }
    }

    const { error } = await supabase.auth.unlinkIdentity(providerIdentity)

    if (error) {
      return {
        success: false,
        error: mapAuthError(error),
      }
    }

    return {
      success: true,
      message: `Successfully unlinked your ${provider} account`,
      linkedProvider: provider,
    }
  } catch (error) {
    return {
      success: false,
      error: mapAuthError(error as Error),
    }
  }
}

/**
 * Get all linked identities for the current user
 */
export async function getLinkedIdentities(): Promise<{
  success: boolean
  identities?: Array<{
    id: string
    provider: string
    created_at?: string
    identity_data?: Record<string, unknown>
  }>
  error?: string
}> {
  try {
    const supabase = createClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return {
        success: false,
        error: 'You must be logged in to view linked accounts',
      }
    }

    return {
      success: true,
      identities: user.identities || [],
    }
  } catch (error) {
    return {
      success: false,
      error: mapAuthError(error as Error),
    }
  }
}

/**
 * Check if a specific provider is linked to the current user
 */
export async function isProviderLinked(provider: string): Promise<boolean> {
  try {
    const result = await getLinkedIdentities()
    
    if (!result.success || !result.identities) {
      return false
    }

    return result.identities.some(identity => identity.provider === provider)
  } catch (error) {
    console.error('Error checking if provider is linked:', error)
    return false
  }
}

/**
 * Check if user has email authentication set up
 */
export async function hasEmailAuth(): Promise<boolean> {
  return isProviderLinked('email')
}

/**
 * Get primary email for account linking verification
 */
export async function getPrimaryEmail(): Promise<string | null> {
  try {
    const supabase = createClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    return user.email || null
  } catch (error) {
    console.error('Error getting primary email:', error)
    return null
  }
}

/**
 * Force session refresh - useful for extending session duration
 */
export async function forceRefreshSession(): Promise<AuthResult> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.refreshSession()

    if (error) {
      return {
        success: false,
        error: mapAuthError(error),
      }
    }

    return {
      success: true,
      message: 'Session refreshed successfully',
      session: data.session,
      user: data.user,
    }
  } catch (error) {
    return {
      success: false,
      error: mapAuthError(error as Error),
    }
  }
}

/**
 * Check if current session is still valid (not expired)
 */
export async function isSessionValid(): Promise<boolean> {
  try {
    const supabase = createClient()
    
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      return false
    }

    // Check if session is expired
    const now = Math.floor(Date.now() / 1000)
    const expiresAt = session.expires_at || 0
    
    return expiresAt > now
  } catch (error) {
    console.error('Error checking session validity:', error)
    return false
  }
}

/**
 * Get session expiry information
 */
export async function getSessionExpiry(): Promise<{
  expiresAt: number
  timeRemaining: number
  isExpired: boolean
} | null> {
  try {
    const supabase = createClient()
    
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      return null
    }

    const now = Math.floor(Date.now() / 1000)
    const expiresAt = session.expires_at || 0
    const timeRemaining = Math.max(0, expiresAt - now)
    
    return {
      expiresAt,
      timeRemaining,
      isExpired: timeRemaining <= 0,
    }
  } catch (error) {
    console.error('Error getting session expiry:', error)
    return null
  }
} 