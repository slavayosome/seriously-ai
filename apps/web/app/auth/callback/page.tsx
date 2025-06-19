'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '../../../src/lib/supabase/client'
import { syncUserProfile } from '../../../src/lib/auth/service'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient()
      
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          
          // Check if this is an account linking error
          if (error.message.includes('already_registered') || error.message.includes('email_exists')) {
            router.push('/auth/login?error=account_exists&message=An account with this email already exists. Please sign in and link your accounts from account settings.')
            return
          }
          
          if (error.message.includes('linking_failed')) {
            router.push('/auth/account-settings?error=linking_failed&message=Failed to link account. Please try again.')
            return
          }
          
          router.push('/auth/login?error=callback_error')
          return
        }

        if (data.session) {
          // Sync user profile data from OAuth provider
          try {
            await syncUserProfile()
          } catch (syncError) {
            console.warn('Profile sync failed:', syncError)
            // Don't block authentication for sync failures
          }
          
          // Check if this was an account linking operation
          const returnTo = searchParams.get('returnTo')
          const linked = searchParams.get('linked')
          
          if (linked) {
            // User successfully linked an account
            router.push(`/auth/account-settings?success=linked&provider=${linked}`)
            return
          }
          
          if (returnTo) {
            // Return to the requested page after authentication
            router.push(decodeURIComponent(returnTo))
            return
          }
          
          // Check if user has completed onboarding
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('onboarding_completed')
            .eq('id', data.session.user.id)
            .single()
          
          if (profile && !profile.onboarding_completed) {
            router.push('/onboarding')
            return
          }
          
          // User is authenticated, redirect to dashboard
          router.push('/dashboard')
        } else {
          // No session, redirect to login
          router.push('/auth/login')
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error)
        router.push('/auth/login?error=unexpected_error')
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  // Show loading message with context if available
  const linked = searchParams.get('linked')
  const loadingMessage = linked 
    ? `Completing ${linked} account linking...`
    : 'Completing authentication...'

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">{loadingMessage}</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
} 