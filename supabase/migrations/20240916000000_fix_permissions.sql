-- Fix permissions for the subscriptions table

-- Enable row level security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for the subscriptions table
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;
CREATE POLICY "Users can update their own subscription"
  ON public.subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscriptions;
CREATE POLICY "Users can insert their own subscription"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin can manage all subscriptions" ON public.subscriptions;
CREATE POLICY "Admin can manage all subscriptions"
  ON public.subscriptions
  USING ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'omerhar2024@gmail.com');

-- Fix permissions for the users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for the users table
DROP POLICY IF EXISTS "Users can view their own user" ON public.users;
CREATE POLICY "Users can view their own user"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admin can manage all users" ON public.users;
CREATE POLICY "Admin can manage all users"
  ON public.users
  USING ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'omerhar2024@gmail.com');
