# Row Level Security (RLS) Policies Documentation

This document outlines all Row Level Security policies implemented in the Seriously AI database, explaining access patterns, security rationale, and usage guidelines.

## Overview

Row Level Security (RLS) is enabled on all tables to ensure complete data isolation between users while allowing system operations to function properly. The security model uses two primary roles:

- **Authenticated Users**: Can only access their own data
- **Service Role**: Can access all data for system operations

## Table-by-Table Policy Reference

### 1. user_profiles

**Purpose**: Extends Supabase auth.users with application-specific profile data.

**RLS Policies:**
```sql
-- SELECT: Users can view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- INSERT: Users can create their own profile
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- UPDATE: Users can modify their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Service role has full access
CREATE POLICY "Service role can manage user profiles" ON user_profiles
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
```

**Access Patterns:**
- ✅ Users can read/update their display_name, avatar_url, timezone, etc.
- ✅ Profile creation handled by auth triggers
- ❌ Users cannot delete profiles (handled by account deletion)
- ✅ Service role can sync profiles from OAuth providers

### 2. credit_wallet

**Purpose**: Tracks user credit balances and plan tiers.

**RLS Policies:**
```sql
-- SELECT: Users can view their own wallet
CREATE POLICY "Users can view own credit wallet" ON credit_wallet
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT: Users can create their own wallet (signup only)
CREATE POLICY "Users can insert own credit wallet" ON credit_wallet
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role has full access for credit operations
CREATE POLICY "Service role can manage credit wallets" ON credit_wallet
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
```

**Access Patterns:**
- ✅ Users can view their balance and plan_tier
- ❌ Users cannot directly modify balance (security)
- ❌ Users cannot update plan_tier directly (billing system)
- ✅ Service role handles credit refills, deductions, plan upgrades

**Security Rationale:**
- Prevents users from crediting themselves
- Ensures all credit operations go through audited system functions
- Maintains financial integrity

### 3. credit_transactions

**Purpose**: Immutable audit trail of all credit operations.

**RLS Policies:**
```sql
-- SELECT: Users can view their own transactions (READ-ONLY)
CREATE POLICY "Users can view own credit transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Service role has full access for transaction logging
CREATE POLICY "Service role can manage credit transactions" ON credit_transactions
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
```

**Access Patterns:**
- ✅ Users can view their transaction history
- ❌ Users cannot INSERT transactions (system-only)
- ❌ Users cannot UPDATE transactions (immutable audit)
- ❌ Users cannot DELETE transactions (compliance)
- ✅ Service role logs all credit operations

**Security Rationale:**
- Maintains immutable financial audit trail
- Prevents transaction tampering
- Ensures compliance with financial regulations
- All credit operations must go through system functions

### 4. research_reports

**Purpose**: Stores AI-generated research reports from user prompts.

**RLS Policies:**
```sql
-- SELECT: Users can view their own reports
CREATE POLICY "Users can view own research reports" ON research_reports
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT: Users can create their own reports
CREATE POLICY "Users can insert own research reports" ON research_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can modify their own reports
CREATE POLICY "Users can update own research reports" ON research_reports
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own reports
CREATE POLICY "Users can delete own research reports" ON research_reports
  FOR DELETE USING (auth.uid() = user_id);

-- Service role has full access for cleanup
CREATE POLICY "Service role can manage research reports" ON research_reports
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
```

**Access Patterns:**
- ✅ Users have full CRUD access to their reports
- ✅ Users can delete old reports to save space
- ✅ Service role can run cleanup jobs (expired reports)
- ✅ Pipeline workers create reports on behalf of users

### 5. insights

**Purpose**: Individual insights extracted from research reports.

**RLS Policies:**
```sql
-- SELECT: Users can view their own insights
CREATE POLICY "Users can view own insights" ON insights
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT: Users can create insights for their reports
CREATE POLICY "Users can insert own insights" ON insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can modify their insights
CREATE POLICY "Users can update own insights" ON insights
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their insights
CREATE POLICY "Users can delete own insights" ON insights
  FOR DELETE USING (auth.uid() = user_id);

-- Service role has full access
CREATE POLICY "Service role can manage insights" ON insights
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
```

