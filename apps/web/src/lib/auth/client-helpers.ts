import { Session, User } from '@supabase/supabase-js'
import { createClient } from '../supabase/client'
import { AuthResult } from '@seriously-ai/shared'

/**
 * Client-only auth helpers (no server dependencies)
 * Safe to use in client components and hooks
 */
export class ClientAuthHelpers {
  /**
   * Check if user is authenticated (client-side only)
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      return !!session?.user
    } catch (error) {
      console.error('Error checking authentication:', error)
      return false
    }
  }

  /**
   * Get current user (client-side only)
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      return user
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  /**
   * Get current session (client-side only)
   */
  static async getCurrentSession(): Promise<Session | null> {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      return session
    } catch (error) {
      console.error('Error getting current session:', error)
      return null
    }
  }

  /**
   * Get user profile data (client-side only)
   */
  static async getUserProfile(): Promise<{
    id: string
    email: string
    display_name?: string
    avatar_url?: string
    onboarding_completed?: boolean
  } | null> {
    try {
      const supabase = createClient()
      const user = await this.getCurrentUser()
      
      if (!user) return null

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error getting user profile:', error)
      return null
    }
  }

  /**
   * Update user profile (client-side only)
   */
  static async updateUserProfile(updates: Record<string, unknown>): Promise<AuthResult> {
    try {
      const supabase = createClient()
      const user = await this.getCurrentUser()
      
      if (!user) {
        return {
          success: false,
          error: 'User not authenticated'
        }
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        message: 'Profile updated successfully'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Check if user has completed onboarding (client-side only)
   */
  static async hasCompletedOnboarding(): Promise<boolean> {
    try {
      const profile = await this.getUserProfile()
      return profile?.onboarding_completed === true
    } catch (error) {
      console.error('Error checking onboarding status:', error)
      return false
    }
  }

  /**
   * Check if user has specific role or permission (client-side only)
   */
  static async hasRole(role: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser()
      return user?.user_metadata?.role === role || user?.app_metadata?.role === role
    } catch (error) {
      console.error('Error checking user role:', error)
      return false
    }
  }

  /**
   * Redirect to login if not authenticated
   */
  static redirectToLogin(currentPath?: string): void {
    const redirectUrl = currentPath ? `?redirect=${encodeURIComponent(currentPath)}` : ''
    window.location.href = `/auth/login${redirectUrl}`
  }

  /**
   * Get redirect URL after authentication
   */
  static getRedirectUrl(): string {
    if (typeof window === 'undefined') return '/dashboard'
    
    const urlParams = new URLSearchParams(window.location.search)
    const redirect = urlParams.get('redirect')
    return redirect || '/dashboard'
  }
}

/**
 * Universal helpers that work on both client and server (no dependencies)
 * Safe to use in client components and hooks
 */
export class UniversalAuthHelpers {
  /**
   * Format user display name
   */
  static getDisplayName(user: User | null): string {
    if (!user) return 'Anonymous'
    
    return (
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'User'
    )
  }

  /**
   * Get user avatar URL
   */
  static getAvatarUrl(user: User | null): string | null {
    if (!user) return null
    
    return (
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      null
    )
  }

  /**
   * Check if email is verified
   */
  static isEmailVerified(user: User | null): boolean {
    if (!user) return false
    return !!user.email_confirmed_at
  }

  /**
   * Get user's auth providers
   */
  static getAuthProviders(user: User | null): string[] {
    if (!user || !user.identities) return []
    
    return user.identities
      .map(identity => identity.provider)
      .filter(Boolean)
  }

  /**
   * Check if user signed up with specific provider
   */
  static hasAuthProvider(user: User | null, provider: string): boolean {
    const providers = this.getAuthProviders(user)
    return providers.includes(provider)
  }

  /**
   * Format last sign in time
   */
  static formatLastSignIn(user: User | null): string | null {
    if (!user?.last_sign_in_at) return null
    
    return new Date(user.last_sign_in_at).toLocaleDateString()
  }

  /**
   * Check if user account is recently created (within last 24 hours)
   */
  static isNewUser(user: User | null): boolean {
    if (!user?.created_at) return false
    
    const createdAt = new Date(user.created_at).getTime()
    const now = Date.now()
    const dayInMs = 24 * 60 * 60 * 1000
    
    return (now - createdAt) < dayInMs
  }
} 