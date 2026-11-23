import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from './supabase-server';

/**
 * The signed-in user's id, or null.
 *
 * Uses getClaims(): the session token's signature is verified locally against
 * the project's published ES256 key, so there is no round trip to the auth
 * server on every page (getUser() made one, to Seoul, each time). Cached per
 * request, so a page and its server actions check once.
 */
export const getUserId = cache(async (): Promise<string | null> => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  return typeof sub === 'string' ? sub : null;
});

/** The signed-in user's id; sends anyone signed out to the login page. */
export async function requireUserId(): Promise<string> {
  const id = await getUserId();
  if (!id) redirect('/login');
  return id;
}
