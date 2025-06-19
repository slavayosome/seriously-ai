'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { ResendTimer } from '@/components/auth'
import { signInWithOTP } from '../../../src/lib/auth/service'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const { toast } = useToast()

  const handleResendEmail = async () => {
    if (!email) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No email address found. Please try signing in again.',
      })
      return Promise.reject(new Error('No email address'))
    }
    
    try {
      const result = await signInWithOTP({
        email,
      })

      if (result.success) {
        return Promise.resolve()
      } else {
        return Promise.reject(new Error(result.error || 'Failed to resend'))
      }
    } catch (error) {
      return Promise.reject(error)
    }
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Verify your email</CardTitle>
          <CardDescription className="text-center">
            {email ? (
              <>We sent a verification link to <strong>{email}</strong></>
            ) : (
              'Please check your email for a verification link'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Click the link in your email to verify your account. The link will expire in 15 minutes.
            </p>
            
            <div className="space-y-2">
              {email && (
                <ResendTimer
                  onResend={handleResendEmail}
                  resendText="Resend verification email"
                  variant="outline"
                  className="w-full"
                />
              )}
              
              <Button asChild variant="ghost" className="w-full">
                <Link href="/auth/login">
                  Back to sign in
                </Link>
              </Button>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Didn&apos;t receive the email? Check your spam folder or try resending.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
} 