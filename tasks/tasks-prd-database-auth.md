## Relevant Files

- `packages/database/schema.sql` - Main database schema definition with all tables and RLS policies
- `packages/database/seed.sql` - Seed script for initial data and development testing
- `packages/shared/src/types/database.ts` - TypeScript types generated from Supabase schema
- `packages/database/migrations/` - Database migration files for version control
- `apps/web/app/auth/` - Authentication pages and components
- `apps/web/middleware.ts` - Next.js middleware for route protection
- `apps/web/src/lib/supabase/client.ts` - Supabase client configuration
- `apps/web/src/lib/supabase/server.ts` - Supabase server-side configuration
- `apps/web/src/lib/auth/service.ts` - Auth service functions
- `apps/web/app/auth/login/page.tsx` - Login page with magic-link and Google OAuth
- `apps/web/app/auth/callback/page.tsx` - Auth callback handler
- `apps/web/app/auth/verify-email/page.tsx` - Email verification page
- `packages/shared/src/lib/auth/index.ts` - Shared auth utilities and helpers
- `apps/web/src/lib/auth/helpers.ts` - Client and server-side auth helper functions
- `apps/web/src/hooks/use-auth.ts` - React hooks for authentication state management
- `apps/web/src/lib/auth/index.ts` - Main auth module exports
- `apps/web/src/lib/auth/logout.ts` - Comprehensive logout functionality with session invalidation
- `apps/web/src/components/auth/logout-button.tsx` - Reusable logout components with multiple options
- `apps/web/src/components/auth/error-handler.tsx` - Enhanced error handling with user-friendly messages and recovery options
- `apps/web/src/components/auth/resend-timer.tsx` - Resend functionality with cooldown timers and rate limiting
- `apps/web/src/components/auth/enhanced-otp-form.tsx` - Enhanced OTP form with better error handling and UX
- `apps/web/src/components/ui/alert.tsx` - Alert UI component for displaying error messages
- `apps/web/src/components/auth/auth-provider.tsx` - AuthProvider component for automatic profile sync throughout the app
- `apps/web/src/hooks/use-auth.ts` - Enhanced with useAuthProfileSync and useAuthEvents hooks for profile synchronization
- `packages/database/schema.sql` - Enhanced with handle_user_profile_sync function and trigger for automatic profile updates
- `apps/web/src/lib/auth/service.ts` - Enhanced with syncUserProfile function and improved Google OAuth with profile sync
- `apps/web/app/auth/callback/page.tsx` - Enhanced to sync user profile after OAuth authentication
- `apps/web/src/lib/redis/credit-cache.ts` - Redis caching for credit balance (to be created)

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

- [x] 1.0 Set up Database Schema and Migrations
  - [x] 1.1 Create the main schema.sql file with all table definitions (user_profiles, credit_wallet, credit_transactions, research_reports, insights, drafts)
  - [x] 1.2 Enable pgvector extension and configure vector column for embeddings
  - [x] 1.3 Create database indexes for frequently queried fields (user_id, created_at, embeddings)
  - [x] 1.4 Set up Supabase migrations folder structure and initial migration files
  - [x] 1.5 Generate TypeScript types from Supabase schema using Supabase CLI
  - [x] 1.6 Create seed.sql script with test data for development environment
  - [x] 1.7 Configure automatic TTL cleanup for research_reports (180-day expiration)

- [x] 2.0 Implement Authentication System
  - [x] 2.1 Configure Supabase Auth with Google OAuth provider settings
  - [x] 2.2 Set up magic-link authentication with 15-minute expiration
  - [x] 2.3 Create authentication pages (login, signup, verify-email)
  - [x] 2.4 Build reusable auth components (AuthForm, GoogleButton, MagicLinkForm)
  - [x] 2.5 Implement account linking logic to connect multiple auth methods via email
  - [x] 2.6 Configure session management with 7-day duration and refresh tokens
  - [x] 2.7 Create auth helper functions for client and server-side usage
  - [x] 2.8 Implement logout functionality with session invalidation
  - [x] 2.9 Add error handling with user-friendly messages and resend options
  - [x] 2.10 Create user profile creation/update hooks on auth events

- [ ] 3.0 Configure Row Level Security (RLS) Policies
  - [ ] 3.1 Enable RLS on all tables (user_profiles, credit_wallet, credit_transactions, research_reports, insights, drafts)
  - [ ] 3.2 Create SELECT policies restricting users to their own data
  - [ ] 3.3 Create INSERT policies for user-owned records
  - [ ] 3.4 Create UPDATE policies for user modifications
  - [ ] 3.5 Create DELETE policies where applicable
  - [ ] 3.6 Configure service role bypass for background jobs
  - [ ] 3.7 Create read-only policy for credit_transactions
  - [ ] 3.8 Write RLS policy tests to verify data isolation
  - [ ] 3.9 Document RLS policies and access patterns

- [ ] 4.0 Build Protected Route Middleware
  - [ ] 4.1 Create Next.js middleware.ts file with Supabase session validation
  - [ ] 4.2 Define route protection levels (public, authenticated, paid)
  - [ ] 4.3 Implement redirect logic for unauthenticated users
  - [ ] 4.4 Add credit balance checking for paid operations
  - [ ] 4.5 Create route matchers for different protection levels
  - [ ] 4.6 Implement plan-based feature access checks
  - [ ] 4.7 Add error handling with appropriate status codes
  - [ ] 4.8 Create middleware tests for various scenarios
  - [ ] 4.9 Add performance monitoring for route checks

- [ ] 5.0 Implement Credit Wallet and Transaction System
  - [ ] 5.1 Create credit wallet initialization on user signup (50 credits for starter)
  - [ ] 5.2 Implement credit deduction function with atomic transactions
  - [ ] 5.3 Build credit refill logic based on plan tier
  - [ ] 5.4 Create transaction logging for all credit operations
  - [ ] 5.5 Set up Redis caching for credit balance (60-second TTL)
  - [ ] 5.6 Implement credit balance validation before pipeline operations
  - [ ] 5.7 Create scheduled job for monthly credit refills
  - [ ] 5.8 Build credit balance UI component for navigation
  - [ ] 5.9 Implement quota exceeded error handling with upgrade prompts
  - [ ] 5.10 Create credit transaction history API endpoint
  - [ ] 5.11 Add credit wallet tests for edge cases (zero balance, concurrent operations) 