# Session Management Implementation (Task 2.6)

This document describes the session management system implemented for Seriously AI, providing 7-day session duration with refresh tokens as specified in task 2.6.

## Overview

The session management system is built on top of Supabase Auth's JWT-based authentication with the following key features:

- **7-day session maximum lifetime** (604800 seconds)
- **1-hour access token expiry** (3600 seconds) - recommended default
- **Automatic token refresh** before expiration
- **Refresh token rotation** for enhanced security
- **Inactivity timeout** of 24 hours
- **Session monitoring and warnings** for users
- **Manual session refresh** capabilities

## Architecture

### Core Components

1. **Session Configuration** (`packages/shared/src/lib/auth/index.ts`)
   - Centralized session constants and types
   - Configurable timeouts and durations

2. **Session Management Service** (`apps/web/src/lib/auth/session.ts`)
   - Session information retrieval
   - Automatic refresh logic
   - Session validation utilities

3. **Supabase Client Configuration** (`apps/web/src/lib/supabase/`)
   - Enhanced client and server configurations
   - Proper cookie handling for session persistence

4. **Session Status UI Component** (`apps/web/src/components/auth/session-status.tsx`)
   - Real-time session monitoring
   - User warnings and notifications
   - Manual refresh controls

## Configuration Details

### Session Constants

```typescript
export const SESSION_CONFIG: SessionConfig = {
  jwtExpiry: 60 * 60,                    // 1 hour (3600 seconds)
  sessionTimeboxDuration: 7 * 24 * 60 * 60, // 7 days (604800 seconds)
  refreshTokenRotation: true,             // Enable for security
  inactivityTimeout: 24 * 60 * 60,       // 24 hours (86400 seconds)
}
```

### Supabase Client Configuration

Both client and server configurations include:
- **PKCE flow** for enhanced security
- **Auto refresh tokens** enabled
- **Session persistence** enabled
- **Session detection in URLs** enabled
- **Debug mode** in development

### Cookie Configuration (Server)

- **MaxAge**: 7 days for session cookies
- **HttpOnly**: True for security
- **Secure**: True in production
- **SameSite**: 'lax' for cross-site compatibility

## Session Lifecycle

### 1. Session Creation
- User signs in via OTP or Google OAuth
- Supabase creates a session with access token and refresh token
- Session persisted in secure cookies
- Session tracked in `auth.sessions` table

### 2. Session Validation
- Access token checked on each request
- Sessions validated against 7-day timebox
- Automatic refresh when token expires in <5 minutes

### 3. Session Refresh
- Automatic refresh via Supabase client libraries
- Manual refresh via `refreshSession()` function
- New refresh token issued (rotation)
- Session expiry extended

### 4. Session Termination
- User logout action
- 7-day maximum lifetime reached
- 24-hour inactivity timeout
- Security-sensitive actions (password change)

## API Reference

### Session Information Functions

```typescript
// Get comprehensive session status
const sessionInfo = await getSessionInfo()

// Check if session is valid
const isValid = await isSessionValid()

// Get session expiry details
const expiry = await getSessionExpiry()

// Manual refresh
const result = await refreshSession()

// Ensure valid session (auto-refresh if needed)
const ensured = await ensureValidSession()
```

### Session Status Component

```tsx
// Simple status indicator
<SessionStatus />

// Detailed status with controls
<SessionStatus showDetails={true} showWarnings={true} />

// Auto-refresh disabled
<SessionStatus autoRefresh={false} />
```

### Auto-refresh Setup

```typescript
// Set up automatic session monitoring
const cleanup = setupAutoRefresh(5 * 60 * 1000) // 5 minutes

// Cleanup when component unmounts
useEffect(() => {
  return cleanup
}, [])
```

## Security Features

### 1. Refresh Token Rotation
- New refresh token issued on each refresh
- Previous refresh tokens invalidated
- Protection against token theft

### 2. Session Timebox
- Maximum 7-day session lifetime
- Force re-authentication after expiry
- Compliance with security policies

### 3. Inactivity Timeout
- 24-hour inactivity limit
- Automatic logout for idle sessions
- Configurable per deployment

### 4. Secure Cookie Storage
- HttpOnly cookies prevent XSS attacks
- Secure flag for HTTPS-only transmission
- SameSite protection against CSRF

## User Experience Features

### 1. Session Warnings
- 15-minute expiry warning
- 5-minute critical warning
- Automatic toast notifications

### 2. Status Indicators
- Real-time session status display
- Time remaining visualization
- Active/expired status indicators

### 3. Manual Controls
- One-click session refresh
- Detailed session information
- Auto-refresh toggle

## Integration Examples

### Dashboard Integration

```tsx
// Dashboard with session status
<header>
  <div className="session-bar">
    <SessionStatus showWarnings={true} />
  </div>
</header>
```

### Account Settings Integration

```tsx
// Detailed session management
<Card>
  <CardHeader>
    <CardTitle>Session Management</CardTitle>
  </CardHeader>
  <CardContent>
    <SessionStatus showDetails={true} />
  </CardContent>
</Card>
```

### Auto-refresh in App

```tsx
// Application-wide session management
useEffect(() => {
  const cleanup = setupAutoRefresh()
  return cleanup
}, [])
```

## Error Handling

### Session Expiry
- Automatic redirect to login
- User-friendly error messages
- Preservation of current page URL

### Refresh Failures
- Graceful degradation
- Retry mechanisms
- Fallback to re-authentication

### Network Issues
- Offline detection
- Queue refresh attempts
- Resume when connection restored

## Monitoring and Analytics

### Session Metrics
- Session duration tracking
- Refresh frequency monitoring
- Expiry pattern analysis

### User Behavior
- Login frequency
- Session usage patterns
- Timeout occurrences

## Production Considerations

### Performance
- Minimal overhead from session checks
- Efficient cookie storage
- Optimized refresh timing

### Scalability
- Stateless JWT validation
- Minimal server dependencies
- CDN-friendly architecture

### Compliance
- GDPR-compliant session handling
- SOC 2 compatible timeouts
- Audit trail support

## Environment Variables

Required environment variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Future Enhancements

### Planned Features
- Multi-device session management
- Session history and audit logs
- Customizable timeout policies
- Enhanced security notifications

### Advanced Configuration
- Per-user session policies
- Role-based session durations
- Geographic session restrictions
- Device fingerprinting

## Testing

### Unit Tests
- Session validation logic
- Refresh mechanism testing
- Cookie handling verification

### Integration Tests
- End-to-end session flows
- Cross-browser compatibility
- Mobile device testing

### Security Tests
- Token rotation verification
- Timeout enforcement
- Attack vector protection

## Troubleshooting

### Common Issues
1. **Session not persisting**: Check cookie configuration
2. **Frequent re-logins**: Verify refresh token rotation
3. **Timeout warnings**: Adjust warning thresholds
4. **Performance issues**: Optimize refresh intervals

### Debug Tools
- Browser developer tools
- Session status component
- Supabase auth logs
- Network request monitoring

This implementation provides a robust, secure, and user-friendly session management system that meets the requirements of task 2.6 while providing excellent developer and user experiences. 