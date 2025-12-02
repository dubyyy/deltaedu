-- Migration: Analytics Tables
-- Description: Create tables for tracking user analytics and events

-- Table for storing analytics events
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  properties JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for storing user analytics profiles
CREATE TABLE IF NOT EXISTS analytics_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  properties JSONB DEFAULT '{}'::jsonb,
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_properties ON analytics_events USING GIN(properties);

CREATE INDEX IF NOT EXISTS idx_analytics_users_user_id ON analytics_users(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_users_last_seen ON analytics_users(last_seen);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on analytics_users
CREATE TRIGGER update_analytics_users_updated_at
  BEFORE UPDATE ON analytics_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own analytics events
CREATE POLICY "Users can view their own analytics events"
  ON analytics_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can insert analytics events
CREATE POLICY "Service role can insert analytics events"
  ON analytics_events
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can view their own analytics profile
CREATE POLICY "Users can view their own analytics profile"
  ON analytics_users
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can manage analytics users
CREATE POLICY "Service role can manage analytics users"
  ON analytics_users
  FOR ALL
  USING (true);

-- Create materialized view for quick analytics aggregations
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_daily_summary AS
SELECT 
  user_id,
  DATE(timestamp) as date,
  COUNT(*) as total_events,
  COUNT(DISTINCT session_id) as total_sessions,
  COUNT(DISTINCT CASE WHEN event_name = 'note_uploaded' THEN id END) as notes_uploaded,
  COUNT(DISTINCT CASE WHEN event_name = 'quiz_completed' THEN id END) as quizzes_completed,
  COUNT(DISTINCT CASE WHEN event_name = 'tutor_message_sent' THEN id END) as tutor_messages,
  AVG(CASE WHEN event_name = 'quiz_completed' THEN (properties->>'percentage')::numeric END) as avg_quiz_score,
  SUM(CASE WHEN event_name = 'session_ended' THEN (properties->>'duration_minutes')::numeric ELSE 0 END) as total_study_minutes
FROM analytics_events
GROUP BY user_id, DATE(timestamp);

-- Create index on the materialized view
CREATE INDEX IF NOT EXISTS idx_analytics_daily_summary_user_date 
  ON analytics_daily_summary(user_id, date);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_analytics_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_daily_summary;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON analytics_events TO authenticated;
GRANT SELECT ON analytics_users TO authenticated;
GRANT SELECT ON analytics_daily_summary TO authenticated;

-- Comments for documentation
COMMENT ON TABLE analytics_events IS 'Stores all user analytics events and interactions';
COMMENT ON TABLE analytics_users IS 'Stores user analytics profiles and metadata';
COMMENT ON MATERIALIZED VIEW analytics_daily_summary IS 'Daily aggregated analytics for quick queries';
COMMENT ON COLUMN analytics_events.event_name IS 'Name of the analytics event (e.g., note_uploaded, quiz_completed)';
COMMENT ON COLUMN analytics_events.properties IS 'JSON object containing event-specific properties';
COMMENT ON COLUMN analytics_events.session_id IS 'Unique identifier for user session';
