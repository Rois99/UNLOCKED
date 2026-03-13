/**
 * Server-only Supabase admin client.
 * Uses the service role key — bypasses RLS.
 *
 * ⚠️  NEVER import this file in 'use client' components or pages.
 *     Only use in: scripts, API routes, and Server Actions.
 */
import { createClient } from '@supabase/supabase-js';

const url            = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
