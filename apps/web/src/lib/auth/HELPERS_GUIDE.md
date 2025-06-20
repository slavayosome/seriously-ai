# Auth Helper Functions Implementation (Task 2.7)

This document describes the comprehensive authentication helper functions system implemented for Seriously AI, providing both client-side and server-side utilities for common authentication operations.

## Overview

The auth helpers are split into two main categories:
- **Client-side helpers** (`helpers-client.ts`) - For use in React components and browser environments
- **Server-side helpers** (`helpers.ts`) - For use in server components, API routes, and middleware

## Architecture

### File Structure
```
src/lib/auth/
├── helpers-client.ts    # Client-side auth utilities
├── helpers.ts          # Server-side auth utilities 
├── service.ts          # High-level auth operations
└── session.ts          # Session management utilities

src/hooks/
├── use-auth.ts         # React hooks for authentication

src/components/auth/
└── with-auth.tsx       # HOCs and components for route protection
```

## Client-Side Helpers (`helpers-client.ts`)

### Core Functions

#### User Management
```typescript
// Get current user
const user = await getCurrentUser()

// Get current session  
const session = await getCurrentSession()

// Check authentication status
const isAuth = await isAuthenticated()

// Get user details
const email = await getUserEmail()
const userId = await getUserId()
const metadata = await getUserMetadata()
```

#### Authentication Status
```typescript
// Check if user has specific email
const hasEmailMatch = await hasEmail('user@example.com')

// Check if email is verified
const isVerified = await hasVerifiedEmail()

// Check if OAuth provider is linked
const hasGoogle = await hasOAuthProvider('google')

// Get all linked identities
const identities = await getUserIdentities()
```

#### Sign Out
```typescript
// Sign out user
const result = await signOutUser()
if (result.success) {
  // Handle successful sign out
} else {
  // Handle error: result.error
}
```

### Utility Functions

#### User Display
```typescript
// Format display name intelligently
const displayName = formatUserDisplayName(user)

// Get avatar URL
const avatarUrl = getUserAvatarUrl(user)

// Check user properties
const isAdmin = isUserAdmin(user)
const tier = getUserTier(user) // 'free' | 'pro' | 'enterprise'
const locale = getUserLocale(user)
const hasOnboarded = hasCompletedOnboarding(user)
```

#### Validation
```typescript
// Email validation
const isValidEmailFormat = isValidEmail('test@example.com')

// Password validation with detailed feedback
const passwordCheck = isValidPassword('MyPassword123!')
if (!passwordCheck.isValid) {
  console.log(passwordCheck.errors) // Array of specific issues
}

// Generate secure password
const securePassword = generateSecurePassword(16)
```

#### Security
```typescript
// Sanitize user input to prevent XSS
const safeInput = sanitizeInput(userInput)

// Format auth errors for user display
const userFriendlyError = formatAuthError('Invalid login credentials')

// Create auth redirect URLs
const redirectUrl = createAuthRedirectUrl('/dashboard')
```

#### Environment Detection
```typescript
// Check execution environment
const isClientSide = isClient()
const isServerSide = isServer()
```

## Server-Side Helpers (`helpers.ts`)

### Core Functions

#### User Management (Server)
```typescript
// Get user in server components
const user = await getServerUser()

// Get session in server components
const session = await getServerSession()

// Check authentication status
const isAuth = await isServerAuthenticated()

// Get user details
const userId = await getServerUserId()
const email = await getServerUserEmail()
```

#### Admin Operations
```typescript
// Create admin client with service role
const adminClient = await createAdminClient()

// Use for admin operations that bypass RLS
const { data } = await adminClient
  .from('user_profiles')
  .select('*')
```

#### Session Validation
```typescript
// Comprehensive session validation for middleware
const validation = await validateServerSession()

if (validation.isValid) {
  // User is authenticated with valid session
  console.log(validation.user)
  console.log(validation.session)
} else {
  // Handle invalid session
  console.log(validation.error)
}
```

## React Hooks (`use-auth.ts`)

### Core Hooks

#### `useUser()`
```typescript
const { user, loading, error } = useUser()

// Automatically updates when auth state changes
useEffect(() => {
  if (user) {
    console.log('User signed in:', user.email)
  }
}, [user])
```

#### `useSession()`
```typescript
const { session, loading, error } = useSession()

// Access token, refresh token, etc.
if (session) {
  console.log('Session expires at:', session.expires_at)
}
```

#### `useAuth()`
```typescript
const { user, authenticated, loading, error, signOut } = useAuth()

// Comprehensive auth state
const handleSignOut = async () => {
  const result = await signOut()
  if (result.success) {
    router.push('/')
  }
}
```

#### `useUserProfile()`
```typescript
const { 
  id, 
  email, 
  displayName, 
  avatarUrl, 
  hasGoogleAuth 
} = useUserProfile()

// Pre-formatted user data for UI
return (
  <div>
    <img src={avatarUrl} alt={displayName} />
    <span>{displayName}</span>
  </div>
)
```

#### `useRequireAuth()`
```typescript
const { authenticated, loading, shouldRedirect } = useRequireAuth()

// For protected components
if (shouldRedirect) {
  // Will redirect to login
  return null
}
```

#### `useAuthLoading()`
```typescript
const loading = useAuthLoading()

// Simple loading state for auth
if (loading) {
  return <Spinner />
}
```

#### `useOptionalAuth()`
```typescript
const { user, isAuthenticated, loading } = useOptionalAuth()

// For components that work with or without auth
return (
  <div>
    {isAuthenticated ? (
      <UserMenu user={user} />
    ) : (
      <LoginButton />
    )}
  </div>
)
```

