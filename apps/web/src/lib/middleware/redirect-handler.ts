import { NextResponse, type NextRequest } from 'next/server'
import { ProtectionLevel } from './route-config'

/**
 * Redirect reasons for better user experience and analytics
 */
export enum RedirectReason {
  // Authentication failures
  UNAUTHENTICATED = 'unauthenticated',
  SESSION_EXPIRED = 'session-expired',
  INVALID_SESSION = 'invalid-session',
  
  // Authorization failures  
  INSUFFICIENT_CREDITS = 'insufficient-credits',
  NO_CREDITS = 'no-credits',
  PLAN_UPGRADE_REQUIRED = 'plan-upgrade-required',
  FEATURE_NOT_AVAILABLE = 'feature-not-available',
  
  // System errors
  MIDDLEWARE_ERROR = 'middleware-error',
  DATABASE_ERROR = 'database-error',
  SYSTEM_ERROR = 'system-error',
  
  // User flow redirects
  EMAIL_VERIFICATION_REQUIRED = 'email-verification-required',
  ACCOUNT_SETUP_INCOMPLETE = 'account-setup-incomplete'
}

/**
 * Redirect configuration for different scenarios
 */
export interface RedirectConfig {
  destination: string
  reason: RedirectReason
  message?: string
  preserveQuery?: boolean
  statusCode?: number
}

/**
 * Enhanced redirect handler for middleware
 */
export class RedirectHandler {
  
  /**
   * Create a redirect response with enhanced query parameters and context
   */
  static createRedirect(
    request: NextRequest,
    config: RedirectConfig,
    originalPath?: string
  ): NextResponse {
    const { destination, reason, message, preserveQuery = false, statusCode = 307 } = config
    
    // Create the redirect URL
    const redirectUrl = new URL(destination, request.url)
    
    // Add the original path for redirect after authentication
    if (originalPath && originalPath !== '/') {
      redirectUrl.searchParams.set('redirectTo', originalPath)
    }
    
    // Add redirect reason for better UX
    redirectUrl.searchParams.set('reason', reason)
    
    // Add custom message if provided
    if (message) {
      redirectUrl.searchParams.set('message', encodeURIComponent(message))
    }
    
    // Preserve original query parameters if requested
    if (preserveQuery && request.nextUrl.search) {
      const originalParams = new URLSearchParams(request.nextUrl.search)
      originalParams.forEach((value, key) => {
        if (!redirectUrl.searchParams.has(key)) {
          redirectUrl.searchParams.set(key, value)
        }
      })
    }
    
    // Add timestamp for debugging and analytics
    redirectUrl.searchParams.set('ts', Date.now().toString())
    
    return NextResponse.redirect(redirectUrl, statusCode)
  }

  /**
   * Handle unauthenticated user redirects
   */
  static handleUnauthenticated(
    request: NextRequest,
    protectionLevel: ProtectionLevel,
    originalPath: string,
    reason: RedirectReason = RedirectReason.UNAUTHENTICATED
  ): NextResponse {
    // Determine the best login flow based on the original destination
    const destination = this.getOptimalLoginRoute(originalPath, protectionLevel)
    
    const message = this.getRedirectMessage(reason, protectionLevel)
    
    return this.createRedirect(request, {
      destination,
      reason,
      message,
      statusCode: 302 // Temporary redirect for auth flows
    }, originalPath)
  }

  /**
   * Handle insufficient credits redirects
   */
  static handleInsufficientCredits(
    request: NextRequest,
    originalPath: string,
    userPlan?: string,
    creditDetails?: {
      operation: string
      required: number
      current: number
    }
  ): NextResponse {
    const destination = '/dashboard'
    const reason = creditDetails?.current === 0 
      ? RedirectReason.NO_CREDITS 
      : RedirectReason.INSUFFICIENT_CREDITS
    
    // Create redirect with upgrade context
    const redirectUrl = new URL(destination, request.url)
    redirectUrl.searchParams.set('upgrade', 'true')
    redirectUrl.searchParams.set('reason', reason)
    redirectUrl.searchParams.set('source', originalPath)
    
    if (userPlan) {
      redirectUrl.searchParams.set('currentPlan', userPlan)
    }
    
    // Add specific feature context
    const feature = this.getFeatureFromPath(originalPath)
    if (feature) {
      redirectUrl.searchParams.set('feature', feature)
    }
    
    // Add credit details for better UX
    if (creditDetails) {
      redirectUrl.searchParams.set('operation', creditDetails.operation)
      redirectUrl.searchParams.set('creditsRequired', creditDetails.required.toString())
      redirectUrl.searchParams.set('creditsAvailable', creditDetails.current.toString())
    }
    
    return NextResponse.redirect(redirectUrl, 302)
  }

  /**
   * Handle session-related errors
   */
  static handleSessionError(
    request: NextRequest,
    originalPath: string,
    error: any
  ): NextResponse {
    console.error('Session error in middleware:', error)
    
    // Determine if it's an expired session or invalid session
    const reason = error?.message?.includes('expired') 
      ? RedirectReason.SESSION_EXPIRED 
      : RedirectReason.INVALID_SESSION
    
    return this.handleUnauthenticated(request, ProtectionLevel.AUTHENTICATED, originalPath, reason)
  }

  /**
   * Handle middleware errors with appropriate fallbacks
   */
  static handleMiddlewareError(
    request: NextRequest,
    originalPath: string,
    error: any
  ): NextResponse {
    console.error('Middleware error:', error)
    
    // For public routes, allow through with error logging
    if (originalPath === '/' || originalPath.startsWith('/auth/')) {
      return NextResponse.next()
    }
    
    // For protected routes, redirect to login with error context
    return this.createRedirect(request, {
      destination: '/auth/login',
      reason: RedirectReason.MIDDLEWARE_ERROR,
      message: 'A technical error occurred. Please try logging in again.',
      statusCode: 302
    }, originalPath)
  }

