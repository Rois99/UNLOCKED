import { getI18n } from '@/lib/i18n/server';
import RegisterForm from './RegisterForm';

export const metadata = { title: 'UNLOCKED' };

export default async function RegisterPage() {
  const { locale, t } = await getI18n();
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <RegisterForm initialLocale={locale} t={t.register} languages={{ he: t.settingsPage.hebrew, en: t.settingsPage.english }} />
    </div>
  );
}
