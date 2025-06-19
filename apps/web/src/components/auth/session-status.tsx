'use client'

import { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { useToast } from '../../hooks/use-toast'
import { 
  formatSessionDuration,
  getSessionInfo, 
  getSessionWarning,
  refreshSession, 
  setupAutoRefresh
} from '../../lib/auth/session'
import type { SessionInfo } from '../../lib/auth/session'

interface SessionStatusProps {
  showDetails?: boolean
  showWarnings?: boolean
  autoRefresh?: boolean
  className?: string
}

export function SessionStatus({ 
  showDetails = false, 
  showWarnings = true,
  autoRefresh = true,
  className = ''
}: SessionStatusProps) {
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  const loadSessionInfo = async () => {
    try {
      const info = await getSessionInfo()
      setSessionInfo(info)
    } catch (error) {
      console.error('Failed to load session info:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSessionInfo()
    
    // Set up auto-refresh if enabled
    let cleanup: (() => void) | undefined
    if (autoRefresh) {
      cleanup = setupAutoRefresh()
    }

    // Refresh session info every minute
    const interval = setInterval(loadSessionInfo, 60 * 1000)

    return () => {
      if (cleanup) cleanup()
      clearInterval(interval)
    }
  }, [autoRefresh])

  useEffect(() => {
    // Show warnings when session info changes
    if (showWarnings && sessionInfo?.isValid) {
      const warning = getSessionWarning(sessionInfo.timeToExpiry)
      if (warning) {
        toast({
          title: 'Session Expiring',
          description: warning,
          variant: 'destructive',
        })
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionInfo?.timeToExpiry, sessionInfo?.isValid, showWarnings, toast])

  const handleRefreshSession = async () => {
    setRefreshing(true)
    try {
      const result = await refreshSession()
      
      if (result.success) {
        toast({
          title: 'Session Refreshed',
          description: 'Your session has been successfully refreshed.',
        })
        await loadSessionInfo()
      } else {
        toast({
          title: 'Refresh Failed',
          description: result.error || 'Failed to refresh session',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh session',
        variant: 'destructive',
      })
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        Loading session status...
      </div>
    )
  }

  if (!sessionInfo || !sessionInfo.isValid) {
    return (
      <div className={`text-sm text-red-600 ${className}`}>
        Session expired or invalid
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Simple status indicator */}
      {!showDetails && (
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600">
            Session active ({formatSessionDuration(sessionInfo.timeToExpiry)} remaining)
          </span>
        </div>
      )}

      {/* Detailed status */}
      {showDetails && (
        <div className="p-3 border rounded-lg bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">Session Status</h4>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-700 font-medium">Active</span>
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Time remaining:</span>
              <span className="font-medium">
                {formatSessionDuration(sessionInfo.timeToExpiry)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Session age:</span>
              <span className="font-medium">
                {formatSessionDuration(sessionInfo.sessionAge)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Auto-refresh:</span>
              <span className="font-medium">
                {sessionInfo.shouldRefresh ? 'Soon' : 'Not needed'}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshSession}
              disabled={refreshing}
              className="w-full"
            >
              {refreshing ? 'Refreshing...' : 'Refresh Session'}
            </Button>
          </div>
        </div>
      )}

      {/* Session warning */}
      {showWarnings && sessionInfo.timeToExpiry < 900 && ( // 15 minutes
        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-yellow-800">
              {getSessionWarning(sessionInfo.timeToExpiry)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
} 