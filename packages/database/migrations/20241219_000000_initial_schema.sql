-- Initial schema migration for Seriously AI
-- Migration: 20241219_000000_initial_schema

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
  INSERT INTO user_profiles (id, email)
  VALUES (NEW.id, NEW.email);
  
  INSERT INTO credit_wallet (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile and wallet on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

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