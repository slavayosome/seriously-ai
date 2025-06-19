'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AuthForm } from '@/components/auth'
import { mapToAuthError } from '@/components/auth'
import { useToast } from '@/hooks/use-toast'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [showAccountExistsMessage, setShowAccountExistsMessage] = useState(false)

  useEffect(() => {
    // Handle URL parameters for account linking scenarios
    const error = searchParams.get('error')
    const message = searchParams.get('message')
    
    if (error === 'account_exists' && message) {
      setShowAccountExistsMessage(true)
      toast({
        title: 'Account Already Exists',
        description: decodeURIComponent(message),
        variant: 'destructive',
      })
    } else if (error === 'callback_error') {
      toast({
        title: 'Authentication Error',
        description: 'There was an error processing your authentication. Please try again.',
        variant: 'destructive',
      })
    } else if (error === 'unexpected_error') {
      toast({
        title: 'Unexpected Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    }
  }, [searchParams, toast])

  const handleSuccess = async (method: 'google' | 'otp', _email?: string) => {
    // Handle successful authentication
    
    if (method === 'otp') {
      // For OTP, the user is already authenticated, redirect to dashboard
      toast({
        title: 'Welcome back!',
        description: 'You have been successfully signed in.',
      })
      
      // Small delay to ensure session is properly established
      setTimeout(() => {
        // Check if there's a redirect URL in the search params
        const returnTo = searchParams.get('returnTo')
        if (returnTo) {
          router.push(decodeURIComponent(returnTo))
        } else {
          router.push('/dashboard')
        }
      }, 500)
    }
    // For Google OAuth, the redirect happens automatically via the callback
  }

  const handleError = (error: string, method: 'google' | 'otp') => {
    // Handle authentication errors with enhanced error mapping
    const authError = mapToAuthError(error, `${method} authentication`)
    console.error(`Authentication failed via ${method}:`, authError)
    
    toast({
      variant: 'destructive',
      title: authError.message,
      description: authError.details,
    })
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      {showAccountExistsMessage && (
        <div className="mb-6 max-w-md rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm">
          <div className="flex items-center">
            <svg className="mr-2 h-4 w-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-yellow-800">Account Linking Available</span>
          </div>
          <p className="mt-2 text-yellow-700">
            After signing in, you can link additional authentication methods from your account settings for easier access.
          </p>
        </div>
      )}
      
      <AuthForm
        mode="signin"
        title="Welcome to Seriously AI"
        description="Sign in to transform your expertise into influence"
        onSuccess={handleSuccess}
        onError={handleError}
      />
      
      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>
          Don&apos;t have an account?{' '}
          <Link 
            href="/auth/signup" 
            className="font-medium text-primary hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
} 