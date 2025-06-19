'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Clock, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ResendTimerProps {
  /**
   * Function to call when resending
   */
  onResend: () => Promise<void>
  /**
   * Initial cooldown time in seconds
   */
  initialCooldown?: number
  /**
   * Maximum number of resend attempts before requiring longer cooldown
   */
  maxAttempts?: number
  /**
   * Text to display on the button when ready to resend
   */
  resendText?: string
  /**
   * Text to display when cooldown is active
   */
  cooldownText?: string
  /**
   * Button variant
   */
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  /**
   * Button size
   */
  size?: 'default' | 'sm' | 'lg'
  /**
   * Additional CSS classes
   */
  className?: string
  /**
   * Whether the component is disabled
   */
  disabled?: boolean
  /**
   * Show icon on the button
   */
  showIcon?: boolean
  /**
   * Start with cooldown active (e.g., when code was just sent)
   */
  startWithCooldown?: boolean
}

export function ResendTimer({
  onResend,
  initialCooldown = 60,
  maxAttempts = 3,
  resendText = 'Resend',
  cooldownText = 'Wait {time}s',
  variant = 'ghost',
  size = 'sm',
  className = '',
  disabled = false,
  showIcon = true,
  startWithCooldown = false
}: ResendTimerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [cooldownTime, setCooldownTime] = useState(startWithCooldown ? initialCooldown : 0)
  const [attemptCount, setAttemptCount] = useState(startWithCooldown ? 1 : 0)
  const { toast } = useToast()

  // Calculate cooldown based on attempt count
  const getCooldownTime = useCallback(() => {
    if (attemptCount === 0) return 0
    if (attemptCount <= 2) return initialCooldown
    if (attemptCount <= 4) return initialCooldown * 2
    return initialCooldown * 5 // Longer cooldown after many attempts
  }, [attemptCount, initialCooldown])

  // Countdown effect
  useEffect(() => {
    if (cooldownTime <= 0) return undefined

    const timer = setInterval(() => {
      setCooldownTime(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [cooldownTime])

  const handleResend = async () => {
    if (cooldownTime > 0 || isLoading || disabled) return

    setIsLoading(true)
    
    try {
      await onResend()
      
      // Increment attempt count and start cooldown
      const newAttemptCount = attemptCount + 1
      setAttemptCount(newAttemptCount)
      setCooldownTime(getCooldownTime())

      // Show appropriate toast message
      if (newAttemptCount >= maxAttempts) {
        toast({
          title: 'Code sent',
          description: 'Please wait longer before requesting another code.',
          variant: 'default'
        })
      } else {
        toast({
          title: 'Code sent',
          description: 'Check your email for the new verification code.',
          variant: 'default'
        })
      }
    } catch (error) {
      toast({
        title: 'Resend failed',
        description: 'Please try again in a few moments.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}`
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const isOnCooldown = cooldownTime > 0
  const buttonText = isOnCooldown 
    ? cooldownText.replace('{time}', formatTime(cooldownTime))
    : resendText

  const getButtonIcon = () => {
    if (!showIcon) return null
    
    if (isLoading) {
      return <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
    }
    
    if (isOnCooldown) {
      return <Clock className="h-3 w-3 mr-1" />
    }
    
    return <RefreshCw className="h-3 w-3 mr-1" />
  }

  return (
    <Button
      onClick={handleResend}
      disabled={isOnCooldown || isLoading || disabled}
      variant={variant}
      size={size}
      className={`transition-all duration-200 ${className}`}
    >
      {getButtonIcon()}
      {buttonText}
    </Button>
  )
}

/**
 * Hook for managing resend state across multiple components
 */
export function useResendState(initialCooldown = 60) {
  const [lastResendTime, setLastResendTime] = useState<Date | null>(null)
  const [attemptCount, setAttemptCount] = useState(0)

  const canResend = useCallback(() => {
    if (!lastResendTime) return true
    
    const now = new Date()
    const timeSinceLastResend = (now.getTime() - lastResendTime.getTime()) / 1000
    const requiredCooldown = attemptCount <= 2 
      ? initialCooldown 
      : attemptCount <= 4 
        ? initialCooldown * 2 
        : initialCooldown * 5

    return timeSinceLastResend >= requiredCooldown
  }, [lastResendTime, attemptCount, initialCooldown])

  const recordResend = useCallback(() => {
    setLastResendTime(new Date())
    setAttemptCount(prev => prev + 1)
  }, [])

  const resetResendState = useCallback(() => {
    setLastResendTime(null)
    setAttemptCount(0)
  }, [])

  const getTimeUntilNextResend = useCallback(() => {
    if (!lastResendTime || canResend()) return 0
    
    const now = new Date()
    const timeSinceLastResend = (now.getTime() - lastResendTime.getTime()) / 1000
    const requiredCooldown = attemptCount <= 2 
      ? initialCooldown 
      : attemptCount <= 4 
        ? initialCooldown * 2 
        : initialCooldown * 5

    return Math.max(0, requiredCooldown - timeSinceLastResend)
  }, [lastResendTime, attemptCount, initialCooldown, canResend])

  return {
    canResend: canResend(),
    attemptCount,
    recordResend,
    resetResendState,
    timeUntilNextResend: getTimeUntilNextResend()
  }
} 