'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { signInWithOTP } from '@/lib/auth/service'
import { isValidEmail } from '@seriously-ai/shared'

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type EmailForm = z.infer<typeof emailSchema>

interface MagicLinkFormProps {
  /**
   * Callback function called when magic link is successfully sent
   */
  onSuccess?: (email: string) => void
  /**
   * Callback function called on error
   */
  onError?: (error: string) => void
  /**
   * Custom redirect URL after authentication
   */
  redirectTo?: string
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
   * Custom button text
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

export function MagicLinkForm({
  onSuccess,
  onError,
  className = '',
  showLabel = true,
  labelText = 'Email address',
  placeholder = 'Enter your email address',
  buttonText = 'Send magic link',
  disabled = false,
  useSharedValidation = true,
}: MagicLinkFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (values: EmailForm) => {
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
        toast({
          title: 'Magic link sent!',
          description: result.message || `We sent a magic link to ${values.email}`,
        })
        onSuccess?.(values.email)
      } else {
        const errorMessage = result.error || 'Failed to send magic link'
        toast({
          variant: 'destructive',
          title: 'Authentication failed',
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

  const handleResendEmail = async () => {
    const email = form.getValues('email')
    if (!email) {
      toast({
        variant: 'destructive',
        title: 'No email entered',
        description: 'Please enter your email address first.',
      })
      return
    }

    setIsLoading(true)
    
    try {
      const result = await signInWithOTP({
        email,
      })

      if (result.success) {
        toast({
          title: 'Magic link sent!',
          description: result.message || `We sent another magic link to ${email}`,
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to resend',
          description: result.error || 'Failed to resend magic link',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Something went wrong',
        description: 'Failed to resend magic link. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={className}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
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
          <div className="space-y-2">
            <Button
              type="submit"
              disabled={isLoading || disabled}
              className="w-full"
            >
              {isLoading ? 'Sending...' : buttonText}
            </Button>
            <Button
              type="button"
              onClick={handleResendEmail}
              disabled={isLoading || disabled}
              variant="ghost"
              className="w-full text-sm"
            >
              Resend magic link
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
} 