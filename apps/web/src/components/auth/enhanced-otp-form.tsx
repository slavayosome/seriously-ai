'use client'

import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { resendOTP, signInWithOTP, verifyOTP } from '@/lib/auth/service'
import { isValidEmail } from '@seriously-ai/shared'
import { ResendTimer, useResendState } from './resend-timer'
import { useAuthError } from './error-handler'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle } from 'lucide-react'

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

const otpSchema = z.object({
  otp: z.string().min(6, 'Please enter a 6-digit code').max(6, 'Please enter a 6-digit code'),
})

type EmailForm = z.infer<typeof emailSchema>
type OTPForm = z.infer<typeof otpSchema>

interface EnhancedOTPFormProps {
  /**
   * Callback function called when OTP is successfully verified
   */
  onSuccess?: (email: string) => void
  /**
   * Callback function called on error
   */
  onError?: (error: string) => void
  /**
   * Additional CSS classes for the form container
   */
  className?: string
  /**
   * Whether to show a label above the email input
   */
  showLabel?: boolean
  /**
   * Custom label text for the email input
   */
  labelText?: string
  /**
   * Custom placeholder text for the email input
   */
  placeholder?: string
  /**
   * Custom button text for sending OTP
   */
  buttonText?: string
  /**
   * Whether the form is disabled
   */
  disabled?: boolean
  /**
   * Whether to show email validation from shared package
   */
  useSharedValidation?: boolean
  /**
   * Show helpful hints and tips
   */
  showHints?: boolean
}

