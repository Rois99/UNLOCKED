/**
 * Browser Supabase client using @supabase/ssr (cookie-based session).
 * Use this in 'use client' components instead of lib/supabase.ts.
 */
'use client';

import { createBrowserClient } from '@supabase/ssr';

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
