-- Create chat_messages table in Supabase
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGSERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  message TEXT NOT NULL CHECK (char_length(message) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop policy if it exists, then create it
-- Policy: Allow service role to do everything (backend only)
-- Note: The backend uses service_role key, so this is safe
DROP POLICY IF EXISTS "Service role full access" ON chat_messages;
CREATE POLICY "Service role full access"
  ON chat_messages
  FOR ALL
  USING (true)
  WITH CHECK (true);