export function EnhancedOTPForm({
  onSuccess,
  onError,
  className = '',
  showLabel = true,
  labelText = 'Email address',
  placeholder = 'Enter your email address',
  buttonText = 'Continue with email',
  disabled = false,
  useSharedValidation = true,
  showHints = true,
}: EnhancedOTPFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showOTPInput, setShowOTPInput] = useState(false)
  const [email, setEmail] = useState('')
  const [codeSentAt, setCodeSentAt] = useState<Date | null>(null)
  const { toast } = useToast()
  
  // Enhanced error handling
  const { error, setAuthError, clearError, hasRepeatedError } = useAuthError()
  
  // Resend state management
  const resendState = useResendState(60)

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  })

  const otpForm = useForm<OTPForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  })

  const onEmailSubmit = async (values: EmailForm) => {
    clearError()
    
    // Use shared validation if enabled
    if (useSharedValidation && !isValidEmail(values.email)) {
      setAuthError('Please enter a valid email address', 'email validation')
      return
    }

    setIsLoading(true)

    try {
      const result = await signInWithOTP({
        email: values.email,
      })

      if (result.success) {
        setEmail(values.email)
        setShowOTPInput(true)
        setCodeSentAt(new Date())
        resendState.recordResend()
        toast({
          title: 'Code sent!',
          description: result.message || `We sent a 6-digit code to ${values.email}`,
        })
      } else {
        const errorMessage = result.error || 'Failed to send verification code'
        setAuthError(errorMessage, 'sending OTP')
        onError?.(errorMessage)
      }
    } catch (error) {
      const errorMessage = 'An unexpected error occurred. Please try again.'
      setAuthError(errorMessage, 'network error')
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const onOTPSubmit = async (values: OTPForm) => {
    clearError()
    setIsLoading(true)

    try {
      const result = await verifyOTP(email, values.otp)

      if (result.success) {
        toast({
          title: 'Success!',
          description: result.message || 'Successfully authenticated',
        })
        onSuccess?.(email)
      } else {
        const errorMessage = result.error || 'Invalid verification code'
        setAuthError(errorMessage, 'OTP verification')
        onError?.(errorMessage)
      }
    } catch (error) {
      const errorMessage = 'An unexpected error occurred. Please try again.'
      setAuthError(errorMessage, 'network error')
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = useCallback(async () => {
    clearError()
    
    try {
      const result = await resendOTP(email)

      if (result.success) {
        setCodeSentAt(new Date())
        // Don't show toast here - ResendTimer component will handle it
        return Promise.resolve()
      } else {
        const errorMessage = result.error || 'Failed to resend verification code'
        setAuthError(errorMessage, 'resending OTP')
        return Promise.reject(new Error(errorMessage))
      }
    } catch (error) {
      const errorMessage = 'Failed to resend verification code. Please try again.'
      setAuthError(errorMessage, 'network error')
      return Promise.reject(error)
    }
  }, [email, clearError, setAuthError])

  const handleBackToEmail = () => {
    setShowOTPInput(false)
    setEmail('')
    setCodeSentAt(null)
    otpForm.reset()
    clearError()
    resendState.resetResendState()
  }

  const getTimeElapsed = () => {
    if (!codeSentAt) return null
    const elapsed = Math.floor((new Date().getTime() - codeSentAt.getTime()) / 1000)
    return elapsed
  }

  // Show helpful hints based on error patterns
  const getHelpfulHints = () => {
    if (!showHints) return null

    const timeElapsed = getTimeElapsed()
    const hints = []

    if (hasRepeatedError('LINK_EXPIRED')) {
      hints.push('Codes expire after 15 minutes. Try requesting a new one.')
    }

    if (hasRepeatedError('INVALID_EMAIL')) {
      hints.push('Make sure your email address is correct and try again.')
    }

    if (timeElapsed && timeElapsed > 300) { // 5 minutes
      hints.push('Having trouble? Check your spam folder or try a different email.')
    }

    if (resendState.attemptCount >= 3) {
      hints.push('If you continue having issues, please contact support.')
    }

    return hints.length > 0 ? (
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Helpful tips:</p>
            <ul className="space-y-1">
              {hints.map((hint, index) => (
                <li key={index} className="flex items-start space-x-1">
                  <span className="text-blue-600">•</span>
                  <span>{hint}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    ) : null
  }

  return (
    <div className={className}>
      {/* Error Display */}
      {error && (
        <div className="mb-4">
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              <div className="space-y-2">
                <p className="font-medium">{error.message}</p>
                {error.details && (
                  <p className="text-sm text-red-600">{error.details}</p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {!showOTPInput ? (
        // Email input form
        <div className="space-y-4">
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
              <FormField
                control={emailForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    {showLabel && <FormLabel>{labelText}</FormLabel>}
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={placeholder}
                        disabled={isLoading || disabled}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={isLoading || disabled}
                className="w-full"
              >
                {isLoading ? 'Sending code...' : buttonText}
              </Button>
            </form>
          </Form>
        </div>
      ) : (
        // OTP verification form
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-medium">Check your email</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              We sent a 6-digit code to <strong>{email}</strong>
            </p>
          </div>

          <Form {...otpForm}>
            <form onSubmit={otpForm.handleSubmit(onOTPSubmit)} className="space-y-4">
              <FormField
                control={otpForm.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification code</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        disabled={isLoading || disabled}
                        className="text-center text-2xl tracking-widest"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <Button
                  type="submit"
                  disabled={isLoading || disabled}
                  className="w-full"
                >
                  {isLoading ? 'Verifying...' : 'Verify code'}
                </Button>
                
                <div className="flex flex-col space-y-2">
                  <ResendTimer
                    onResend={handleResendOTP}
                    initialCooldown={60}
                    maxAttempts={5}
                    resendText="Resend code"
                    className="w-full"
                    disabled={disabled}
                    startWithCooldown={true}
                  />
                  
                  <Button
                    type="button"
                    onClick={handleBackToEmail}
                    disabled={isLoading || disabled}
                    variant="ghost"
                    className="w-full text-sm"
                  >
                    Use different email
                  </Button>
                </div>
              </div>
            </form>
          </Form>

          {getHelpfulHints()}
        </div>
      )}
    </div>
  )
} 