  /**
   * Handle plan upgrade required
   */
  static handlePlanUpgradeRequired(
    request: NextRequest,
    originalPath: string,
    userPlan: string,
    requiredPlan?: string,
    feature?: string
  ): NextResponse {
    const destination = '/pricing'
    const reason = RedirectReason.PLAN_UPGRADE_REQUIRED
    
    // Create redirect with upgrade context
    const redirectUrl = new URL(destination, request.url)
    redirectUrl.searchParams.set('upgrade', 'true')
    redirectUrl.searchParams.set('reason', reason)
    redirectUrl.searchParams.set('source', originalPath)
    redirectUrl.searchParams.set('currentPlan', userPlan)
    
    if (requiredPlan) {
      redirectUrl.searchParams.set('requiredPlan', requiredPlan)
    }
    
    if (feature) {
      redirectUrl.searchParams.set('feature', feature)
    }
    
    // Add user-friendly message
    const message = requiredPlan 
      ? `This feature requires ${requiredPlan} plan. Upgrade to continue.`
      : 'This feature is not available in your current plan.'
    
    redirectUrl.searchParams.set('message', encodeURIComponent(message))
    
    return NextResponse.redirect(redirectUrl, 302)
  }

  /**
   * Handle email verification required
   */
  static handleEmailVerificationRequired(
    request: NextRequest,
    userEmail?: string
  ): NextResponse {
    const redirectUrl = new URL('/auth/verify-email', request.url)
    
    if (userEmail) {
      redirectUrl.searchParams.set('email', userEmail)
    }
    
    redirectUrl.searchParams.set('reason', RedirectReason.EMAIL_VERIFICATION_REQUIRED)
    redirectUrl.searchParams.set('message', encodeURIComponent(
      'Please verify your email address to continue using Seriously AI.'
    ))
    
    return NextResponse.redirect(redirectUrl, 302)
  }

  /**
   * Get optimal login route based on destination and context
   */
  private static getOptimalLoginRoute(
    originalPath: string,
    protectionLevel: ProtectionLevel
  ): string {
    // For paid features, suggest sign up to highlight value
    if (protectionLevel === ProtectionLevel.PAID) {
      return '/auth/signup'
    }
    
    // For API routes, always use login
    if (originalPath.startsWith('/api/')) {
      return '/auth/login'
    }
    
    // Default to login for authenticated routes
    return '/auth/login'
  }

  /**
   * Get user-friendly redirect message based on reason and context
   */
  private static getRedirectMessage(
    reason: RedirectReason,
    protectionLevel: ProtectionLevel
  ): string {
    switch (reason) {
      case RedirectReason.UNAUTHENTICATED:
        if (protectionLevel === ProtectionLevel.PAID) {
          return 'Sign up to access AI-powered research and content generation.'
        }
        return 'Please log in to access your dashboard.'
        
      case RedirectReason.SESSION_EXPIRED:
        return 'Your session has expired. Please log in again.'
        
      case RedirectReason.INVALID_SESSION:
        return 'Your session is invalid. Please log in again.'
        
      case RedirectReason.INSUFFICIENT_CREDITS:
        return 'This feature requires credits. Upgrade your plan to continue.'
        
      case RedirectReason.EMAIL_VERIFICATION_REQUIRED:
        return 'Please verify your email address to continue.'
        
      case RedirectReason.MIDDLEWARE_ERROR:
        return 'A technical error occurred. Please try again.'
        
      default:
        return 'Authentication required to continue.'
    }
  }

  /**
   * Extract feature name from path for better upgrade messaging
   */
  private static getFeatureFromPath(path: string): string | null {
    if (path.startsWith('/research')) return 'research'
    if (path.startsWith('/insights')) return 'insights'
    if (path.startsWith('/drafts')) return 'drafts'
    if (path.startsWith('/generate')) return 'content-generation'
    if (path.startsWith('/pipeline')) return 'ai-pipeline'
    if (path.startsWith('/templates')) return 'templates'
    return null
  }

  /**
   * Check if a redirect is needed based on user state
   */
  static shouldRedirect(
    protectionLevel: ProtectionLevel,
    hasValidSession: boolean,
    hasCredits: boolean = true,
    isEmailVerified: boolean = true
  ): {
    shouldRedirect: boolean
    reason?: RedirectReason
  } {
    // Public routes never need redirect
    if (protectionLevel === ProtectionLevel.PUBLIC) {
      return { shouldRedirect: false }
    }
    
    // Check authentication first
    if (!hasValidSession) {
      return { 
        shouldRedirect: true, 
        reason: RedirectReason.UNAUTHENTICATED 
      }
    }
    
    // Check email verification for authenticated routes
    if (!isEmailVerified) {
      return { 
        shouldRedirect: true, 
        reason: RedirectReason.EMAIL_VERIFICATION_REQUIRED 
      }
    }
    
    // Check credits for paid routes
    if (protectionLevel === ProtectionLevel.PAID && !hasCredits) {
      return { 
        shouldRedirect: true, 
        reason: RedirectReason.INSUFFICIENT_CREDITS 
      }
    }
    
    return { shouldRedirect: false }
  }
}

/**
 * Export commonly used redirect functions
 */
export const {
  handleUnauthenticated,
  handleInsufficientCredits,
  handleSessionError,
  handleMiddlewareError,
  handleEmailVerificationRequired
} = RedirectHandler 