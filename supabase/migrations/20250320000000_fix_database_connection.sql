-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  stripe_customer_id TEXT,
  subscription_status TEXT
);

-- Create subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'free',
  tier TEXT,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ DEFAULT NULL,
  status TEXT DEFAULT 'active',
  stripe_subscription_id TEXT,
  question_limit INTEGER DEFAULT 10,
  perfect_response_limit INTEGER DEFAULT 5,
  perfect_responses_used INTEGER DEFAULT 0
);

-- Create questions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  type TEXT NOT NULL,
  difficulty TEXT,
  sample_response TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create responses table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  transcript TEXT,
  audio_url TEXT,
  situation TEXT,
  task TEXT,
  action TEXT,
  result TEXT,
  notes JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create feedback table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  response_id UUID NOT NULL REFERENCES public.responses(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  score NUMERIC NOT NULL,
  situation_score NUMERIC,
  task_score NUMERIC,
  action_score NUMERIC,
  result_score NUMERIC,
  rating NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create usage_stats table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.usage_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create usage_limits table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.usage_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_type TEXT NOT NULL,
  question_limit INTEGER DEFAULT 10,
  perfect_response_limit INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default usage limits if they don't exist
INSERT INTO public.usage_limits (plan_type, question_limit, perfect_response_limit)
VALUES 
  ('free', 10, 5),
  ('premium', -1, -1)
ON CONFLICT (id) DO NOTHING;

-- Insert some sample questions if they don't exist
INSERT INTO public.questions (text, type, difficulty)
VALUES 
  ('How would you improve Instagram''s Reels feature?', 'product_sense', 'medium'),
  ('Design a new feature for a food delivery app', 'product_sense', 'medium'),
  ('Tell me about a time you had to make a difficult decision', 'behavioral', 'medium'),
  ('Describe a situation where you had to work with a difficult team member', 'behavioral', 'medium')
ON CONFLICT DO NOTHING;

-- Disable RLS on all tables for now to ensure access
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_limits DISABLE ROW LEVEL SECURITY;
