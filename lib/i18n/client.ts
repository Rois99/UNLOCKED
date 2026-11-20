'use client';

import { LOCALE_COOKIE, type Locale } from './dictionaries';

/** Mirrors the user's language into the cookie the server renders from. */
export function setLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}
