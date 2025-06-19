import { AuthError } from '@supabase/supabase-js'

export interface AuthResult {
  success: boolean
  error?: string
  message?: string
  user?: any // Supabase User type
  session?: any // Supabase Session type
}

export interface SignInWithEmailOptions {
  email: string
  redirectTo?: string
}

export interface SignInWithOAuthOptions {
  provider: 'google'
  redirectTo?: string
}

export interface LinkAccountOptions {
  provider: 'google'
  email?: string
  redirectTo?: string
}

export interface AccountLinkingResult {
  success: boolean
  error?: string
  message?: string
  linkedProvider?: string
  identities?: any[] // Supabase Identity type
}

export interface SessionConfig {
  jwtExpiry: number // Access token expiry in seconds
  sessionTimeboxDuration: number // Max session lifetime in seconds
  refreshTokenRotation: boolean // Enable refresh token rotation
  inactivityTimeout?: number // Session timeout due to inactivity in seconds
}

export interface EmailAuthConfig {
  linkExpiration: number // in seconds, default 15 minutes
  emailRedirectTo?: string
}

// Auth helper result types
export interface ProfileUpdateResult {
  success: boolean
  error?: string
  message?: string
  profile?: any
}

export interface CreditCheckResult {
  hasCredits: boolean
  balance: number
  required: number
}

export interface AuthGuardResult {
  isAllowed: boolean
  reason?: string
  redirectTo?: string
}

// User role and permission types
export type UserRole = 'admin' | 'premium' | 'user' | 'starter'
export type AuthProvider = 'google' | 'email' | 'anonymous'

export interface UserPermissions {
  canCreateReports: boolean
  canAccessPremiumFeatures: boolean
  canManageAccount: boolean
  maxCreditsPerMonth: number
  maxReportsPerMonth: number
}

// Plan tiers
export const PLAN_TIERS = {
  starter: {
    name: 'Starter',
    creditsPerMonth: 50,
    reportsPerMonth: 5,
    features: ['basic_reports', 'email_support']
  },
  premium: {
    name: 'Premium',
    creditsPerMonth: 500,
    reportsPerMonth: 50,
    features: ['basic_reports', 'advanced_reports', 'priority_support', 'api_access']
  },
  enterprise: {
    name: 'Enterprise',
    creditsPerMonth: -1, // unlimited
    reportsPerMonth: -1, // unlimited
    features: ['all_features', 'dedicated_support', 'custom_integrations']
  }
} as const

export type PlanTier = keyof typeof PLAN_TIERS

// Session management constants - 7 day duration as specified in task 2.6
export const SESSION_CONFIG: SessionConfig = {
  jwtExpiry: 60 * 60, // 1 hour (3600 seconds) - recommended default
  sessionTimeboxDuration: 7 * 24 * 60 * 60, // 7 days (604800 seconds)
  refreshTokenRotation: true, // Enable for security
  inactivityTimeout: 24 * 60 * 60, // 24 hours of inactivity
}

export const AUTH_CONFIG: EmailAuthConfig = {
  linkExpiration: 15 * 60, // 15 minutes in seconds
  emailRedirectTo: typeof window !== 'undefined' 
    ? window.location.origin + '/auth/callback'
    : '/auth/callback',
}

export const AUTH_ERRORS = {
  INVALID_EMAIL: 'Please enter a valid email address',
  EMAIL_NOT_FOUND: 'No account found with this email address',
  LINK_EXPIRED: 'Authentication link has expired. Please request a new one',
  TOO_MANY_REQUESTS: 'Too many requests. Please wait before trying again',
  OAUTH_ERROR: 'Authentication failed. Please try again',
  NETWORK_ERROR: 'Network error. Please check your connection and try again',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again',
  ACCOUNT_LINKING_FAILED: 'Failed to link account. Please try again',
  ACCOUNT_ALREADY_LINKED: 'This account is already linked to your profile',
  EMAIL_MISMATCH: 'The email address does not match your current account',
  LINKING_NOT_ALLOWED: 'Account linking is not allowed for this provider',
  INSUFFICIENT_CREDITS: 'Insufficient credits to perform this operation',
  PROFILE_NOT_FOUND: 'User profile not found',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again',
} as const

export function mapAuthError(error: AuthError | Error | null): string {
  if (!error) return AUTH_ERRORS.UNKNOWN_ERROR

  const message = error.message.toLowerCase()

  if (message.includes('invalid_request') || message.includes('invalid email')) {
    return AUTH_ERRORS.INVALID_EMAIL
  }
  
  if (message.includes('email not confirmed') || message.includes('user not found')) {
    return AUTH_ERRORS.EMAIL_NOT_FOUND
  }
  
  if (message.includes('expired') || message.includes('invalid_token')) {
    return AUTH_ERRORS.LINK_EXPIRED
  }
  
  if (message.includes('rate limit') || message.includes('too many')) {
    return AUTH_ERRORS.TOO_MANY_REQUESTS
  }
  
  if (message.includes('oauth') || message.includes('provider')) {
    return AUTH_ERRORS.OAUTH_ERROR
  }
  
  if (message.includes('network') || message.includes('fetch')) {
    return AUTH_ERRORS.NETWORK_ERROR
  }

  // Account linking specific errors
  if (message.includes('already_registered') || message.includes('email_exists') || message.includes('email already in use')) {
    return AUTH_ERRORS.ACCOUNT_ALREADY_LINKED
  }
  
  if (message.includes('linking_failed') || message.includes('identity_already_exists')) {
    return AUTH_ERRORS.ACCOUNT_LINKING_FAILED
  }
  
  if (message.includes('email_mismatch') || message.includes('different email')) {
    return AUTH_ERRORS.EMAIL_MISMATCH
  }
  
  if (message.includes('linking_not_allowed') || message.includes('provider not allowed')) {
    return AUTH_ERRORS.LINKING_NOT_ALLOWED
  }

  // Credit and authorization errors
  if (message.includes('insufficient credits') || message.includes('not enough credits')) {
    return AUTH_ERRORS.INSUFFICIENT_CREDITS
  }

  if (message.includes('unauthorized') || message.includes('access denied')) {
    return AUTH_ERRORS.UNAUTHORIZED
  }

  if (message.includes('session expired') || message.includes('token expired')) {
    return AUTH_ERRORS.SESSION_EXPIRED
  }

  return AUTH_ERRORS.UNKNOWN_ERROR
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Get user permissions based on plan tier
 */
export function getUserPermissions(planTier: PlanTier = 'starter'): UserPermissions {
  const plan = PLAN_TIERS[planTier]
  
  return {
    canCreateReports: true,
    canAccessPremiumFeatures: planTier !== 'starter',
    canManageAccount: true,
    maxCreditsPerMonth: plan.creditsPerMonth,
    maxReportsPerMonth: plan.reportsPerMonth,
  }
}

/**
 * Check if user can perform specific action based on plan
 */
export function canPerformAction(
  planTier: PlanTier = 'starter', 
  action: keyof UserPermissions
): boolean {
  const permissions = getUserPermissions(planTier)
  return permissions[action] as boolean
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong'
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
  
  const strength = errors.length === 0 ? 'strong' : 
                  errors.length <= 2 ? 'medium' : 'weak'
  
  return {
    isValid: errors.length === 0,
    errors,
    strength
  }
} 