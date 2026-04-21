import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Only create client if we have valid credentials
let supabaseInstance: SupabaseClient | null = null;

export const supabase = (() => {
  if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder')) {
    if (!supabaseInstance) {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    }
    return supabaseInstance;
  }
  // Return a mock client for build time
  return null as unknown as SupabaseClient;
})();

// Server-side client with service role for admin operations
export function createServerClient(): SupabaseClient {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseServiceKey || supabaseUrl.includes('placeholder')) {
    // Return mock for build time
    return null as unknown as SupabaseClient;
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
