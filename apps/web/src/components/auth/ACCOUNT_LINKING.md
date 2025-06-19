# Account Linking Implementation - Task 2.5

## Overview

This document describes the account linking implementation that allows users to connect multiple authentication methods (Google OAuth and Email OTP) to a single account via email address.

## Features Implemented

### 1. Account Linking Functions
- **`linkOAuthAccount()`** - Links a Google OAuth account to the current user
- **`unlinkOAuthAccount()`** - Unlinks a Google OAuth account from the current user
- **`getLinkedIdentities()`** - Retrieves all linked authentication identities
- **`isProviderLinked()`** - Checks if a specific provider is linked
- **`hasEmailAuth()`** - Checks if email authentication is set up
- **`getPrimaryEmail()`** - Gets the primary email address for verification

### 2. Account Settings Page
- **Location**: `/auth/account-settings`
- **Features**:
  - View all linked authentication methods
  - Link/unlink Google accounts
  - See account information and identity details
  - Secure unlinking with safety checks (prevents removing the only auth method)

### 3. Enhanced Auth Callback Handling
- **Location**: `/auth/callback`
- **Features**:
  - Handles account linking redirects
  - Provides specific error messages for linking failures
  - Supports success messages for completed linking
  - Manages return-to URLs for better user experience

### 4. Improved Error Handling
- Account-specific error messages for linking scenarios
- Enhanced auth error mapping for better user feedback
- URL parameter handling for error and success states

## Account Linking Flow

### Linking a Google Account
1. User navigates to Account Settings page
2. Clicks "Link Account" for Google
3. Redirects to Google OAuth with special parameters
4. After Google auth, redirects back to `/auth/callback?linked=google`
5. Callback handler redirects to Account Settings with success message

### Unlinking a Google Account
1. User clicks "Unlink" for Google in Account Settings
2. System checks if user has other authentication methods
3. If safe, unlinks the Google identity
4. Refreshes the page data to show updated state

### Error Scenarios
- **Account Already Exists**: When trying to OAuth with existing email
- **Linking Failed**: When the OAuth linking process fails
- **Email Mismatch**: When OAuth email doesn't match current account
- **Only Auth Method**: When trying to unlink the only authentication method

## Files Modified/Created

### Core Authentication Service
- `apps/web/src/lib/auth/service.ts` - Added account linking functions
- `packages/shared/src/lib/auth/index.ts` - Added types and error constants

### User Interface
- `apps/web/app/auth/account-settings/page.tsx` - New account settings page
- `apps/web/app/dashboard/page.tsx` - Dashboard with account settings link
- `apps/web/app/auth/login/page.tsx` - Enhanced with linking messages
- `apps/web/app/auth/callback/page.tsx` - Enhanced callback handling

## Security Considerations

1. **Email Verification**: Account linking is based on email address matching
2. **Minimum Auth Methods**: Users cannot unlink their only authentication method
3. **Session Validation**: All linking operations require active user session
4. **Provider Safety**: Only Google OAuth linking is currently supported
5. **Error Sanitization**: Auth errors are mapped to safe, user-friendly messages

## Usage Examples

### Check if Google is Linked
```typescript
import { isProviderLinked } from '@/lib/auth/service'

const isGoogleLinked = await isProviderLinked('google')
```

### Link Google Account
```typescript
import { linkOAuthAccount } from '@/lib/auth/service'

const result = await linkOAuthAccount({
  provider: 'google',
  redirectTo: '/auth/account-settings?linked=google'
})
```

### Unlink Google Account
```typescript
import { unlinkOAuthAccount } from '@/lib/auth/service'

const result = await unlinkOAuthAccount('google')
```

### Get All Linked Identities
```typescript
import { getLinkedIdentities } from '@/lib/auth/service'

const { success, identities } = await getLinkedIdentities()
```

## Database Integration

The account linking functionality leverages Supabase's built-in identity management:
- Uses `auth.identities` table for tracking linked providers
- Maintains user profiles in `user_profiles` table
- Automatic user creation triggers remain unchanged

## Next Steps

Future enhancements could include:
1. Support for additional OAuth providers (GitHub, LinkedIn, etc.)
2. Account merging for duplicate accounts
3. Enhanced account security settings
4. Two-factor authentication integration
5. Account linking via magic links

## Testing

The implementation includes:
- ✅ Build passing with TypeScript compilation
- ✅ ESLint warnings addressed (only minor warnings remain)
- ✅ Next.js 15 compatibility with Suspense boundaries
- ✅ Error handling for edge cases
- ✅ User experience flows for success and error states

Account linking is now fully functional and ready for user testing. 