**Access Patterns:**
- ✅ Users can save/unsave insights (saved_to_library flag)
- ✅ Users can delete unwanted insights
- ✅ Pipeline workers create insights during research
- ✅ Service role can perform bulk operations

### 6. drafts

**Purpose**: AI-generated content drafts based on selected insights.

**RLS Policies:**
```sql
-- SELECT: Users can view their own drafts
CREATE POLICY "Users can view own drafts" ON drafts
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT: Users can create their own drafts
CREATE POLICY "Users can insert own drafts" ON drafts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can modify their own drafts
CREATE POLICY "Users can update own drafts" ON drafts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own drafts
CREATE POLICY "Users can delete own drafts" ON drafts
  FOR DELETE USING (auth.uid() = user_id);

-- Service role has full access
CREATE POLICY "Service role can manage drafts" ON drafts
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
```

**Access Patterns:**
- ✅ Users can edit and regenerate drafts
- ✅ Users can delete drafts they don't want
- ✅ Draft service creates drafts on behalf of users
- ✅ Service role can perform cleanup operations

## Security Model Summary

### User-Level Security
- **Data Isolation**: Users can only access data where `auth.uid() = user_id`
- **Financial Protection**: Users cannot modify credit balances or transactions
- **Content Ownership**: Users have full control over their content (reports, insights, drafts)

### System-Level Security
- **Service Role Bypass**: System operations use service_role for cross-user access
- **Audit Trail**: All financial operations are logged and immutable
- **Automated Cleanup**: Background jobs can clean expired content

## Development Guidelines

### For Application Developers

1. **Always use authenticated context**: Ensure `auth.uid()` is available in requests
2. **Respect read-only tables**: Never try to directly modify credit_transactions
3. **Use service role sparingly**: Only for legitimate system operations
4. **Test with multiple users**: Verify data isolation in development

### For System Operations

1. **Use service role**: Background jobs must authenticate as service_role
2. **Log all operations**: Especially credit-related transactions
3. **Respect user data**: Only access what's needed for the operation
4. **Handle errors gracefully**: RLS violations should be caught and logged

## Common Patterns

### Checking User's Credit Balance
```sql
-- ✅ Correct: Uses RLS automatically
SELECT balance FROM credit_wallet WHERE user_id = auth.uid();

-- ❌ Wrong: Trying to access other user's balance
SELECT balance FROM credit_wallet WHERE user_id = 'other-user-id';
```

### Creating User Content
```sql
-- ✅ Correct: User creates their own content
INSERT INTO research_reports (user_id, topic) 
VALUES (auth.uid(), 'AI Trends');

-- ❌ Wrong: Trying to create content for another user
INSERT INTO research_reports (user_id, topic) 
VALUES ('other-user-id', 'Hacking attempt');
```

### System Operations (Service Role)
```sql
-- ✅ Correct: Service role can update any user's credits
UPDATE credit_wallet 
SET balance = balance + 500 
WHERE user_id = 'any-user-id';

-- Must be executed with service role authentication
```

## Troubleshooting

### Common RLS Errors

1. **"Policy violation" on SELECT**: User trying to access another user's data
2. **"Insufficient privilege" on INSERT**: User trying to create unauthorized records
3. **"No policy found" errors**: RLS enabled but no policies created

### Debugging RLS Issues

```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- List all policies
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public';

-- Test auth context
SELECT auth.uid(), auth.role();
```

## Testing

Run the comprehensive test suite:
```bash
# See packages/database/README-RLS-Tests.md for details
supabase db run rls-tests.sql
```

## Monitoring

### Key Metrics to Track
- RLS policy violations (security incidents)
- Service role usage patterns
- Query performance impact
- User access patterns

### Alerts to Set Up
- Unusual service role activity
- High RLS violation rates
- Performance degradation on protected tables

---

*This documentation should be updated whenever RLS policies are modified or new tables are added.* 