# Product Requirements Document: Database & Auth

## Introduction/Overview

This PRD defines the database schema and authentication system for Seriously AI, a credit-based research-to-content platform. The feature enables users to securely sign up via magic-link or Google OAuth, manages their data isolation through Row Level Security (RLS), and enforces credit-based quotas for pipeline usage. This foundational system supports the MVP's core functionality of transforming research into AI-drafted content while maintaining user privacy and resource management.

## Goals

1. **Enable secure user registration** through multiple authentication methods (magic-link and Google OAuth)
2. **Implement data isolation** ensuring users only access their own content via Supabase RLS
3. **Create a credit wallet system** that tracks usage and enforces quotas based on subscription tiers
4. **Establish database schema** supporting the core entities: users, research reports, insights, and drafts
5. **Provide seamless session management** with 7-day sessions and refresh tokens for busy professionals
6. **Build protected route middleware** that enforces authentication and plan-based access control

## User Stories

1. **As a busy professional**, I want to sign up quickly using my Google account so that I can start using the platform without creating another password.

2. **As a security-conscious user**, I want to use magic-link authentication so that I don't have to manage passwords and my account remains secure.

3. **As an existing user**, I want to link both Google OAuth and magic-link to my account so that I have flexible login options.

4. **As a free tier user**, I want to see my remaining credits clearly so that I know when to upgrade my plan.

5. **As a paying customer**, I want my credit transactions tracked transparently so that I can understand my usage patterns.

6. **As a user**, I want my research reports and drafts to be private so that my competitive insights remain confidential.

## Functional Requirements

### Database Schema Requirements

1. **The system must create a `user_profiles` table** extending Supabase auth.users with:
   - `id` (UUID, foreign key to auth.users)
   - `email` (unique, not null)
   - `display_name` (text)
   - `avatar_url` (text)
   - `timezone` (text, default: 'UTC')
   - `preferred_platform` (enum: 'linkedin', 'x', default: 'linkedin')
   - `onboarding_completed` (boolean, default: false)
   - `referral_code` (text, unique)
   - `created_at`, `updated_at` timestamps

2. **The system must create a `credit_wallet` table** with:
   - `id` (UUID)
   - `user_id` (UUID, foreign key to users)
   - `balance` (integer, default: 50 for free tier)
   - `plan_tier` (enum: 'starter', 'plus', 'pro')
   - `last_refill` (timestamp)
   - `next_refill` (timestamp)

3. **The system must create a `credit_transactions` table** for audit trail:
   - `id` (UUID)
   - `user_id` (UUID, foreign key to users)
   - `amount` (integer, positive for credits added, negative for deducted)
   - `balance_after` (integer)
   - `operation_type` (enum: 'refill', 'purchase', 'deduction')
   - `description` (text)
   - `job_id` (UUID, nullable)
   - `created_at` (timestamp)

4. **The system must create a `research_reports` table** with:
   - `id` (UUID)
   - `user_id` (UUID, foreign key to users)
   - `topic` (text)
   - `summary_md` (text)
   - `articles_scanned` (integer)
   - `insight_count` (integer)
   - `job_id` (UUID)
   - `expires_at` (timestamp, 180 days from creation)
   - `generated_at` (timestamp)

5. **The system must create an `insights` table** with:
   - `id` (UUID)
   - `report_id` (UUID, foreign key to research_reports)
   - `user_id` (UUID, foreign key to users)
   - `content_md` (text)
   - `citation_url` (text)
   - `citation_title` (text)
   - `citation_source` (text)
   - `embedding` (vector(1536))
   - `relevance_score` (float)
   - `saved_to_library` (boolean, default: false)
   - `created_at` (timestamp)

6. **The system must create a `drafts` table** with:
   - `id` (UUID)
   - `user_id` (UUID, foreign key to users)
   - `insight_ids` (UUID array)
   - `template_id` (text)
   - `platform` (enum: 'linkedin', 'x')
   - `content_md` (text)
   - `version` (integer)
   - `job_id` (UUID)
   - `created_at`, `updated_at` timestamps

### Authentication Requirements

