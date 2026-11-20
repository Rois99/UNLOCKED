import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import EditProfileForm from './EditProfileForm';
import { getI18n } from '@/lib/i18n/server';

export const dynamic  = 'force-dynamic';
export const metadata = { title: 'UNLOCKED' };

export default async function EditProfilePage() {
  const serverClient = await createSupabaseServerClient();
  const { data: { user } } = await serverClient.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('username, bio, location, instagram_handle, gender, country, motivation_quote, height_m, weight_kg')
    .eq('id', user.id)
    .single();

  const { t } = await getI18n();
  return <EditProfileForm userId={user.id} initialData={profile ?? {}} nav={t.nav} t={t.editProfile} />;
}
