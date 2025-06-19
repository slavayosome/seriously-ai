import { Session, User } from '@supabase/supabase-js'
import { createClient } from '../supabase/client'
import { createClient as createServerClient } from '../supabase/server'
import { AuthResult } from '@seriously-ai/shared'

/**
 * Client-side auth helpers
 */
export class AuthHelpers {
  /**
   * Check if user is authenticated (client-side)
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
   * Get current user (client-side)
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
   * Get current session (client-side)
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
   * Check if user has specific role or permission
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
   * Get user profile data
   */
  static async getUserProfile(): Promise<{ id: string; email?: string; display_name?: string; avatar_url?: string; created_at?: string; updated_at?: string; onboarding_completed?: boolean } | null> {
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
   * Update user profile
   */
  static async updateUserProfile(updates: Record<string, string | boolean | null>): Promise<AuthResult> {
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
   * Check if user has completed onboarding
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
 * Server-side auth helpers
 */
export class ServerAuthHelpers {
  /**
   * Check if user is authenticated (server-side)
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const supabase = await createServerClient()
      const { data: { session } } = await supabase.auth.getSession()
      return !!session?.user
    } catch (error) {
      console.error('Error checking authentication:', error)
      return false
    }
  }

  /**
   * Get current user (server-side)
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const supabase = await createServerClient()
      const { data: { user } } = await supabase.auth.getUser()
      return user
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  /**
   * Get current session (server-side)
   */
  static async getCurrentSession(): Promise<Session | null> {
    try {
      const supabase = await createServerClient()
      const { data: { session } } = await supabase.auth.getSession()
      return session
    } catch (error) {
      console.error('Error getting current session:', error)
      return null
    }
  }

  /**
   * Require authentication (throw if not authenticated)
   */
  static async requireAuth(): Promise<User> {
    const user = await this.getCurrentUser()
    if (!user) {
      throw new Error('Authentication required')
    }
    return user
  }

  /**
   * Check if user has specific role or permission (server-side)
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
   * Require specific role (throw if user doesn't have role)
   */
  static async requireRole(role: string): Promise<User> {
    const user = await this.requireAuth()
    const hasRequiredRole = await this.hasRole(role)
    
    if (!hasRequiredRole) {
      throw new Error(`Access denied: ${role} role required`)
    }
    
    return user
  }

  /**
   * Get user profile data (server-side)
   */
  static async getUserProfile(): Promise<{ id: string; email?: string; display_name?: string; avatar_url?: string; created_at?: string; updated_at?: string; onboarding_completed?: boolean } | null> {
    try {
      const supabase = await createServerClient()
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
   * Create or update user profile on auth events
   */
  static async upsertUserProfile(user: User): Promise<void> {
    try {
      const supabase = await createServerClient()
      
      const profileData = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name,
        avatar_url: user.user_metadata?.avatar_url,
        provider: user.app_metadata?.provider,
        onboarding_completed: user.user_metadata?.onboarding_completed || false,
        plan_tier: 'starter', // Default plan
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('user_profiles')
        .upsert(profileData, {
          onConflict: 'id',
          ignoreDuplicates: false
        })

      if (error) {
        console.error('Error upserting user profile:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in upsertUserProfile:', error)
      throw error
    }
  }

  /**
   * Check if user has sufficient credits for operation
   */
  static async hasCredits(requiredCredits: number = 1): Promise<boolean> {
    try {
      const supabase = await createServerClient()
      const user = await this.getCurrentUser()
      
      if (!user) return false

      const { data, error } = await supabase
        .from('credit_wallet')
        .select('balance')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Error checking credit balance:', error)
        return false
      }

      return (data?.balance || 0) >= requiredCredits
    } catch (error) {
      console.error('Error checking credits:', error)
      return false
    }
  }

  /**
   * Get user's credit balance
   */
  static async getCreditBalance(): Promise<number> {
    try {
      const supabase = await createServerClient()
      const user = await this.getCurrentUser()
      
      if (!user) return 0

      const { data, error } = await supabase
        .from('credit_wallet')
        .select('balance')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Error getting credit balance:', error)
        return 0
      }

      return data?.balance || 0
    } catch (error) {
      console.error('Error getting credit balance:', error)
      return 0
    }
  }
}

/**
 * Universal helpers that work on both client and server
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

// Export default combined helpers
export const authHelpers = {
  client: AuthHelpers,
  server: ServerAuthHelpers,
  universal: UniversalAuthHelpers,
} 