import type { Metadata } from 'next';
import { Geist, Geist_Mono, Barlow_Condensed, Heebo } from 'next/font/google';
import ThemeProvider from '@/components/providers/ThemeProvider';
import { getLocale } from '@/lib/i18n/server';
import './globals.css';

const geistSans = Geist({ variable: '--font-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-mono', subsets: ['latin'] });
const barlowCondensed = Barlow_Condensed({
  variable: '--font-condensed',
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  display: 'swap',
});

// Hebrew: Geist and Barlow have no Hebrew glyphs, so Hebrew pages fill the
// same two font roles (--font-sans, --font-condensed) with Heebo.
const heeboSans = Heebo({
  variable: '--font-sans',
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});
const heeboCondensed = Heebo({
  variable: '--font-condensed',
  subsets: ['hebrew', 'latin'],
  weight: ['800', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'UNLOCKED — Prove Your Skills. Level Up.',
  description:
    'Film your physical feats, get peer-verified by the community, and climb the Skill Tree from beginner to legend.',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const fonts = locale === 'he'
    ? [heeboSans.variable, geistMono.variable, heeboCondensed.variable]
    : [geistSans.variable, geistMono.variable, barlowCondensed.variable];

  return (
    <html lang={locale} dir={locale === 'he' ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <body className={fonts.join(' ')}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
