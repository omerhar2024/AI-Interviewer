-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE,
  subscription_status TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('product_sense', 'behavioral')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create responses table
CREATE TABLE IF NOT EXISTS public.responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  question_id UUID REFERENCES public.questions(id),
  audio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transcripts table
CREATE TABLE IF NOT EXISTS public.transcripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  response_id UUID REFERENCES public.responses(id),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  response_id UUID REFERENCES public.responses(id),
  score NUMERIC,
  text TEXT,
  rating INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  plan_type TEXT DEFAULT 'free',
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ
);

-- Insert initial questions
INSERT INTO public.questions (text, type) VALUES
('How would you improve Instagram Stories?', 'product_sense'),
('Tell me about a time you had to make a difficult decision', 'behavioral'),
('Design a product for elderly people to stay connected', 'product_sense'),
('How would you measure the success of Facebook Groups?', 'product_sense'),
('Describe a situation where you had to influence others', 'behavioral');

-- Set up storage
INSERT INTO storage.buckets (id, name, public) VALUES ('recordings', 'recordings', true);

-- Set up storage policies
CREATE POLICY "Authenticated users can upload recordings"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'recordings');

CREATE POLICY "Authenticated users can update their recordings"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can delete their recordings"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can read recordings"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'recordings');
