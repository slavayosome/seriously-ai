'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../../../src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../src/components/ui/card'
import { useToast } from '../../../src/hooks/use-toast'
import {
  getCurrentUser,
  getLinkedIdentities,
  hasEmailAuth,
  isProviderLinked,
  linkOAuthAccount,
  unlinkOAuthAccount,
} from '../../../src/lib/auth/service'
import { SessionStatus } from '../../../src/components/auth/session-status'

interface Identity {
  id: string
  provider: string
  email?: string
  created_at?: string
  last_sign_in_at?: string
}

export default function AccountSettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [identities, setIdentities] = useState<Identity[]>([])
  const [loading, setLoading] = useState(true)
  const [linkingGoogle, setLinkingGoogle] = useState(false)
  const [unlinkingGoogle, setUnlinkingGoogle] = useState(false)
  const [hasEmail, setHasEmail] = useState(false)
  const [hasGoogle, setHasGoogle] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    loadUserData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Handle URL parameters for success/error messages
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const provider = urlParams.get('provider')
    const error = urlParams.get('error')
    const message = urlParams.get('message')
    
    if (success === 'linked' && provider) {
      toast({
        title: 'Account Linked Successfully',
        description: `Your ${provider} account has been linked to your profile.`,
      })
      // Clean up URL parameters
      window.history.replaceState({}, '', '/auth/account-settings')
    } else if (error === 'linking_failed') {
      toast({
        title: 'Linking Failed',
        description: message ? decodeURIComponent(message) : 'Failed to link account. Please try again.',
        variant: 'destructive',
      })
      // Clean up URL parameters
      window.history.replaceState({}, '', '/auth/account-settings')
    }
  }, [toast])

  const loadUserData = async () => {
    try {
      setLoading(true)
      
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/auth/login')
        return
      }

      const identitiesResult = await getLinkedIdentities()
      if (!identitiesResult.success) {
        toast({
          title: 'Error',
          description: identitiesResult.error,
          variant: 'destructive',
        })
        return
      }

      const emailAuth = await hasEmailAuth()
      const googleLinked = await isProviderLinked('google')

      setUser(currentUser)
      setIdentities(identitiesResult.identities || [])
      setHasEmail(emailAuth)
      setHasGoogle(googleLinked)
    } catch (error) {
      console.error('Error loading user data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load account information',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLinkGoogle = async () => {
    if (hasGoogle) {
      toast({
        title: 'Already Linked',
        description: 'Google account is already linked to your profile',
      })
      return
    }

    try {
      setLinkingGoogle(true)
      
      const result = await linkOAuthAccount({
        provider: 'google',
        redirectTo: window.location.origin + '/auth/account-settings?linked=google',
      })

      if (!result.success) {
        toast({
          title: 'Linking Failed',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Redirecting',
          description: result.message,
        })
        // OAuth redirect will happen automatically
      }
    } catch (error) {
      console.error('Error linking Google account:', error)
      toast({
        title: 'Error',
        description: 'Failed to link Google account',
        variant: 'destructive',
      })
    } finally {
      setLinkingGoogle(false)
    }
  }

  const handleUnlinkGoogle = async () => {
    if (!hasGoogle) {
      toast({
        title: 'Not Linked',
        description: 'No Google account is linked to your profile',
      })
      return
    }

    try {
      setUnlinkingGoogle(true)
      
      const result = await unlinkOAuthAccount('google')

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
        })
        await loadUserData() // Refresh data
      } else {
        toast({
          title: 'Unlinking Failed',
          description: result.error,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error unlinking Google account:', error)
      toast({
        title: 'Error',
        description: 'Failed to unlink Google account',
        variant: 'destructive',
      })
    } finally {
      setUnlinkingGoogle(false)
    }
  }

  const formatProvider = (provider: string) => {
    switch (provider) {
      case 'google':
        return 'Google'
      case 'email':
        return 'Email'
      default:
        return provider.charAt(0).toUpperCase() + provider.slice(1)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your authentication methods and account security
          </p>
        </div>

        {/* User Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your account details and primary email address
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">User ID</label>
                <p className="text-gray-900 font-mono text-sm">{user.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Account Created</label>
                <p className="text-gray-900">{formatDate(user.created_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Linked Accounts */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Authentication Methods</CardTitle>
            <CardDescription>
              Manage how you sign in to your account. You need at least one authentication method.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Email Authentication */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">Email Authentication</h3>
                    <p className="text-sm text-gray-600">
                      {hasEmail ? 'Sign in with email and verification code' : 'Not set up'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    hasEmail 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {hasEmail ? 'Active' : 'Not set up'}
                  </span>
                </div>
              </div>

              {/* Google Authentication */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">Google Account</h3>
                    <p className="text-sm text-gray-600">
                      {hasGoogle ? 'Sign in with your Google account' : 'Not linked'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    hasGoogle 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {hasGoogle ? 'Linked' : 'Not linked'}
                  </span>
                  {hasGoogle ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUnlinkGoogle}
                      disabled={unlinkingGoogle}
                    >
                      {unlinkingGoogle ? 'Unlinking...' : 'Unlink'}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLinkGoogle}
                      disabled={linkingGoogle}
                    >
                      {linkingGoogle ? 'Linking...' : 'Link Account'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Identities Details */}
        {identities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Identity Details</CardTitle>
              <CardDescription>
                Technical details about your authentication identities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {identities.map((identity) => (
                  <div key={identity.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{formatProvider(identity.provider)}</h4>
                      <span className="text-xs text-gray-500 font-mono">{identity.id}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Email:</span> {identity.email || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Last Sign In:</span> {formatDate(identity.last_sign_in_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Session Management */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Session Management</CardTitle>
            <CardDescription>
              Your current session status and security information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SessionStatus showDetails={true} showWarnings={false} />
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="mt-8">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
} 