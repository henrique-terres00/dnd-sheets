-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  characters JSONB DEFAULT '[]'::jsonb,
  rolls JSONB DEFAULT '[]'::jsonb,
  map_state JSONB DEFAULT '{}'::jsonb,
  active_players INTEGER DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_code ON sessions(code);
CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON sessions(updated_at);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (read/write sessions)
CREATE POLICY "Public can view sessions" ON sessions
  FOR SELECT USING (true);

CREATE POLICY "Public can insert sessions" ON sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update sessions" ON sessions
  FOR UPDATE USING (true);

CREATE POLICY "Public can delete sessions" ON sessions
  FOR DELETE USING (true);

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
