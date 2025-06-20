-- Initial database schema with RLS policies for Seriously AI
-- ✅ DEPLOYED: 2025-06-20 - Authentication system working with Google OAuth
-- ✅ TESTED: User profile and credit wallet creation via triggers

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create custom types
CREATE TYPE platform_type AS ENUM ('linkedin', 'x');
CREATE TYPE plan_tier AS ENUM ('starter', 'plus', 'pro');
CREATE TYPE operation_type AS ENUM ('refill', 'purchase', 'deduction');

-- User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  preferred_platform platform_type DEFAULT 'linkedin',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  referral_code TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit wallet table
CREATE TABLE IF NOT EXISTS credit_wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  balance INTEGER DEFAULT 50 CHECK (balance >= 0),
  plan_tier plan_tier DEFAULT 'starter',
  last_refill TIMESTAMPTZ DEFAULT NOW(),
  next_refill TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit transactions table (audit trail)
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  operation_type operation_type NOT NULL,
  description TEXT,
  job_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Research reports table
CREATE TABLE IF NOT EXISTS research_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  summary_md TEXT,
  articles_scanned INTEGER DEFAULT 0,
  insight_count INTEGER DEFAULT 0,
  job_id UUID,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '180 days'),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insights table
CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES research_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  content_md TEXT NOT NULL,
  citation_url TEXT,
  citation_title TEXT,
  citation_source TEXT,
  embedding vector(1536),
  relevance_score FLOAT,
  saved_to_library BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drafts table
