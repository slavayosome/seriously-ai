/**
 * Middleware Error Handler
 * Comprehensive error handling with proper HTTP status codes and graceful fallbacks
 */

import { type NextRequest, NextResponse } from 'next/server'
import { RedirectHandler, RedirectReason } from './redirect-handler'
import { ProtectionLevel } from './route-config'

/**
 * Error categories for different types of middleware errors
 */
export enum ErrorCategory {
  // Authentication errors
  AUTH_SESSION_INVALID = 'auth_session_invalid',
  AUTH_SESSION_EXPIRED = 'auth_session_expired',
  AUTH_TOKEN_MALFORMED = 'auth_token_malformed',
  
  // Authorization errors
  INSUFFICIENT_PERMISSIONS = 'insufficient_permissions',
  PLAN_UPGRADE_REQUIRED = 'plan_upgrade_required',
  CREDIT_INSUFFICIENT = 'credit_insufficient',
  FEATURE_NOT_AVAILABLE = 'feature_not_available',
  
  // Database errors
  DATABASE_CONNECTION = 'database_connection',
  DATABASE_QUERY_FAILED = 'database_query_failed',
  DATABASE_TIMEOUT = 'database_timeout',
  
  // System errors
  SUPABASE_ERROR = 'supabase_error',
  NETWORK_ERROR = 'network_error',
  VALIDATION_ERROR = 'validation_error',
  UNKNOWN_ERROR = 'unknown_error',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  TOO_MANY_REQUESTS = 'too_many_requests'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',       // Expected errors (auth required, insufficient credits)
  MEDIUM = 'medium', // Recoverable errors (database timeout, network issues)
  HIGH = 'high',     // Unexpected errors (system failures, unknown errors)
  CRITICAL = 'critical' // Critical system errors requiring immediate attention
}

/**
 * Structured error information
 */
export interface MiddlewareError {
  category: ErrorCategory
  severity: ErrorSeverity
  message: string
  statusCode: number
  userMessage: string
  details?: Record<string, any>
  timestamp: number
  requestId?: string
}

/**
 * Error handling configuration
 */
export const ERROR_CONFIG: Record<ErrorCategory, {
  severity: ErrorSeverity
  statusCode: number
  userMessage: string
  shouldRedirect: boolean
  logLevel: 'error' | 'warn' | 'info'
}> = {
  // Authentication errors
  [ErrorCategory.AUTH_SESSION_INVALID]: {
    severity: ErrorSeverity.LOW,
    statusCode: 401,
    userMessage: 'Please log in to continue',
    shouldRedirect: true,
    logLevel: 'info'
  },
  [ErrorCategory.AUTH_SESSION_EXPIRED]: {
    severity: ErrorSeverity.LOW,
    statusCode: 401,
    userMessage: 'Your session has expired. Please log in again',
    shouldRedirect: true,
    logLevel: 'info'
  },
  [ErrorCategory.AUTH_TOKEN_MALFORMED]: {
    severity: ErrorSeverity.MEDIUM,
    statusCode: 401,
    userMessage: 'Authentication error. Please log in again',
    shouldRedirect: true,
    logLevel: 'warn'
  },
  
  // Authorization errors
  [ErrorCategory.INSUFFICIENT_PERMISSIONS]: {
    severity: ErrorSeverity.LOW,
    statusCode: 403,
    userMessage: 'You do not have permission to access this resource',
    shouldRedirect: true,
    logLevel: 'info'
  },
  [ErrorCategory.PLAN_UPGRADE_REQUIRED]: {
    severity: ErrorSeverity.LOW,
    statusCode: 402,
    userMessage: 'This feature requires a plan upgrade',
    shouldRedirect: true,
    logLevel: 'info'
  },
  [ErrorCategory.CREDIT_INSUFFICIENT]: {
    severity: ErrorSeverity.LOW,
    statusCode: 402,
    userMessage: 'Insufficient credits to perform this action',
    shouldRedirect: true,
    logLevel: 'info'
  },
  [ErrorCategory.FEATURE_NOT_AVAILABLE]: {
    severity: ErrorSeverity.LOW,
    statusCode: 403,
    userMessage: 'This feature is not available in your current plan',
    shouldRedirect: true,
    logLevel: 'info'
  },
  
  // Database errors
  [ErrorCategory.DATABASE_CONNECTION]: {
    severity: ErrorSeverity.HIGH,
    statusCode: 503,
    userMessage: 'Service temporarily unavailable. Please try again later',
    shouldRedirect: false,
    logLevel: 'error'
  },
  [ErrorCategory.DATABASE_QUERY_FAILED]: {
    severity: ErrorSeverity.MEDIUM,
    statusCode: 500,
    userMessage: 'An error occurred processing your request',
    shouldRedirect: false,
    logLevel: 'error'
  },
  [ErrorCategory.DATABASE_TIMEOUT]: {
    severity: ErrorSeverity.MEDIUM,
    statusCode: 504,
    userMessage: 'Request timeout. Please try again',
    shouldRedirect: false,
    logLevel: 'warn'
  },
  
  // System errors
  [ErrorCategory.SUPABASE_ERROR]: {
    severity: ErrorSeverity.HIGH,
    statusCode: 502,
    userMessage: 'Service error. Please try again later',
    shouldRedirect: false,
    logLevel: 'error'
  },
  [ErrorCategory.NETWORK_ERROR]: {
    severity: ErrorSeverity.MEDIUM,
    statusCode: 503,
    userMessage: 'Network error. Please check your connection',
    shouldRedirect: false,
    logLevel: 'warn'
  },
  [ErrorCategory.VALIDATION_ERROR]: {
    severity: ErrorSeverity.LOW,
    statusCode: 400,
    userMessage: 'Invalid request data',
    shouldRedirect: false,
    logLevel: 'warn'
  },
  [ErrorCategory.UNKNOWN_ERROR]: {
    severity: ErrorSeverity.HIGH,
    statusCode: 500,
    userMessage: 'An unexpected error occurred',
    shouldRedirect: false,
    logLevel: 'error'
  },
  
  // Rate limiting
  [ErrorCategory.RATE_LIMIT_EXCEEDED]: {
    severity: ErrorSeverity.MEDIUM,
    statusCode: 429,
    userMessage: 'Too many requests. Please slow down',
    shouldRedirect: false,
    logLevel: 'warn'
  },
  [ErrorCategory.TOO_MANY_REQUESTS]: {
    severity: ErrorSeverity.MEDIUM,
    statusCode: 429,
    userMessage: 'Request limit exceeded. Please try again later',
    shouldRedirect: false,
    logLevel: 'warn'
  }
}

