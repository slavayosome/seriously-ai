'use client'

import { type ReactNode, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/button'
import { useToast } from '../../hooks/use-toast'

interface LogoutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  children?: ReactNode
  logoutType?: 'normal' | 'everywhere' | 'force'
  showConfirmation?: boolean
  onLogoutStart?: () => void
  onLogoutComplete?: (success: boolean) => void
  redirectTo?: string
}

export function LogoutButton({
  variant = 'outline',
  size = 'default',
  className = '',
  children = 'Sign Out',
  logoutType = 'normal',
  showConfirmation = false,
  onLogoutStart,
  onLogoutComplete,
  redirectTo = '/auth/login'
}: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleLogout = async () => {
    if (showConfirmation) {
      const confirmed = window.confirm(
        logoutType === 'everywhere' 
          ? 'This will sign you out from all devices. Continue?'
          : 'Are you sure you want to sign out?'
      )
      if (!confirmed) return
    }

    setIsLoggingOut(true)
    onLogoutStart?.()

    try {
      let result

      // Dynamic import to avoid server-side import issues
      const logoutModule = await import('../../lib/auth/logout')

      switch (logoutType) {
        case 'everywhere':
          result = await logoutModule.logoutEverywhere('User requested logout from all devices')
          break
        case 'force':
          result = await logoutModule.forceLogout('Force logout requested')
          break
        default:
          result = await logoutModule.signOutWithInvalidation({
            clearCache: true,
            redirectTo,
            silent: false
          })
      }

      if (result.success) {
        toast({
          title: 'Signed Out',
          description: result.message || 'You have been successfully signed out.',
        })

        onLogoutComplete?.(true)

        // Redirect after a brief delay to allow toast to show
        setTimeout(() => {
          router.push(result.redirectUrl || redirectTo)
        }, 1000)
      } else {
        toast({
          title: 'Logout Failed',
          description: result.error || 'Failed to sign out. Please try again.',
          variant: 'destructive',
        })
        onLogoutComplete?.(false)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred during logout.',
        variant: 'destructive',
      })
      onLogoutComplete?.(false)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleLogout}
      disabled={isLoggingOut}
    >
      {isLoggingOut ? 'Signing Out...' : children}
    </Button>
  )
}

/**
 * Logout dropdown menu component with multiple options
 */
export function LogoutMenu({ className = '' }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <svg 
          className="w-4 h-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
          />
        </svg>
        Sign Out Options
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-1">
            <div className="px-4 py-2 text-sm text-gray-700 border-b">
              Logout Options
            </div>
            
            <LogoutButton
              variant="ghost"
              size="sm"
              className="w-full justify-start text-left px-4 py-2 hover:bg-gray-50"
              logoutType="normal"
              onLogoutComplete={() => setIsOpen(false)}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
              </svg>
              Sign Out (This Device)
            </LogoutButton>

            <LogoutButton
              variant="ghost"
              size="sm"
              className="w-full justify-start text-left px-4 py-2 hover:bg-gray-50"
              logoutType="everywhere"
              showConfirmation={true}
              onLogoutComplete={() => setIsOpen(false)}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Sign Out Everywhere
            </LogoutButton>

            <div className="border-t mt-1">
              <div className="px-4 py-2 text-xs text-gray-500">
                &quot;Everywhere&quot; signs you out from all devices and browsers.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
} 