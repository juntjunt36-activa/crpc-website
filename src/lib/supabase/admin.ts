import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Service-role client. Bypasses Row Level Security.
// MUST only be imported from server-side code (API routes, server actions, RSC data fetches).
// The `server-only` import will cause a build error if leaked to the client bundle.
// TODO: re-add <Database> generic once `supabase gen types typescript` is wired up.
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    throw new Error(
      'createSupabaseAdminClient: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing',
    );
  }
  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