## Route Protection Components

### Higher-Order Component (HOC)

```typescript
// Protect entire pages
const ProtectedPage = withAuth(MyPage, {
  redirectTo: '/auth/login',
  showLoading: true,
  loadingComponent: CustomSpinner
})

// Allow unauthenticated access
const OptionalAuthPage = withAuth(MyPage, {
  allowUnauthenticated: true
})
```

### Guard Components

#### `<AuthGuard>`
```typescript
// Wrap content that requires authentication
<AuthGuard redirectTo="/auth/login" fallback={<Loading />}>
  <ProtectedContent />
</AuthGuard>

// Optional authentication
<AuthGuard requireAuth={false}>
  <ConditionalContent />
</AuthGuard>
```

#### `<ConditionalAuth>`
```typescript
// Different content based on auth status
<ConditionalAuth
  authenticated={<Dashboard />}
  unauthenticated={<Landing />}
  loading={<Spinner />}
>
  <DefaultContent />
</ConditionalAuth>
```

### Protection Hook

```typescript
// In page components
export default function ProtectedPage() {
  const { authenticated, loading } = useProtectedPage('/auth/login')
  
  if (loading) return <Loading />
  if (!authenticated) return null // Will redirect
  
  return <PageContent />
}
```

## Usage Examples

### Basic Component with Auth

```typescript
import { useAuth } from '@/hooks/use-auth'
import { AuthGuard } from '@/components/auth'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  
  return (
    <AuthGuard>
      <div>
        <h1>Welcome, {user?.email}!</h1>
        <button onClick={signOut}>Sign Out</button>
      </div>
    </AuthGuard>
  )
}
```

### Server Component with Auth

```typescript
import { getServerUser, isServerAuthenticated } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'

export default async function ServerPage() {
  const isAuth = await isServerAuthenticated()
  
  if (!isAuth) {
    redirect('/auth/login')
  }
  
  const user = await getServerUser()
  
  return (
    <div>
      <h1>Server-side protected content</h1>
      <p>User: {user?.email}</p>
    </div>
  )
}
```

### API Route with Auth

```typescript
import { validateServerSession } from '@/lib/auth/helpers'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const validation = await validateServerSession()
  
  if (!validation.isValid) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  // Proceed with authenticated user
  const userId = validation.user!.id
  
  return Response.json({ userId })
}
```

### Middleware with Auth

```typescript
import { validateServerSession } from '@/lib/auth/helpers'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Only check auth on protected routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const validation = await validateServerSession()
    
    if (!validation.isValid) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }
  
  return NextResponse.next()
}
```

## Best Practices

### 1. Choose the Right Helper
- Use **client helpers** in React components, hooks, and browser-only code
- Use **server helpers** in server components, API routes, and middleware
- Never import server helpers in client components (will cause build errors)

### 2. Error Handling
```typescript
// Always handle errors gracefully
const user = await getCurrentUser()
if (!user) {
  // Handle unauthenticated state
  return <LoginPrompt />
}
```

### 3. Loading States
```typescript
// Always show loading states
const { user, loading } = useUser()

if (loading) {
  return <Skeleton />
}
```

### 4. Reactive Updates
```typescript
// Use hooks for reactive auth state
const { authenticated } = useAuth()

// Don't manually poll auth state
// ❌ Bad
setInterval(checkAuth, 1000)

// ✅ Good - hooks handle this automatically
```

### 5. Route Protection
```typescript
// Prefer declarative protection
<AuthGuard>
  <ProtectedContent />
</AuthGuard>

// Over imperative checks
// ❌ Less maintainable
useEffect(() => {
  if (!user) router.push('/login')
}, [user])
```

## Security Considerations

1. **Server-Side Validation**: Always validate authentication on the server side for sensitive operations
2. **Token Refresh**: Hooks automatically handle token refresh
3. **XSS Prevention**: Use `sanitizeInput()` for user-generated content
4. **CSRF Protection**: Server helpers work with Supabase's built-in CSRF protection
5. **Session Validation**: Use `validateServerSession()` in middleware and API routes

## Performance Optimization

1. **Caching**: User data is cached in React state and updated reactively
2. **Lazy Loading**: Auth checks only happen when needed
3. **Memoization**: Hooks use proper dependency arrays to prevent unnecessary re-renders
4. **SSR Support**: Server helpers work in all Next.js rendering modes

## Migration Guide

### From Direct Supabase Calls
```typescript
// Before
const { data: { user } } = await supabase.auth.getUser()

// After
const user = await getCurrentUser() // Includes error handling
```

### From Manual Auth State Management
```typescript
// Before
const [user, setUser] = useState(null)
useEffect(() => {
  supabase.auth.onAuthStateChange((event, session) => {
    setUser(session?.user ?? null)
  })
}, [])

// After
const { user } = useUser() // Automatic with error handling
```

## Troubleshooting

### Common Issues

1. **Build Error: "next/headers" in client component**
   - Solution: Use `helpers-client.ts` instead of `helpers.ts` in client components

2. **User state not updating**
   - Solution: Ensure you're using hooks (`useUser`, `useAuth`) instead of direct function calls

3. **Server-side auth not working**
   - Solution: Verify environment variables and use `validateServerSession()` for comprehensive checking

4. **Infinite re-renders**
   - Solution: Check hook dependency arrays and avoid calling auth functions in render loops

This system provides a comprehensive, type-safe, and performant foundation for all authentication operations in the Seriously AI application. 