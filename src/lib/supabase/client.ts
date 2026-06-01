import { createBrowserClient } from '@supabase/ssr';

// TODO: re-add <Database> generic once `supabase gen types typescript` is wired up.
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
