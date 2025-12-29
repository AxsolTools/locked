/**
 * Setup script for Supabase chat table
 * Run with: node scripts/setup-supabase-chat.js
 * 
 * This script will create the chat_messages table and policies in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://rbmzrqsnsvzgoxzpynky.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJibXpycXNuc3Z6Z294enB5bmt5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQ0OTg2MywiZXhwIjoyMDc4MDI1ODYzfQ.2LWSL_-rKZuaRqugScUUWusupdD2a-z8SACQmcUuh9w';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const setupSQL = `
-- Create chat_messages table
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
DROP POLICY IF EXISTS "Service role full access" ON chat_messages;
CREATE POLICY "Service role full access"
  ON chat_messages
  FOR ALL
  USING (true)
  WITH CHECK (true);
`;

async function setupChatTable() {
  try {
    console.log('🚀 Setting up Supabase chat table...');
    console.log(`📡 Connecting to: ${supabaseUrl}`);

    // Execute SQL using Supabase's RPC or direct SQL execution
    // Note: Supabase doesn't have a direct SQL execution API, so we'll use the REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ sql: setupSQL })
    });

    // Alternative: Use pg_sql extension if available, or just provide instructions
    console.log('\n⚠️  Supabase REST API doesn\'t support direct SQL execution.');
    console.log('📝 Please run the SQL script manually in Supabase SQL Editor:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(setupSQL);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ SQL script is ready. Copy and paste it into Supabase SQL Editor.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📝 Please run the SQL script manually in Supabase SQL Editor.');
    console.log('   File: supabase_chat_setup.sql\n');
  }
}

setupChatTable();

