'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import Button from '@/components/ui/Button';
import AppNavbar from '@/components/app/AppNavbar';
import type { Dictionary } from '@/lib/i18n/dictionaries';

type FormData = {
  username?:         string | null;
  bio?:              string | null;
  location?:         string | null;
  instagram_handle?: string | null;
  gender?:           string | null;
  country?:          string | null;
  motivation_quote?: string | null;
  height_m?:         number | null;
  weight_kg?:        number | null;
};

interface Props {
  userId:      string;
  initialData: FormData;
  nav:         Dictionary['nav'];
  t:           Dictionary['editProfile'];
}

export default function EditProfileForm({ userId, initialData, nav, t }: Props) {
  const router  = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [form, setForm] = useState<FormData>(initialData);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const set = (field: keyof FormData, value: string) =>
    setForm((f) => ({ ...f, [field]: value || null }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        username:         form.username,
        bio:              form.bio,
        location:         form.location,
        instagram_handle: form.instagram_handle,
        gender:           form.gender,
        country:          form.country,
        motivation_quote: form.motivation_quote,
        height_m:         form.height_m ? Number(form.height_m) : null,
        weight_kg:        form.weight_kg ? Number(form.weight_kg) : null,
      })
      .eq('id', userId);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    router.push('/profile');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <AppNavbar labels={nav} />

      <main className="mx-auto max-w-lg px-6 pt-28 pb-20">
        <Link
          href="/profile"
          className="mb-6 flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-slate-300"
        >
          <ArrowLeft size={13} className="rtl:rotate-180" />
          {t.back}
        </Link>

        <h1 className="mb-8 text-3xl font-black uppercase tracking-tight text-white">
          {t.title}
        </h1>

        {error && (
          <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label={t.username}>
            <input
              type="text"
              value={form.username ?? ''}
              onChange={(e) => set('username', e.target.value)}
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label={t.height}>
              <input
                type="number"
                step="0.01"
                min="1"
                max="2.5"
                value={form.height_m ?? ''}
                onChange={(e) => set('height_m', e.target.value)}
                className={inputCls}
                placeholder="e.g. 1.88"
              />
            </Field>
            <Field label={t.weight}>
              <input
                type="number"
                step="0.1"
                min="30"
                max="300"
                value={form.weight_kg ?? ''}
                onChange={(e) => set('weight_kg', e.target.value)}
                className={inputCls}
                placeholder="e.g. 90"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label={t.gender}>
              <select
                value={form.gender ?? ''}
                onChange={(e) => set('gender', e.target.value)}
                className={inputCls}
              >
                <option value="">{t.select}</option>
                <option value="male">{t.male}</option>
                <option value="female">{t.female}</option>
                <option value="other">{t.other}</option>
                <option value="prefer_not">{t.preferNot}</option>
              </select>
            </Field>
            <Field label={t.country}>
              <input
                type="text"
                value={form.country ?? ''}
                onChange={(e) => set('country', e.target.value)}
                className={inputCls}
                placeholder={t.countryPh}
              />
            </Field>
          </div>

          <Field label={t.location}>
            <input
              type="text"
              value={form.location ?? ''}
              onChange={(e) => set('location', e.target.value)}
              className={inputCls}
              placeholder={t.locationPh}
            />
          </Field>

          <Field label={t.instagram}>
            <div className="relative">
              <span className="absolute start-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-500">@</span>
              <input
                type="text"
                value={(form.instagram_handle ?? '').replace(/^@/, '')}
                onChange={(e) => set('instagram_handle', e.target.value.replace(/^@/, ''))}
                className={`${inputCls} ps-8`}
                placeholder="yourhandle"
              />
            </div>
          </Field>

          <Field label={t.bio}>
            <textarea
              rows={3}
              value={form.bio ?? ''}
              onChange={(e) => set('bio', e.target.value)}
              className={`${inputCls} resize-none`}
              placeholder={t.bioPh}
            />
          </Field>

          <Field label={t.motivation}>
            <textarea
              rows={2}
              value={form.motivation_quote ?? ''}
              onChange={(e) => set('motivation_quote', e.target.value)}
              className={`${inputCls} resize-none`}
              placeholder={t.motivationPh}
            />
          </Field>

          <Button
            variant="primary"
            size="md"
            type="submit"
            className="mt-2 flex w-full items-center justify-center gap-2"
            disabled={saving}
          >
            <Save size={14} />
            {saving ? t.saving : t.save}
          </Button>
        </form>
      </main>
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 transition-all focus:border-cyan-500/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/20';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </label>
      {children}
    </div>
  );
}
