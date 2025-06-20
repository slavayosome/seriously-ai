import { createClient } from '../supabase/client'
import { Session, User } from '@supabase/supabase-js'

// ============================================================================
// CLIENT-SIDE AUTH HELPERS
// ============================================================================

/**
 * Get the current authenticated user (client-side)
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Error getting current user:', error)
      return null
    }
    
    return user
  } catch (error) {
    console.error('Error in getCurrentUser:', error)
    return null
  }
}

/**
 * Get the current session (client-side)
 */
export async function getCurrentSession(): Promise<Session | null> {
  try {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error getting current session:', error)
      return null
    }
    
    return session
  } catch (error) {
    console.error('Error in getCurrentSession:', error)
    return null
  }
}

/**
 * Check if user is authenticated (client-side)
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}

/**
 * Check if user has a specific email (client-side)
 */
export async function hasEmail(email: string): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.email === email
}

/**
 * Check if user has verified email (client-side)
 */
export async function hasVerifiedEmail(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.email_confirmed_at !== null
}

/**
 * Get user's primary email (client-side)
 */
export async function getUserEmail(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.email || null
}

/**
 * Get user's ID (client-side)
 */
export async function getUserId(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.id || null
}

/**
 * Get user's metadata (client-side)
 */
export async function getUserMetadata(): Promise<Record<string, any> | null> {
  const user = await getCurrentUser()
  return user?.user_metadata || null
}

/**
 * Check if user has a specific OAuth provider linked (client-side)
 */
export async function hasOAuthProvider(provider: string): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  
  return user.identities?.some(identity => identity.provider === provider) || false
}

/**
 * Get all user identities (client-side)
 */
export async function getUserIdentities(): Promise<any[] | null> {
  const user = await getCurrentUser()
  return user?.identities || null
}

/**
 * Sign out user (client-side)
 */
export async function signOutUser(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }
    
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================================
// SHARED UTILITY HELPERS (Client-safe)
// ============================================================================

/**
 * Check if email is valid format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Check if password meets requirements
 */
export function isValidPassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*(),.?":{}|<>'
  
  const allChars = uppercase + lowercase + numbers + symbols
  
  // Ensure at least one character from each category
  let password = ''
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Format user display name
 */
export function formatUserDisplayName(user: User | null): string {
  if (!user) return 'Guest'
  
  // Try user metadata first
  if (user.user_metadata?.full_name) {
    return user.user_metadata.full_name
  }
  
  if (user.user_metadata?.name) {
    return user.user_metadata.name
  }
  
  // Fall back to email
  if (user.email) {
    return user.email.split('@')[0]
  }
  
  return 'User'
}

/**
 * Get user avatar URL
 */
export function getUserAvatarUrl(user: User | null): string | null {
  if (!user) return null
  
  // Try user metadata
  if (user.user_metadata?.avatar_url) {
    return user.user_metadata.avatar_url
  }
  
  if (user.user_metadata?.picture) {
    return user.user_metadata.picture
  }
  
  return null
}

/**
 * Check if user has completed onboarding
 */
export function hasCompletedOnboarding(user: User | null): boolean {
  if (!user) return false
  
  return user.user_metadata?.onboarding_completed === true
}

/**
 * Get user's preferred language/locale
 */
export function getUserLocale(user: User | null): string {
  if (!user) return 'en'
  
  return user.user_metadata?.locale || 'en'
}

/**
 * Check if user is admin
 */
export function isUserAdmin(user: User | null): boolean {
  if (!user) return false
  
  return user.user_metadata?.role === 'admin' || 
         user.app_metadata?.role === 'admin'
}

/**
 * Get user's subscription tier
 */
export function getUserTier(user: User | null): 'free' | 'pro' | 'enterprise' {
  if (!user) return 'free'
  
  return user.user_metadata?.tier || 
         user.app_metadata?.tier || 
         'free'
}

/**
 * Format auth error messages for user display
 */
export function formatAuthError(error: string): string {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'The email or password you entered is incorrect.',
    'Email not confirmed': 'Please check your email and click the confirmation link.',
    'User not found': 'No account found with this email address.',
    'Password is too weak': 'Please choose a stronger password.',
    'Email already registered': 'An account with this email already exists.',
    'Invalid email': 'Please enter a valid email address.',
    'Signup is disabled': 'New account creation is currently disabled.',
    'Too many requests': 'Too many attempts. Please try again later.',
  }
  
  return errorMap[error] || error
}

/**
 * Create redirect URL for auth callbacks
 */
export function createAuthRedirectUrl(path: string = '/dashboard'): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback?redirect_to=${encodeURIComponent(path)}`
  }
  
  // Server-side fallback
  return `/auth/callback?redirect_to=${encodeURIComponent(path)}`
}

/**
 * Check if we're in a client-side environment
 */
export function isClient(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Check if we're in a server-side environment
 */
export function isServer(): boolean {
  return typeof window === 'undefined'
} 