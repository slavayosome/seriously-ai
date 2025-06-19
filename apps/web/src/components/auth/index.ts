// Auth components for reusable authentication functionality
export { AuthForm } from './auth-form'
export { GoogleButton } from './google-button'
export { MagicLinkForm } from './magic-link-form'
export { OTPForm } from './otp-form'
export { EnhancedOTPForm } from './enhanced-otp-form'
export { SessionStatus } from './session-status'
export { ResendTimer, useResendState } from './resend-timer'
export { AuthErrorHandler, mapToAuthError, useAuthError } from './error-handler'
export { AuthProvider } from './auth-provider'

// Export types
export type { 
  AuthError,
  ErrorHandlerProps
} from './error-handler' 