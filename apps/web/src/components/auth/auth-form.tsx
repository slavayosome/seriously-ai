'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GoogleButton } from './google-button'
import { EnhancedOTPForm } from './enhanced-otp-form'

interface AuthFormProps {
  /**
   * The mode of the form
   */
  mode?: 'signin' | 'signup'
  /**
   * Title to display in the card header
   */
  title?: string
  /**
   * Description to display in the card header
   */
  description?: string
  /**
   * Custom redirect URL after authentication
   */
  redirectTo?: string
  /**
   * Additional CSS classes for the card container
   */
  className?: string
  /**
   * Whether to show the divider between auth methods
   */
  showDivider?: boolean
  /**
   * Whether to show Google OAuth option
   */
  showGoogleAuth?: boolean
  /**
   * Whether to show Magic Link option
   */
  showMagicLink?: boolean
  /**
   * Callback function called when authentication is successful
   */
  onSuccess?: (method: 'google' | 'otp', email?: string) => void
  /**
   * Callback function called on authentication error
   */
  onError?: (error: string, method: 'google' | 'otp') => void
  /**
   * Custom text for Google button
   */
  googleButtonText?: string
  /**
   * Custom text for Magic Link button
   */
  magicLinkButtonText?: string
}

const AuthDivider = () => (
  <div className="relative">
    <div className="absolute inset-0 flex items-center">
      <span className="w-full border-t" />
    </div>
    <div className="relative flex justify-center text-xs uppercase">
      <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
    </div>
  </div>
)

export function AuthForm({
  mode = 'signin',
  title,
  description,
  redirectTo = `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
  className = '',
  showDivider = true,
  showGoogleAuth = true,
  showMagicLink = true,
  onSuccess,
  onError,
  googleButtonText,
  magicLinkButtonText,
}: AuthFormProps) {

  // Default titles and descriptions based on mode
  const defaultTitle = mode === 'signin' 
    ? 'Welcome back' 
    : 'Create your account'
  
  const defaultDescription = mode === 'signin'
    ? 'Sign in to your account to continue'
    : 'Get started with your free account'

  const defaultGoogleText = mode === 'signin'
    ? 'Sign in with Google'
    : 'Sign up with Google'

  const defaultMagicLinkText = mode === 'signin'
    ? 'Continue with email'
    : 'Create account with email'

  const handleGoogleSuccess = () => {
    onSuccess?.('google')
  }

  const handleGoogleError = (error: string) => {
    onError?.(error, 'google')
  }

  const handleOTPSuccess = (email: string) => {
    // OTP verification successful - call the success callback
    onSuccess?.('otp', email)
  }

  const handleOTPError = (error: string) => {
    onError?.(error, 'otp')
  }

  // Main authentication form
  return (
    <Card className={`w-full max-w-lg ${className}`}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">
          {title || defaultTitle}
        </CardTitle>
        <CardDescription className="text-center">
          {description || defaultDescription}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {showGoogleAuth && (
          <GoogleButton
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            redirectTo={redirectTo}
            fullWidth
          >
            {googleButtonText || defaultGoogleText}
          </GoogleButton>
        )}

        {showDivider && showGoogleAuth && showMagicLink && (
          <AuthDivider />
        )}

        {showMagicLink && (
          <EnhancedOTPForm
            onSuccess={handleOTPSuccess}
            onError={handleOTPError}
            buttonText={magicLinkButtonText || defaultMagicLinkText}
          />
        )}
      </CardContent>
    </Card>
  )
} 