7. **The system must implement Google OAuth** with:
   - Supabase Google provider configuration
   - Avatar URL extraction from Google profile
   - Email as primary identifier

8. **The system must implement magic-link authentication** with:
   - 15-minute link expiration
   - Resend functionality
   - Email delivery via Supabase

9. **The system must allow account linking** where users can connect both auth methods using email as the common identifier

10. **The system must implement session management** with:
    - 7-day session duration
    - JWT refresh tokens
    - Automatic session refresh
    - Explicit logout functionality

### Row Level Security (RLS) Requirements

11. **The system must implement RLS policies** ensuring:
    - Users can only read/write their own records in `credit_wallet`, `research_reports`, `insights`, `drafts`
    - Users can read their own profile data
    - Credit transactions are read-only for users
    - System service role bypasses RLS for background jobs

12. **The system must enforce atomic credit operations** where credit deduction and resource creation happen in the same transaction

### Protected Route Requirements

13. **The system must create middleware** that:
    - Validates Supabase session tokens
    - Redirects unauthenticated users to `/auth/login`
    - Checks credit balance for paid operations
    - Enforces plan-based feature access

14. **The system must define route protection levels**:
    - Public: `/`, `/auth/*`, `/pricing`
    - Authenticated: `/new`, `/report/*`, `/draft/*`, `/library`, `/settings`
    - Paid features: Deep Discovery pipeline (requires credit check)

### Error Handling Requirements

15. **The system must handle authentication errors** with:
    - User-friendly messages avoiding technical jargon
    - "Resend magic link" option for expired links
    - Fallback to alternative auth method on OAuth failure
    - Clear quota exceeded messages with upgrade prompts

### Performance Requirements

16. **The system must optimize for** 100 concurrent users with:
    - Redis caching for credit balance (60-second TTL)
    - Database indexes on `user_id`, `created_at` for report queries
    - pgvector indexes for insight similarity search
    - Connection pooling via Supabase

## Non-Goals (Out of Scope)

1. Two-factor authentication (2FA)
2. Social login providers beyond Google
3. Team/workspace management (deferred to LATER phase)
4. Public sharing of reports or insights
5. Password-based authentication
6. User data export functionality
7. SAML/Enterprise SSO
8. Account deletion self-service

## Design Considerations

### UI/UX Requirements
- Clean, minimal auth forms matching the "beautiful and modern UI" requirement
- Clear credit balance display in navigation
- Toast notifications for auth state changes
- Loading states during OAuth redirects
- Mobile-responsive auth flows

### Component Structure
- Use Next.js 14 App Router with React Server Components
- Shadcn/ui components for forms and UI elements
- Supabase auth helpers for Next.js
- Protected route layouts using middleware

## Technical Considerations

### Stack Alignment
- **Database**: Supabase Postgres (EU region for GDPR)
- **Auth**: Supabase Auth with magic-link and Google OAuth
- **Caching**: Upstash Redis for credit balance
- **Framework**: Next.js 14 with App Router
- **Type Safety**: TypeScript with generated types from Supabase

### Security
- All database access through RLS policies
- Environment variables for sensitive configuration
- HTTPS-only cookie settings
- Secure session token handling

### Integration Points
- Stripe webhook handlers must update credit_wallet
- Pipeline orchestrator must validate credits before job execution
- Background jobs need service role access

## Success Metrics

1. **Authentication Success Rate**: > 95% successful login attempts
2. **Time to First Auth**: < 30 seconds from landing to authenticated
3. **Session Persistence**: < 2% unexpected logouts per week
4. **Credit System Accuracy**: 100% accurate credit tracking (no disputed transactions)
5. **RLS Effectiveness**: 0 data leaks between users
6. **Page Load Performance**: < 200ms for authenticated route checks

## Open Questions

1. Should we implement a grace period for recently expired subscriptions?
2. How should we handle users who sign up with different emails via OAuth vs magic-link?
3. Should credit refills happen exactly at midnight UTC or user's timezone?
4. Do we need audit logs for all database operations or just credit transactions?
5. Should we implement rate limiting on authentication attempts?
6. How do we handle email changes for existing users?
7. Should we pre-generate referral codes or create on-demand?

---

*Last updated: December 19, 2024* 