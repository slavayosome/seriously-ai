# Auth Components

This directory contains reusable authentication components for the Seriously AI web application.

## Components

### AuthForm

A comprehensive authentication form that combines Google OAuth and OTP (One-Time Password) authentication.

**Features:**
- Sign in and sign up modes
- Customizable titles and descriptions  
- Show/hide individual auth methods
- Success and error callbacks
- OTP verification flow with resend functionality

**Usage:**
```tsx
import { AuthForm } from '@/components/auth'

// Basic usage
<AuthForm 
  mode="signin"
  onSuccess={(method, email) => console.log('Success!', method, email)}
  onError={(error, method) => console.error('Error:', error, method)}
/>

// Customized
<AuthForm
  mode="signup"
  title="Join Seriously AI"
  description="Start your journey today"
  showGoogleAuth={true}
  showMagicLink={true}
  showDivider={true}
  googleButtonText="Continue with Google"
  magicLinkButtonText="Get started with email"
/>
```

**Props:**
- `mode?: 'signin' | 'signup'` - Form mode (default: 'signin')
- `title?: string` - Custom title
- `description?: string` - Custom description
- `redirectTo?: string` - Custom redirect URL after auth
- `className?: string` - Additional CSS classes
- `showDivider?: boolean` - Show divider between auth methods (default: true)
- `showGoogleAuth?: boolean` - Show Google OAuth button (default: true)
- `showMagicLink?: boolean` - Show Magic Link form (default: true)
- `onSuccess?: (method, email?) => void` - Success callback
- `onError?: (error, method) => void` - Error callback
- `googleButtonText?: string` - Custom Google button text
- `magicLinkButtonText?: string` - Custom Magic Link button text

### GoogleButton

A reusable Google OAuth authentication button.

**Features:**
- Google branding with official colors and icon
- Loading states
- Error handling
- Customizable appearance

**Usage:**
```tsx
import { GoogleButton } from '@/components/auth'

// Basic usage
<GoogleButton />

// Customized
<GoogleButton
  fullWidth
  variant="outline"
  onSuccess={() => console.log('Google auth success')}
  onError={(error) => console.error('Google auth error:', error)}
>
  Sign up with Google
</GoogleButton>
```

**Props:**
- `children?: React.ReactNode` - Button text (default: 'Continue with Google')
- `className?: string` - Additional CSS classes
- `fullWidth?: boolean` - Full width button (default: false)
- `onSuccess?: () => void` - Success callback
- `onError?: (error: string) => void` - Error callback
- `redirectTo?: string` - Custom redirect URL
- `disabled?: boolean` - Disable button
- `variant?: string` - Button variant (default: 'outline')

### OTPForm

A form for OTP (One-Time Password) email authentication with two-step verification.

**Features:**
- Email input with validation (Zod + shared validation)
- OTP verification input (6-digit code)
- Automatic flow progression from email → OTP verification
- Resend OTP functionality (only visible in OTP verification screen)
- Loading states throughout the flow
- Customizable labels and text

### MagicLinkForm (Legacy)

A form for magic link email authentication.

**Features:**
- Email validation (Zod + shared validation)
- Resend functionality
- Loading states
- Customizable labels and text

**Usage:**
```tsx
import { OTPForm } from '@/components/auth'

// Basic usage
<OTPForm 
  onSuccess={(email) => console.log('OTP verified for:', email)}
  onError={(error) => console.error('Error:', error)}
/>

// Customized
<OTPForm
  showLabel={false}
  placeholder="Enter your work email"
  buttonText="Continue with email"
  labelText="Email address"
  useSharedValidation={true}
/>
```

**Legacy MagicLinkForm Usage:**
```tsx
import { MagicLinkForm } from '@/components/auth'

// Basic usage
<MagicLinkForm 
  onSuccess={(email) => console.log('Magic link sent to:', email)}
  onError={(error) => console.error('Error:', error)}
/>

// Customized
<MagicLinkForm
  showLabel={false}
  placeholder="Enter your work email"
  buttonText="Get magic link"
  labelText="Email address"
  useSharedValidation={true}
/>
```

**Props:**
- `onSuccess?: (email: string) => void` - Success callback with email
- `onError?: (error: string) => void` - Error callback
- `redirectTo?: string` - Custom redirect URL
- `className?: string` - Additional CSS classes
- `showLabel?: boolean` - Show email input label (default: true)
- `labelText?: string` - Custom label text
- `placeholder?: string` - Input placeholder
- `buttonText?: string` - Submit button text
- `disabled?: boolean` - Disable form
- `useSharedValidation?: boolean` - Use shared email validation (default: true)

## Authentication Flow

1. **User selects auth method** (Google OAuth or OTP)
2. **Google OAuth**: Redirects to Google → Returns to `/auth/callback`
3. **OTP Flow**: 
   - Step 1: User enters email → 6-digit code sent to email
   - Step 2: User enters verification code → Authentication completed
4. **OTP verification screen**: Shows code input with resend functionality (resend only visible here)
5. **Success**: Callback triggers with method and email (if applicable)

## Error Handling

All components include comprehensive error handling:
- Network errors
- Invalid email formats
- Authentication failures
- User-friendly error messages via toast notifications

## Dependencies

- `@/components/ui/*` - Shadcn/ui components
- `@/hooks/use-toast` - Toast notifications
- `@/lib/auth/service` - Authentication service functions
- `@seriously-ai/shared` - Shared utilities and validation
- `react-hook-form` + `zod` - Form handling and validation

## Examples

See `/auth/components-demo` for a live demonstration of all components with various configurations.

## Integration

These components are designed to work with:
- Supabase Auth
- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- The existing auth service layer

## Best Practices

1. **Always handle both success and error callbacks**
2. **Use appropriate mode ('signin' vs 'signup') for context**
3. **Customize text and messaging for your use case**
4. **Test with different screen sizes (components are responsive)**
5. **Consider accessibility when customizing styles** 