/**
 * Enhanced error handler for middleware operations
 */
export class MiddlewareErrorHandler {
  private static requestCounter = 0

  /**
   * Create a structured error object
   */
  static createError(
    category: ErrorCategory,
    originalError?: any,
    details?: Record<string, any>
  ): MiddlewareError {
    const config = ERROR_CONFIG[category]
    const requestId = this.generateRequestId()
    
    return {
      category,
      severity: config.severity,
      message: originalError?.message || config.userMessage,
      statusCode: config.statusCode,
      userMessage: config.userMessage,
      details: {
        ...details,
        originalError: originalError?.name || 'Unknown',
        stack: originalError?.stack
      },
      timestamp: Date.now(),
      requestId
    }
  }

  /**
   * Handle errors with appropriate responses
   */
  static handleError(
    request: NextRequest,
    error: MiddlewareError,
    pathname: string,
    protectionLevel?: ProtectionLevel
  ): NextResponse {
    // Log the error
    this.logError(error, pathname)
    
    const config = ERROR_CONFIG[error.category]
    
    // Handle redirectable errors
    if (config.shouldRedirect) {
      return this.handleRedirectableError(request, error, pathname, protectionLevel)
    }
    
    // Handle non-redirectable errors with JSON response
    return this.createErrorResponse(error)
  }

  /**
   * Handle authentication and authorization errors with redirects
   */
  private static handleRedirectableError(
    request: NextRequest,
    error: MiddlewareError,
    pathname: string,
    protectionLevel?: ProtectionLevel
  ): NextResponse {
    switch (error.category) {
      case ErrorCategory.AUTH_SESSION_INVALID:
      case ErrorCategory.AUTH_SESSION_EXPIRED:
      case ErrorCategory.AUTH_TOKEN_MALFORMED: {
        const reason = error.category === ErrorCategory.AUTH_SESSION_EXPIRED 
          ? RedirectReason.SESSION_EXPIRED 
          : RedirectReason.UNAUTHENTICATED
        
        return RedirectHandler.handleUnauthenticated(
          request,
          protectionLevel || ProtectionLevel.AUTHENTICATED,
          pathname,
          reason
        )
      }
      
      case ErrorCategory.PLAN_UPGRADE_REQUIRED:
        return RedirectHandler.handlePlanUpgradeRequired(
          request,
          pathname,
          error.details?.userPlan || 'starter',
          error.details?.requiredPlan,
          error.details?.feature
        )
      
      case ErrorCategory.CREDIT_INSUFFICIENT:
        return RedirectHandler.handleInsufficientCredits(
          request,
          pathname,
          error.details?.userPlan,
          error.details?.creditDetails
        )
      
      case ErrorCategory.INSUFFICIENT_PERMISSIONS:
      case ErrorCategory.FEATURE_NOT_AVAILABLE:
        return RedirectHandler.handleMiddlewareError(request, pathname, error)
      
      default:
        return this.createErrorResponse(error)
    }
  }

  /**
   * Create JSON error response for non-redirectable errors
   */
  private static createErrorResponse(error: MiddlewareError): NextResponse {
    const response = NextResponse.json(
      {
        error: {
          category: error.category,
          message: error.userMessage,
          requestId: error.requestId,
          timestamp: error.timestamp
        }
      },
      { status: error.statusCode }
    )
    
    // Add error headers for debugging
    response.headers.set('x-error-category', error.category)
    response.headers.set('x-error-severity', error.severity)
    response.headers.set('x-request-id', error.requestId || 'unknown')
    
    return response
  }

