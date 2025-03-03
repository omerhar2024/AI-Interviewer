-- Add missing columns to subscriptions table if they don't exist

-- Add question_limit column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'subscriptions' 
                   AND column_name = 'question_limit') THEN
        ALTER TABLE public.subscriptions ADD COLUMN question_limit INTEGER DEFAULT 10;
    END IF;
END$$;

-- Add perfect_response_limit column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'subscriptions' 
                   AND column_name = 'perfect_response_limit') THEN
        ALTER TABLE public.subscriptions ADD COLUMN perfect_response_limit INTEGER DEFAULT 5;
    END IF;
END$$;

-- Add perfect_responses_used column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'subscriptions' 
                   AND column_name = 'perfect_responses_used') THEN
        ALTER TABLE public.subscriptions ADD COLUMN perfect_responses_used INTEGER DEFAULT 0;
    END IF;
END$$;

-- Add end_date column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'subscriptions' 
                   AND column_name = 'end_date') THEN
        ALTER TABLE public.subscriptions ADD COLUMN end_date TIMESTAMPTZ;
    END IF;
END$$;

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'subscriptions' 
                   AND column_name = 'updated_at') THEN
        ALTER TABLE public.subscriptions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;
END$$;
