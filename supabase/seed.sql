-- Seed data for Seriously AI development environment
-- This script populates tables with test data for development and testing

-- Insert test users into auth.users (simulates Supabase auth)
-- Note: In real environment, these would be created by Supabase Auth
INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'john.doe@example.com', NOW(), NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'jane.smith@example.com', NOW(), NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'alex.chen@example.com', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert user profiles (these will be created by trigger in real scenario)
INSERT INTO user_profiles (id, email, display_name, avatar_url, timezone, preferred_platform, onboarding_completed, referral_code) VALUES
  ('11111111-1111-1111-1111-111111111111', 'john.doe@example.com', 'John Doe', 'https://avatars.githubusercontent.com/u/1?v=4', 'America/New_York', 'linkedin', true, 'REF001'),
  ('22222222-2222-2222-2222-222222222222', 'jane.smith@example.com', 'Jane Smith', 'https://avatars.githubusercontent.com/u/2?v=4', 'Europe/London', 'x', true, 'REF002'),
  ('33333333-3333-3333-3333-333333333333', 'alex.chen@example.com', 'Alex Chen', 'https://avatars.githubusercontent.com/u/3?v=4', 'Asia/Tokyo', 'linkedin', false, 'REF003')
ON CONFLICT (id) DO NOTHING;

-- Insert credit wallets with different plan tiers
INSERT INTO credit_wallet (user_id, balance, plan_tier, last_refill, next_refill) VALUES
  ('11111111-1111-1111-1111-111111111111', 45, 'starter', NOW() - INTERVAL '10 days', NOW() + INTERVAL '20 days'),
  ('22222222-2222-2222-2222-222222222222', 480, 'plus', NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days'),
  ('33333333-3333-3333-3333-333333333333', 1450, 'pro', NOW() - INTERVAL '2 days', NOW() + INTERVAL '28 days')
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample credit transactions
INSERT INTO credit_transactions (user_id, amount, balance_after, operation_type, description, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 50, 50, 'refill', 'Monthly starter plan refill', NOW() - INTERVAL '10 days'),
  ('11111111-1111-1111-1111-111111111111', -5, 45, 'deduction', 'Basic Discovery pipeline execution', NOW() - INTERVAL '2 days'),
  
  ('22222222-2222-2222-2222-222222222222', 500, 500, 'refill', 'Monthly plus plan refill', NOW() - INTERVAL '5 days'),
  ('22222222-2222-2222-2222-222222222222', -10, 490, 'deduction', 'Deep Discovery pipeline execution', NOW() - INTERVAL '3 days'),
  ('22222222-2222-2222-2222-222222222222', -10, 480, 'deduction', 'Deep Discovery pipeline execution', NOW() - INTERVAL '1 day'),
  
  ('33333333-3333-3333-3333-333333333333', 1500, 1500, 'refill', 'Monthly pro plan refill', NOW() - INTERVAL '2 days'),
  ('33333333-3333-3333-3333-333333333333', -10, 1490, 'deduction', 'Deep Discovery pipeline execution', NOW() - INTERVAL '1 day'),
  ('33333333-3333-3333-3333-333333333333', -5, 1485, 'deduction', 'Basic Discovery pipeline execution', NOW() - INTERVAL '12 hours'),
  ('33333333-3333-3333-3333-333333333333', -1, 1484, 'deduction', 'Draft generation', NOW() - INTERVAL '6 hours'),
  ('33333333-3333-3333-3333-333333333333', -34, 1450, 'deduction', 'Multiple pipeline executions', NOW() - INTERVAL '1 hour');

-- Insert sample research reports
INSERT INTO research_reports (id, user_id, topic, summary_md, articles_scanned, insight_count, job_id, generated_at) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'AI in Product Management', '## Key Findings\n\nAI is transforming product management through automated user research, predictive analytics, and intelligent roadmap prioritization. Key trends include AI-powered user feedback analysis and automated A/B testing.', 15, 8, 'job_001', NOW() - INTERVAL '2 days'),
  
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Remote Work Productivity Tools', '## Summary\n\nThe remote work landscape continues evolving with new productivity tools focusing on asynchronous collaboration, AI-powered scheduling, and virtual presence technologies.', 22, 12, 'job_002', NOW() - INTERVAL '1 day'),
  
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'Blockchain in Supply Chain', '## Research Overview\n\nBlockchain technology is gaining traction in supply chain management for transparency, traceability, and reducing fraud. Major companies are piloting blockchain solutions.', 18, 10, 'job_003', NOW() - INTERVAL '12 hours');