CREATE TABLE IF NOT EXISTS drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  insight_ids UUID[] NOT NULL,
  template_id TEXT,
  platform platform_type NOT NULL,
  content_md TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  job_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credit_wallet_updated_at
  BEFORE UPDATE ON credit_wallet
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drafts_updated_at
  BEFORE UPDATE ON drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to initialize user profile and credit wallet on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, SPLIT_PART(NEW.email, '@', 1))
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.credit_wallet (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle user profile updates on auth metadata changes
-- Fixed version that works with actual Supabase auth.users schema
CREATE OR REPLACE FUNCTION handle_user_profile_sync()
RETURNS TRIGGER AS $$
BEGIN
  -- Simply update email if profile exists, or create basic profile
  UPDATE public.user_profiles SET
    email = NEW.email,
    updated_at = NOW()
  WHERE id = NEW.id;
  
  -- Create profile if it doesn't exist
  IF NOT FOUND THEN
    INSERT INTO public.user_profiles (
      id, 
      email, 
      display_name
    ) VALUES (
      NEW.id, 
      NEW.email, 
      SPLIT_PART(NEW.email, '@', 1)
    );
    
    -- Also create credit wallet if profile didn't exist
    INSERT INTO public.credit_wallet (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile and wallet on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Trigger to sync user profile data on auth metadata updates
-- Note: Simplified trigger without WHEN clause to avoid column reference issues
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_profile_sync();

-- Create indexes for performance optimization
-- User-based queries
CREATE INDEX idx_credit_wallet_user_id ON credit_wallet(user_id);
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_research_reports_user_id ON research_reports(user_id);
CREATE INDEX idx_insights_user_id ON insights(user_id);
CREATE INDEX idx_drafts_user_id ON drafts(user_id);

-- Time-based queries
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX idx_research_reports_created_at ON research_reports(created_at DESC);
CREATE INDEX idx_insights_created_at ON insights(created_at DESC);
CREATE INDEX idx_drafts_created_at ON drafts(created_at DESC);

-- Composite indexes for common query patterns
CREATE INDEX idx_research_reports_user_created ON research_reports(user_id, created_at DESC);
CREATE INDEX idx_insights_user_created ON insights(user_id, created_at DESC);
CREATE INDEX idx_insights_report_id ON insights(report_id);

-- Vector similarity search index
CREATE INDEX idx_insights_embedding ON insights USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Index for saved insights filtering
CREATE INDEX idx_insights_saved_library ON insights(saved_to_library) WHERE saved_to_library = TRUE;

-- TTL cleanup function for expired research reports
CREATE OR REPLACE FUNCTION cleanup_expired_reports()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete research reports that have passed their expiration date
  -- This will cascade delete related insights due to foreign key constraints
  DELETE FROM research_reports 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the cleanup operation
  INSERT INTO credit_transactions (
    user_id, 
    amount, 
    balance_after, 
    operation_type, 
    description
  )
  SELECT 
    '00000000-0000-0000-0000-000000000000'::UUID, -- System user
    0,
    0,
    'refill'::operation_type,
    'TTL cleanup: ' || deleted_count || ' expired reports removed'
  WHERE deleted_count > 0;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index on expires_at for efficient cleanup queries  
CREATE INDEX idx_research_reports_expires_at ON research_reports(expires_at);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policies: SELECT - Users can only see their own data

-- User profiles: users can view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Credit wallet: users can view their own wallet
CREATE POLICY "Users can view own credit wallet" ON credit_wallet
  FOR SELECT USING (auth.uid() = user_id);

-- Credit transactions: READ-ONLY for users (audit trail protection)
CREATE POLICY "Users can view own credit transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Note: Credit transactions are strictly READ-ONLY for users
-- No INSERT, UPDATE, or DELETE policies for users to maintain audit integrity
-- Only service role can modify credit transactions through system operations

-- Research reports: users can view their own reports
CREATE POLICY "Users can view own research reports" ON research_reports
  FOR SELECT USING (auth.uid() = user_id);

-- Insights: users can view their own insights
CREATE POLICY "Users can view own insights" ON insights
  FOR SELECT USING (auth.uid() = user_id);

-- Drafts: users can view their own drafts
CREATE POLICY "Users can view own drafts" ON drafts
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies: INSERT - Users can create their own records

-- User profiles: users can insert their own profile (during signup/profile creation)
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Credit wallet: users can insert their own wallet (during signup)
CREATE POLICY "Users can insert own credit wallet" ON credit_wallet
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Credit transactions: NO INSERT POLICY for users (READ-ONLY enforcement)
-- Note: Credit transactions should only be created by system functions/triggers
-- Users cannot directly insert credit transactions for security and audit integrity

-- Research reports: users can create their own reports
CREATE POLICY "Users can insert own research reports" ON research_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insights: users can create insights for their own reports
CREATE POLICY "Users can insert own insights" ON insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Drafts: users can create their own drafts
CREATE POLICY "Users can insert own drafts" ON drafts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies: UPDATE - Users can modify their own records

-- User profiles: users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Credit wallet: restrict to service role only (system-managed)
-- Note: Credit wallet should only be updated by system functions for security
-- Users cannot directly modify their credit balance

-- Credit transactions: no updates allowed (immutable audit trail)
-- Note: Credit transactions are immutable for audit purposes

-- Research reports: users can update their own reports
CREATE POLICY "Users can update own research reports" ON research_reports
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Insights: users can update their own insights (e.g., saved_to_library flag)
CREATE POLICY "Users can update own insights" ON insights
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Drafts: users can update their own drafts
CREATE POLICY "Users can update own drafts" ON drafts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies: DELETE - Users can delete their own records where applicable

-- User profiles: no delete policy (handled by account deletion cascade)
-- Note: User profile deletion should be handled through account deletion process

-- Credit wallet: no delete policy (system-managed)
-- Note: Credit wallet should persist and be managed by the system

-- Credit transactions: no delete policy (immutable audit trail)
-- Note: Credit transactions must remain for audit and compliance purposes

-- Research reports: users can delete their own reports
CREATE POLICY "Users can delete own research reports" ON research_reports
  FOR DELETE USING (auth.uid() = user_id);

-- Insights: users can delete their own insights
CREATE POLICY "Users can delete own insights" ON insights
  FOR DELETE USING (auth.uid() = user_id);

-- Drafts: users can delete their own drafts
CREATE POLICY "Users can delete own drafts" ON drafts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: Service Role Bypass - Allow system operations

-- Service role policies for credit_wallet (system credit operations)
CREATE POLICY "Service role can manage credit wallets" ON credit_wallet
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Service role policies for credit_transactions (system transaction logging)
CREATE POLICY "Service role can manage credit transactions" ON credit_transactions
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Service role policies for user_profiles (profile sync and management)
CREATE POLICY "Service role can manage user profiles" ON user_profiles
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Service role policies for research_reports (cleanup and management)
CREATE POLICY "Service role can manage research reports" ON research_reports
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Service role policies for insights (cleanup and management)
CREATE POLICY "Service role can manage insights" ON insights
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Service role policies for drafts (cleanup and management)
CREATE POLICY "Service role can manage drafts" ON drafts
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role'); 