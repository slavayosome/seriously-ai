'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { resendOTP, signInWithOTP, verifyOTP } from '@/lib/auth/service'
import { isValidEmail } from '@seriously-ai/shared'
import { ResendTimer } from './resend-timer'

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

const otpSchema = z.object({
  otp: z.string().min(6, 'Please enter a 6-digit code').max(6, 'Please enter a 6-digit code'),
})

type EmailForm = z.infer<typeof emailSchema>
type OTPForm = z.infer<typeof otpSchema>

interface OTPFormProps {
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
}

export function OTPForm({
  onSuccess,
  onError,
  className = '',
  showLabel = true,
  labelText = 'Email address',
  placeholder = 'Enter your email address',
  buttonText = 'Continue with email',
  disabled = false,
  useSharedValidation = true,
}: OTPFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showOTPInput, setShowOTPInput] = useState(false)
  const [email, setEmail] = useState('')
  const { toast } = useToast()

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
    // Use shared validation if enabled
    if (useSharedValidation && !isValidEmail(values.email)) {
      toast({
        variant: 'destructive',
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
      })
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
        toast({
          title: 'Code sent!',
          description: result.message || `We sent a 6-digit code to ${values.email}`,
        })
      } else {
        const errorMessage = result.error || 'Failed to send verification code'
        toast({
          variant: 'destructive',
          title: 'Error',
          description: errorMessage,
        })
        onError?.(errorMessage)
      }
    } catch (error) {
      const errorMessage = 'An unexpected error occurred. Please try again.'
      toast({
        variant: 'destructive',
        title: 'Something went wrong',
        description: errorMessage,
      })
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const onOTPSubmit = async (values: OTPForm) => {
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
        toast({
          variant: 'destructive',
          title: 'Verification failed',
          description: errorMessage,
        })
        onError?.(errorMessage)
      }
    } catch (error) {
      const errorMessage = 'An unexpected error occurred. Please try again.'
      toast({
        variant: 'destructive',
        title: 'Something went wrong',
        description: errorMessage,
      })
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    try {
      const result = await resendOTP(email)

      if (result.success) {
        // ResendTimer component will handle the success toast
        return Promise.resolve()
      } else {
        return Promise.reject(new Error(result.error || 'Failed to resend verification code'))
      }
    } catch (error) {
      return Promise.reject(error)
    }
  }

  const handleBackToEmail = () => {
    setShowOTPInput(false)
    setEmail('')
    otpForm.reset()
  }

  return (
    <div className={className}>
      {!showOTPInput ? (
        // Email input form
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
      ) : (
        // OTP verification form
        <Form {...otpForm}>
          <form onSubmit={otpForm.handleSubmit(onOTPSubmit)} className="space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">Enter verification code</h3>
              <p className="text-sm text-muted-foreground">
                We sent a 6-digit code to <strong>{email}</strong>
              </p>
            </div>
            
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
               
               <ResendTimer
                 onResend={handleResendOTP}
                 initialCooldown={60}
                 maxAttempts={5}
                 resendText="Resend code"
                 variant="ghost"
                 size="sm"
                 className="w-full text-sm"
                 disabled={disabled}
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
          </form>
        </Form>
      )}
    </div>
  )
} 