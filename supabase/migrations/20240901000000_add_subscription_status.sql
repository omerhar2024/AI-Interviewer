-- Add status field to subscriptions table
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Create function to handle subscription cancellation
CREATE OR REPLACE FUNCTION handle_subscription_cancellation()
RETURNS TRIGGER AS $$
BEGIN
  -- When a subscription is canceled, update the status
  IF NEW.status = 'canceled' AND OLD.status = 'active' THEN
    -- Record is already updated with 'canceled' status
    -- We'll keep the current end_date so user maintains access until then
    
    -- Could add notification logic here if needed
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for subscription cancellation
DROP TRIGGER IF EXISTS on_subscription_cancel ON subscriptions;
CREATE TRIGGER on_subscription_cancel
  AFTER UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION handle_subscription_cancellation();

-- Create function to automatically downgrade expired subscriptions
CREATE OR REPLACE FUNCTION check_expired_subscriptions()
RETURNS void AS $$
BEGIN
  -- Find canceled subscriptions that have reached their end date
  UPDATE subscriptions
  SET 
    plan_type = 'free',
    status = 'active',
    end_date = NULL
  WHERE 
    status = 'canceled' AND 
    end_date < NOW();
    
  -- Could add notification logic here
END;
$$ LANGUAGE plpgsql;

-- Create a cron job to run this function daily (requires pg_cron extension)
-- This would need to be run by an administrator with appropriate permissions
-- COMMENT OUT if pg_cron is not available
-- SELECT cron.schedule('0 0 * * *', 'SELECT check_expired_subscriptions();');
