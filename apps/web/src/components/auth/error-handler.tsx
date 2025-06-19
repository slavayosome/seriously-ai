'use client'

import { useState } from 'react'
import { AlertCircle, Clock, Mail, RefreshCw, Shield, Wifi } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

export interface AuthError {
  code: string
  message: string
  type: 'validation' | 'network' | 'auth' | 'rate_limit' | 'server' | 'session'
  recoverable: boolean
  details?: string
}

export interface ErrorHandlerProps {
  error: AuthError | null
  onRetry?: () => void
  onResend?: () => void
  retryText?: string
  resendText?: string
  className?: string
  showIcon?: boolean
}

interface RecoveryAction {
  label: string
  action: () => void
  variant: 'default' | 'outline' | 'ghost'
  icon?: React.ReactNode
}

/**
 * Enhanced error handler with user-friendly messages and recovery options
 */
export function AuthErrorHandler({
  error,
  onRetry,
  onResend,
  retryText = 'Try again',
  resendText = 'Resend',
  className = '',
  showIcon = true
}: ErrorHandlerProps) {
  const [isRetrying, setIsRetrying] = useState(false)
  const [isResending, setIsResending] = useState(false)

  if (!error) return null

  const handleRetry = async () => {
    if (!onRetry) return
    setIsRetrying(true)
    try {
      onRetry()
    } finally {
      setIsRetrying(false)
    }
  }

  const handleResend = async () => {
    if (!onResend) return
    setIsResending(true)
    try {
      onResend()
    } finally {
      setIsResending(false)
    }
  }

  const getErrorIcon = () => {
    switch (error.type) {
      case 'network':
        return <Wifi className="h-4 w-4" />
      case 'rate_limit':
        return <Clock className="h-4 w-4" />
      case 'session':
        return <Shield className="h-4 w-4" />
      case 'auth':
        return <Mail className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getRecoveryActions = (): RecoveryAction[] => {
    const actions: RecoveryAction[] = []

    // Standard retry action for recoverable errors
    if (error.recoverable && onRetry) {
      actions.push({
        label: retryText,
        action: handleRetry,
        variant: 'outline',
        icon: <RefreshCw className="h-3 w-3 mr-1" />
      })
    }

    // Resend action for specific error types
    if ((error.code === 'LINK_EXPIRED' || error.code === 'EMAIL_NOT_FOUND' || error.type === 'auth') && onResend) {
      actions.push({
        label: resendText,
        action: handleResend,
        variant: 'default',
        icon: <Mail className="h-3 w-3 mr-1" />
      })
    }

    return actions
  }

  const recoveryActions = getRecoveryActions()

  return (
    <Alert variant="destructive" className={`${className} border-red-200 bg-red-50`}>
      <div className="flex items-start space-x-3">
        {showIcon && (
          <div className="flex-shrink-0 mt-0.5 text-red-600">
            {getErrorIcon()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <AlertDescription className="text-red-800">
            <div className="space-y-2">
              <p className="font-medium">{error.message}</p>
              {error.details && (
                <p className="text-sm text-red-600">{error.details}</p>
              )}
              
              {recoveryActions.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                                     {recoveryActions.map((action, index) => (
                     <Button
                       key={`action-${index}`}
                       size="sm"
                       variant={action.variant}
                       onClick={action.action}
                       disabled={isRetrying || isResending}
                       className="h-8 text-xs"
                     >
                       {(action.label === retryText && isRetrying) || 
                        (action.label === resendText && isResending) ? (
                         <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                       ) : action.icon ? (
                         <>{action.icon}</>
                       ) : null}
                       {action.label}
                     </Button>
                   ))}
                </div>
              )}
            </div>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  )
}

/**
 * Enhanced error mapping with better context and recovery suggestions
 */
export function mapToAuthError(error: string, context?: string): AuthError {
  const lowerError = error.toLowerCase()

  // Email validation errors
  if (lowerError.includes('invalid email') || lowerError.includes('invalid_request')) {
    return {
      code: 'INVALID_EMAIL',
      message: 'Please enter a valid email address',
      type: 'validation',
      recoverable: false,
      details: 'Make sure your email is in the correct format (e.g., user@example.com)'
    }
  }

  // Rate limiting errors
  if (lowerError.includes('rate limit') || lowerError.includes('too many')) {
    return {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many attempts. Please wait before trying again',
      type: 'rate_limit',
      recoverable: true,
      details: 'Wait a few minutes before attempting to sign in again'
    }
  }

  // Network/connection errors
  if (lowerError.includes('network') || lowerError.includes('fetch') || lowerError.includes('connection')) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Connection problem detected',
      type: 'network',
      recoverable: true,
      details: 'Check your internet connection and try again'
    }
  }

  // Authentication/token errors
  if (lowerError.includes('expired') || lowerError.includes('invalid_token')) {
    return {
      code: 'LINK_EXPIRED',
      message: 'Authentication link has expired',
      type: 'auth',
      recoverable: true,
      details: 'Request a new authentication link to continue'
    }
  }

  // User not found errors
  if (lowerError.includes('user not found') || lowerError.includes('email not confirmed')) {
    return {
      code: 'EMAIL_NOT_FOUND',
      message: 'No account found with this email',
      type: 'auth',
      recoverable: true,
      details: 'Check your email address or create a new account'
    }
  }

  // OAuth errors
  if (lowerError.includes('oauth') || lowerError.includes('provider')) {
    return {
      code: 'OAUTH_ERROR',
      message: 'Authentication with Google failed',
      type: 'auth',
      recoverable: true,
      details: 'Try again or use email authentication instead'
    }
  }

  // Session errors
  if (lowerError.includes('session') || lowerError.includes('unauthorized')) {
    return {
      code: 'SESSION_ERROR',
      message: 'Your session has expired',
      type: 'session',
      recoverable: true,
      details: 'Please sign in again to continue'
    }
  }

  // Account linking errors
  if (lowerError.includes('already_registered') || lowerError.includes('email_exists')) {
    return {
      code: 'ACCOUNT_EXISTS',
      message: 'An account with this email already exists',
      type: 'auth',
      recoverable: true,
      details: 'Try signing in instead, or use a different email address'
    }
  }

  // Default unknown error
  return {
    code: 'UNKNOWN_ERROR',
    message: 'Something went wrong. Please try again',
    type: 'server',
    recoverable: true,
    details: context ? `Error occurred during: ${context}` : 'If the problem persists, please contact support'
  }
}

/**
 * Hook for managing auth errors with enhanced functionality
 */
export function useAuthError() {
  const [error, setError] = useState<AuthError | null>(null)
  const [errorHistory, setErrorHistory] = useState<AuthError[]>([])

  const setAuthError = (errorMessage: string, context?: string) => {
    const authError = mapToAuthError(errorMessage, context)
    setError(authError)
    setErrorHistory(prev => [...prev.slice(-4), authError]) // Keep last 5 errors
  }

  const clearError = () => {
    setError(null)
  }

  const hasRepeatedError = (errorCode: string) => {
    return errorHistory.filter(e => e.code === errorCode).length >= 2
  }

  return {
    error,
    errorHistory,
    setAuthError,
    clearError,
    hasRepeatedError
  }
} 