'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarCheck, Network, TrendingUp, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { Dictionary } from '@/lib/i18n/dictionaries';

/** The four fixed areas from the screen spec: Today, My Path, Progress, Profile. */
const NAV_LINKS = [
  { href: '/today',    key: 'today',    icon: CalendarCheck },
  { href: '/skills',   key: 'path',     icon: Network       },
  { href: '/progress', key: 'progress', icon: TrendingUp    },
  { href: '/profile',  key: 'profile',  icon: User          },
] as const;

export default function AppNavbar({ labels }: { labels: Dictionary['nav'] }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // The signed-in user's name for the chip (their own profile row, allowed by RLS).
  const [username, setUsername] = useState<string>('');
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from('profiles').select('username').eq('id', user.id).single();
      if (data?.username) setUsername(data.username);
    });
  }, []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-md">
        {/* single bottom glow line instead of a border */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <BicepIcon className="text-cyan-400" />
            <span className="font-condensed text-xl font-black uppercase tracking-[0.18em] text-white"
              style={{ fontFamily: 'var(--font-condensed)' }}>
              Unlocked
            </span>
          </Link>

          {/* Desktop nav — on phones the bottom bar takes over */}
          <nav className="hidden items-center gap-1 sm:flex">
            {NAV_LINKS.map(({ href, key, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150 ${
                  isActive(href)
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon size={15} />
                {labels[key]}
              </Link>
            ))}
          </nav>

          {/* User chip */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-xs font-black text-slate-950">
              {username.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:block text-sm font-medium text-slate-300">
              {username}
            </span>
          </div>
        </div>
      </header>

      {/* Mobile bottom bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-slate-800 bg-slate-950/95 backdrop-blur-md sm:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {NAV_LINKS.map(({ href, key, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${
              isActive(href) ? 'text-cyan-400' : 'text-slate-500'
            }`}
          >
            <Icon size={20} />
            {labels[key]}
          </Link>
        ))}
      </nav>
    </>
  );
}

/** Custom bicep / muscle SVG icon */
function BicepIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Upper-arm outer curve (shoulder → elbow) */}
      <path d="M5 20 L6 14 C5 11 6 8 9 6" />
      {/* Bicep peak (the muscle) */}
      <path d="M9 6 C11 3 15 3 16 6 C17 9 16 12 15 14" />
      {/* Forearm (elbow → wrist) */}
      <path d="M15 14 L16 20" />
      {/* Base / wrist bar */}
      <line x1="5" y1="20" x2="16" y2="20" />
      {/* Inner bicep definition line */}
      <path d="M7 14 C9 10 13 10 15 14" />
    </svg>
  );
}
