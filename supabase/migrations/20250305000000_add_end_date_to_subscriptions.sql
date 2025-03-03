-- Add end_date column to subscriptions table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'end_date'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN end_date TIMESTAMPTZ;
  END IF;
END
$$;
