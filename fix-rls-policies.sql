-- Fix RLS policies for sessions table
-- First, drop all existing policies
DROP POLICY IF EXISTS "Public can view sessions" ON sessions;
DROP POLICY IF EXISTS "Public can insert sessions" ON sessions;
DROP POLICY IF EXISTS "Public can update sessions" ON sessions;
DROP POLICY IF EXISTS "Public can delete sessions" ON sessions;

-- Create new policies with proper conditions
CREATE POLICY "Public can view sessions" ON sessions
  FOR SELECT USING (true);

CREATE POLICY "Public can insert sessions" ON sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update sessions" ON sessions
  FOR UPDATE USING (true);

CREATE POLICY "Public can delete sessions" ON sessions
  FOR DELETE USING (true);

-- Verify policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'sessions';
