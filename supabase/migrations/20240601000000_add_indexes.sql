-- Add indexes for frequently queried columns

-- Users table
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Questions table
CREATE INDEX IF NOT EXISTS idx_questions_type ON public.questions(type);

-- Responses table
CREATE INDEX IF NOT EXISTS idx_responses_user_id ON public.responses(user_id);
CREATE INDEX IF NOT EXISTS idx_responses_question_id ON public.responses(question_id);
CREATE INDEX IF NOT EXISTS idx_responses_created_at ON public.responses(created_at DESC);

-- Feedback table
CREATE INDEX IF NOT EXISTS idx_feedback_response_id ON public.feedback(response_id);

-- Subscriptions table
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_type ON public.subscriptions(plan_type);

-- Enable RLS for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;

-- Create policies for users to access their own data
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Questions are public read-only
CREATE POLICY "Questions are viewable by all users" ON public.questions
  FOR SELECT USING (true);

-- Responses policies
CREATE POLICY "Users can view their own responses" ON public.responses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own responses" ON public.responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own responses" ON public.responses
  FOR UPDATE USING (auth.uid() = user_id);

-- Feedback policies
CREATE POLICY "Users can view feedback on their responses" ON public.feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.responses
      WHERE responses.id = feedback.response_id
      AND responses.user_id = auth.uid()
    )
  );

-- Subscriptions policies
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Enable realtime for feedback table
ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback;
