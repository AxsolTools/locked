import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://rbmzrqsnsvzgoxzpynky.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJibXpycXNuc3Z6Z294enB5bmt5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQ0OTg2MywiZXhwIjoyMDc4MDI1ODYzfQ.2LWSL_-rKZuaRqugScUUWusupdD2a-z8SACQmcUuh9w';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('[SUPABASE] Missing Supabase credentials. Chat feature will not work.');
}

// Service role client for admin operations (backend only)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Public client for frontend (if needed)
export const supabasePublic = createClient(
  supabaseUrl,
  process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_brXWCbp-cuyDM9JHWQgyww_xirMdnDH'
);

