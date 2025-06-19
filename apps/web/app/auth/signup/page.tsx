'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthForm } from '@/components/auth'
import { mapToAuthError } from '@/components/auth'
import { useToast } from '@/hooks/use-toast'

export default function SignupPage() {
  const router = useRouter()
  const { toast } = useToast()

  const handleSuccess = async (method: 'google' | 'otp', _email?: string) => {
    // Handle successful authentication
    
    if (method === 'otp') {
      // For OTP, the user is already authenticated, redirect to onboarding or dashboard
      toast({
        title: 'Welcome to Seriously AI!',
        description: 'Your account has been created successfully.',
      })
      
      // Small delay to ensure session is properly established
      setTimeout(() => {
        // New users typically need onboarding, but fallback to dashboard
        router.push('/dashboard')
      }, 500)
    }
    // For Google OAuth, the redirect happens automatically via the callback
  }

  const handleError = (error: string, method: 'google' | 'otp') => {
    // Handle authentication errors with enhanced error mapping
    const authError = mapToAuthError(error, `${method} account creation`)
    console.error(`Account creation failed via ${method}:`, authError)
    
    toast({
      variant: 'destructive',
      title: authError.message,
      description: authError.details,
    })
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <AuthForm
        mode="signup"
        title="Welcome to Seriously AI"
        description="Transform your expertise into influence"
        onSuccess={handleSuccess}
        onError={handleError}
      />
      
      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>
          Already have an account?{' '}
          <Link 
            href="/auth/login" 
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
        <p className="mt-4 px-8 text-xs">
          By creating an account, you agree to our{' '}
          <Link 
            href="/terms" 
            className="underline underline-offset-4 hover:text-primary"
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link 
            href="/privacy" 
            className="underline underline-offset-4 hover:text-primary"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  )
} 