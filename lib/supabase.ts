/**
 * Browser-safe Supabase client.
 * Uses the public anon key — safe to ship to the client.
 * Import this in 'use client' components and pages.
 */
import { createClient } from '@supabase/supabase-js';

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);
