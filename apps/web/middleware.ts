import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '@seriously-ai/shared'
import { ProtectionLevel, RouteProtectionMatcher } from './src/lib/middleware/route-config'
import { RedirectHandler, RedirectReason } from './src/lib/middleware/redirect-handler'
import { CreditChecker } from './src/lib/middleware/credit-checker'
import { getOperationFromPath } from './src/lib/middleware/credit-config'
import { PlanAccessChecker } from './src/lib/middleware/plan-access-checker'
import { MiddlewareErrorHandler, ErrorCategory } from './src/lib/middleware/error-handler'
import { PerformanceMonitor } from './src/lib/middleware/performance-monitor'

/**
 * Initialize credit configuration system
 * This runs once when the middleware module is loaded
 */
import('./src/lib/middleware/index').then(({ initializeMiddleware }) => {
  initializeMiddleware().catch(console.error)
})

/**
 * Next.js Middleware for Route Protection
 * Validates Supabase sessions and enforces route-level security
 */

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Helper function to create Supabase client for middleware
 */
function createMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  return { supabase, response }
}

/**
 * Determine route protection level based on pathname
 */
function getRouteProtectionLevel(pathname: string): ProtectionLevel {
  return RouteProtectionMatcher.getProtectionLevel(pathname)
}

/**
 * Enhanced credit validation with operation-specific costs and caching
 */