  /**
   * Categorize and handle common errors
   */
  static categorizeError(originalError: any, context?: string): ErrorCategory {
    const errorMessage = originalError?.message?.toLowerCase() || ''
    const errorName = originalError?.name?.toLowerCase() || ''
    
    // Authentication errors
    if (errorMessage.includes('session') && errorMessage.includes('expired')) {
      return ErrorCategory.AUTH_SESSION_EXPIRED
    }
    if (errorMessage.includes('invalid') && errorMessage.includes('token')) {
      return ErrorCategory.AUTH_TOKEN_MALFORMED
    }
    if (errorMessage.includes('unauthorized') || errorMessage.includes('authentication')) {
      return ErrorCategory.AUTH_SESSION_INVALID
    }
    
    // Database errors
    if (errorMessage.includes('connection') || errorMessage.includes('connect')) {
      return ErrorCategory.DATABASE_CONNECTION
    }
    if (errorMessage.includes('timeout')) {
      return ErrorCategory.DATABASE_TIMEOUT
    }
    if (errorMessage.includes('query') || errorMessage.includes('sql')) {
      return ErrorCategory.DATABASE_QUERY_FAILED
    }
    
    // Supabase specific errors
    if (errorName.includes('supabase') || context?.includes('supabase')) {
      return ErrorCategory.SUPABASE_ERROR
    }
    
    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return ErrorCategory.NETWORK_ERROR
    }
    
    // Rate limiting
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
      return ErrorCategory.RATE_LIMIT_EXCEEDED
    }
    
    // Default to unknown error
    return ErrorCategory.UNKNOWN_ERROR
  }

  /**
   * Handle errors with automatic categorization
   */
  static handleCategorizedError(
    request: NextRequest,
    originalError: any,
    pathname: string,
    context?: string,
    details?: Record<string, any>
  ): NextResponse {
    const category = this.categorizeError(originalError, context)
    const error = this.createError(category, originalError, details)
    
    return this.handleError(request, error, pathname)
  }

  /**
   * Log errors with appropriate level
   */
  private static logError(error: MiddlewareError, pathname: string): void {
    const config = ERROR_CONFIG[error.category]
    const logData = {
      category: error.category,
      severity: error.severity,
      message: error.message,
      pathname,
      requestId: error.requestId,
      timestamp: new Date(error.timestamp).toISOString(),
      details: error.details
    }
    
    switch (config.logLevel) {
      case 'error':
        // eslint-disable-next-line no-console
        console.error('Middleware Error:', logData)
        break
      case 'warn':
        // eslint-disable-next-line no-console
        console.warn('Middleware Warning:', logData)
        break
      case 'info':
        // eslint-disable-next-line no-console
        console.info('Middleware Info:', logData)
        break
    }
    
    // For critical errors, also log to external service (if configured)
    if (error.severity === ErrorSeverity.CRITICAL) {
      this.logCriticalError(error, pathname)
    }
  }

  /**
   * Log critical errors to external monitoring service
   */
  private static logCriticalError(error: MiddlewareError, pathname: string): void {
    // TODO: Integrate with external monitoring service (Sentry, DataDog, etc.)
    // eslint-disable-next-line no-console
    console.error('CRITICAL MIDDLEWARE ERROR:', {
      category: error.category,
      message: error.message,
      pathname,
      requestId: error.requestId,
      timestamp: new Date(error.timestamp).toISOString(),
      stack: error.details?.stack
    })
  }

  /**
   * Generate unique request ID for error tracking
   */
  private static generateRequestId(): string {
    const timestamp = Date.now().toString(36)
    const counter = (++this.requestCounter).toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    
    return `mw_${timestamp}_${counter}_${random}`
  }

  /**
   * Check if error should trigger circuit breaker
   */
  static shouldTriggerCircuitBreaker(error: MiddlewareError): boolean {
    return error.severity === ErrorSeverity.CRITICAL ||
           error.category === ErrorCategory.DATABASE_CONNECTION ||
           error.category === ErrorCategory.SUPABASE_ERROR
  }

  /**
   * Get error statistics for monitoring
   */
  static getErrorStats(): {
    categories: Record<ErrorCategory, number>
    severities: Record<ErrorSeverity, number>
    totalErrors: number
  } {
    // This would be implemented with actual error tracking
    // For now, return empty stats
    return {
      categories: {} as Record<ErrorCategory, number>,
      severities: {} as Record<ErrorSeverity, number>,
      totalErrors: 0
    }
  }

  /**
   * Create a safe error response for production
   */
  static createSafeErrorResponse(
    statusCode: number = 500,
    userMessage: string = 'An error occurred'
  ): NextResponse {
    return NextResponse.json(
      {
        error: {
          message: userMessage,
          timestamp: Date.now()
        }
      },
      { status: statusCode }
    )
  }
} 