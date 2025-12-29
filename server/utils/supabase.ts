import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://rbmzrqsnsvzgoxzpynky.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJibXpycXNuc3Z6Z294enB5bmt5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQ0OTg2MywiZXhwIjoyMDc4MDI1ODYzfQ.2LWSL_-rKZuaRqugScUUWusupdD2a-z8SACQmcUuh9w';

let supabaseAdmin: SupabaseClient | null = null;
let supabasePublic: SupabaseClient | null = null;

try {
  if (supabaseUrl && supabaseServiceKey) {
    // Service role client for admin operations (backend only)
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log('[SUPABASE] Admin client initialized successfully');
  } else {
    console.warn('[SUPABASE] Missing Supabase credentials. Chat feature will not work.');
  }

  // Public client for frontend (if needed)
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_brXWCbp-cuyDM9JHWQgyww_xirMdnDH';
  if (supabaseUrl && publishableKey) {
    supabasePublic = createClient(supabaseUrl, publishableKey);
    console.log('[SUPABASE] Public client initialized successfully');
  }
} catch (error: any) {
  console.error('[SUPABASE] Error initializing Supabase clients:', error.message);
  console.warn('[SUPABASE] Chat feature will not work. Continuing without Supabase.');
}

export { supabaseAdmin, supabasePublic };