async function validateCreditsForOperation(
  supabase: ReturnType<typeof createServerClient<Database>>,
  userId: string,
  pathname: string
): Promise<{
  hasCredits: boolean
  reason?: RedirectReason
  details?: {
    operation: string
    required: number
    current: number
    planTier: string
  }
}> {
  try {
    // Determine the operation type from the pathname
    const operation = getOperationFromPath(pathname)
    
    // Check credits using the enhanced credit checker
    const creditResult = await CreditChecker.checkCredits(supabase, userId, operation)
    
    if (!creditResult.hasCredits) {
      return {
        hasCredits: false,
        reason: creditResult.currentBalance === 0 
          ? RedirectReason.NO_CREDITS 
          : RedirectReason.INSUFFICIENT_CREDITS,
        details: {
          operation,
          required: creditResult.requiredCredits,
          current: creditResult.currentBalance,
          planTier: creditResult.planTier
        }
      }
    }
    
    return { hasCredits: true }
    
  } catch (error) {
    console.error('Exception validating credits for operation:', error)
    return {
      hasCredits: false,
      reason: RedirectReason.SYSTEM_ERROR
    }
  }
}

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Generate request ID and start performance monitoring
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const perfContext = PerformanceMonitor.startRequest(
    requestId, 
    pathname, 
    request.headers.get('user-agent') || undefined
  )
  
  // Create Supabase client
  const { supabase, response } = createMiddlewareClient(request)
  
  // Checkpoint: route matching
  PerformanceMonitor.checkpoint(requestId, 'route_match')
  
  // Determine protection level for this route
  const protectionLevel = getRouteProtectionLevel(pathname)
  
  // Public routes - allow access
  if (protectionLevel === ProtectionLevel.PUBLIC) {
    PerformanceMonitor.completeRequest(requestId, protectionLevel)
    return response
  }
  
  try {
    // Checkpoint: auth check
    PerformanceMonitor.checkpoint(requestId, 'auth_check')
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      // Complete monitoring with error
      PerformanceMonitor.completeRequest(requestId, protectionLevel, false, ErrorCategory.AUTH_SESSION_INVALID)
      
      // Handle session errors with proper categorization
      return MiddlewareErrorHandler.handleCategorizedError(
        request,
        sessionError,
        pathname,
        'supabase_auth'
      )
    }
    
    // Check authentication requirements
    if (protectionLevel === ProtectionLevel.AUTHENTICATED || protectionLevel === ProtectionLevel.PAID) {
      if (!session?.user) {
        // Complete monitoring with error
        PerformanceMonitor.completeRequest(requestId, protectionLevel, false, ErrorCategory.AUTH_SESSION_INVALID)
        
        // Create structured error for unauthenticated access
        const error = MiddlewareErrorHandler.createError(
          ErrorCategory.AUTH_SESSION_INVALID,
          null,
          { protectionLevel, pathname }
        )
        
        return MiddlewareErrorHandler.handleError(
          request,
          error,
          pathname,
          protectionLevel
        )
      }
    }
    
    // Check paid operation requirements
    if (protectionLevel === ProtectionLevel.PAID && session?.user) {
      // Checkpoint: credit and plan checks
      PerformanceMonitor.checkpoint(requestId, 'credit_check')
      PerformanceMonitor.checkpoint(requestId, 'plan_check')
      
      // Check both credits and plan access
      const [creditValidation, planAccess] = await Promise.all([
        validateCreditsForOperation(supabase, session.user.id, pathname),
        PlanAccessChecker.checkPathAccess(supabase, session.user.id, pathname)
      ])
      
      // Check plan access first (more specific error)
      if (!planAccess.hasAccess && planAccess.feature) {
        // Complete monitoring with error
        PerformanceMonitor.completeRequest(requestId, protectionLevel, false, ErrorCategory.PLAN_UPGRADE_REQUIRED)
        
        const error = MiddlewareErrorHandler.createError(
          ErrorCategory.PLAN_UPGRADE_REQUIRED,
          null,
          {
            userPlan: planAccess.userPlan,
            requiredPlan: planAccess.requiredPlan,
            feature: planAccess.feature,
            pathname
          }
        )
        
        return MiddlewareErrorHandler.handleError(
          request,
          error,
          pathname,
          protectionLevel
        )
      }
      
      // Then check credits
      if (!creditValidation.hasCredits) {
        // Complete monitoring with error
        PerformanceMonitor.completeRequest(requestId, protectionLevel, false, ErrorCategory.CREDIT_INSUFFICIENT)
        
        const error = MiddlewareErrorHandler.createError(
          ErrorCategory.CREDIT_INSUFFICIENT,
          null,
          {
            userPlan: creditValidation.details?.planTier,
            creditDetails: creditValidation.details ? {
              operation: creditValidation.details.operation,
              required: creditValidation.details.required,
              current: creditValidation.details.current
            } : undefined,
            pathname
          }
        )
        
        const response = MiddlewareErrorHandler.handleError(
          request,
          error,
          pathname,
          protectionLevel
        )
        
        // Add detailed credit information to headers for debugging
        if (creditValidation.details) {
          response.headers.set('x-credit-operation', creditValidation.details.operation)
          response.headers.set('x-credit-required', creditValidation.details.required.toString())
          response.headers.set('x-credit-current', creditValidation.details.current.toString())
          response.headers.set('x-credit-plan', creditValidation.details.planTier)
        }
        
        return response
      }
    }
    
    // Add user info to response headers for downstream consumption
    if (session?.user) {
      response.headers.set('x-user-id', session.user.id)
      response.headers.set('x-user-email', session.user.email || '')
    }
    
    // Add protection level to headers
    response.headers.set('x-protection-level', protectionLevel)
    
    // Add performance monitoring headers
    response.headers.set('x-request-id', requestId)
    
    // Complete monitoring successfully
    PerformanceMonitor.completeRequest(requestId, protectionLevel, true)
    
    return response
    
  } catch (error) {
    // Complete monitoring with error
    PerformanceMonitor.completeRequest(requestId, protectionLevel, false, ErrorCategory.UNKNOWN_ERROR)
    
    // Handle unexpected errors with comprehensive error handling
    return MiddlewareErrorHandler.handleCategorizedError(
      request,
      error,
      pathname,
      'middleware_execution',
      { protectionLevel }
    )
  }
}

/**
 * Configure which routes this middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 