-- Insert sample insights
INSERT INTO insights (id, report_id, user_id, content_md, citation_url, citation_title, citation_source, relevance_score, saved_to_library) VALUES
  ('insight01-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 
   'AI-powered user feedback analysis can process 10x more customer comments than manual review, identifying sentiment patterns and feature requests with 95% accuracy.',
   'https://techcrunch.com/ai-product-management', 'AI Transforms Product Management Workflows', 'TechCrunch', 0.92, true),
   
  ('insight02-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
   'Predictive analytics in product roadmaps can forecast feature adoption rates with 80% accuracy, helping PMs prioritize development resources more effectively.',
   'https://producthq.com/predictive-roadmaps', 'The Future of Product Roadmaps', 'ProductHQ', 0.88, true),
   
  ('insight03-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222',
   'Asynchronous collaboration tools have increased remote team productivity by 35%, with video messages replacing 60% of real-time meetings.',
   'https://remoteweek.com/async-productivity', 'Async Tools Drive Remote Productivity', 'Remote Week', 0.94, true),
   
  ('insight04-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222',
   'AI-powered scheduling assistants reduce calendar conflicts by 70% and save knowledge workers an average of 3 hours per week.',
   'https://futureofwork.com/ai-scheduling', 'AI Scheduling Revolution', 'Future of Work', 0.85, false),
   
  ('insight05-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333',
   'Blockchain implementation in supply chains reduces fraud by 60% and improves traceability compliance by 85%, according to recent enterprise pilots.',
   'https://supplychaintech.com/blockchain-results', 'Blockchain Delivers Supply Chain Results', 'Supply Chain Tech', 0.91, true),
   
  ('insight06-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333',
   'Major retailers like Walmart and Carrefour report 40% faster product recall processes using blockchain-based tracking systems.',
   'https://retailtech.com/blockchain-recalls', 'Blockchain Speeds Product Recalls', 'Retail Tech', 0.87, true);

-- Insert sample drafts
INSERT INTO drafts (id, user_id, insight_ids, template_id, platform, content_md, version, job_id) VALUES
  ('draft001-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 
   ARRAY['insight01-1111-1111-1111-111111111111', 'insight02-1111-1111-1111-111111111111'], 
   'linkedin_insight_post', 'linkedin',
   '🤖 AI is revolutionizing product management in ways we couldn''t imagine just 2 years ago.\n\nTwo game-changing developments:\n\n✅ AI feedback analysis processes 10x more customer comments with 95% accuracy\n✅ Predictive roadmaps forecast feature adoption with 80% accuracy\n\nThis means PMs can finally focus on strategy instead of drowning in data.\n\nWhat AI tools are transforming your product workflow?',
   1, 'draft_job_001'),
   
  ('draft002-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
   ARRAY['insight03-2222-2222-2222-222222222222'],
   'x_thread_starter', 'x',
   'Remote work isn''t just surviving—it''s thriving 📈\n\nAsync collaboration tools just increased team productivity by 35%\n\nVideo messages are replacing 60% of real-time meetings\n\nThe future of work is asynchronous 🧵',
   1, 'draft_job_002'),
   
  ('draft003-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333',
   ARRAY['insight05-3333-3333-3333-333333333333', 'insight06-3333-3333-3333-333333333333'],
   'linkedin_case_study', 'linkedin',
   '🔗 Blockchain in supply chains: From hype to results\n\nReal enterprise data:\n• 60% reduction in fraud\n• 85% better traceability compliance\n• 40% faster product recalls (Walmart, Carrefour)\n\nThe technology is finally delivering on its promises.\n\nAre you seeing blockchain adoption in your industry?',
   1, 'draft_job_003');

-- Update sequences to avoid conflicts
SELECT setval(pg_get_serial_sequence('user_profiles', 'id'), (SELECT MAX(id) FROM user_profiles) + 1);
SELECT setval(pg_get_serial_sequence('credit_wallet', 'id'), (SELECT MAX(id) FROM credit_wallet) + 1);
SELECT setval(pg_get_serial_sequence('credit_transactions', 'id'), (SELECT MAX(id) FROM credit_transactions) + 1);
SELECT setval(pg_get_serial_sequence('research_reports', 'id'), (SELECT MAX(id) FROM research_reports) + 1);
SELECT setval(pg_get_serial_sequence('insights', 'id'), (SELECT MAX(id) FROM insights) + 1);
SELECT setval(pg_get_serial_sequence('drafts', 'id'), (SELECT MAX(id) FROM drafts) + 1); 