-- Add role field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Create premium_access_grants table
CREATE TABLE IF NOT EXISTS premium_access_grants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  plan_type TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add sample_response and difficulty fields to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS sample_response TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'medium';

-- Create analytics_events table for tracking user actions
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_premium_access_grants_user_id ON premium_access_grants(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_access_grants_granted_by ON premium_access_grants(granted_by);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

-- Enable RLS on new tables
ALTER TABLE premium_access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Create policies for premium_access_grants
CREATE POLICY "Admins can manage premium access grants"
  ON premium_access_grants
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "Users can view their own premium access grants"
  ON premium_access_grants
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for analytics_events
CREATE POLICY "Admins can manage analytics events"
  ON analytics_events
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Enable realtime for premium_access_grants
ALTER PUBLICATION supabase_realtime ADD TABLE premium_access_grants;
