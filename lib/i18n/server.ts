import { cookies, headers } from 'next/headers';
import { dictionaries, isLocale, LOCALE_COOKIE, type Locale } from './dictionaries';

/**
 * The language to render in. The user's saved choice (profiles.language) is
 * mirrored into a cookie at login and in settings; before login we follow the
 * browser, defaulting to Hebrew.
 */
export async function getLocale(): Promise<Locale> {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  const accept = (await headers()).get('accept-language') ?? '';
  return /^en\b/i.test(accept.trim()) ? 'en' : 'he';
}

export async function getI18n() {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}
