'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Network, User } from 'lucide-react';
import { MOCK_USER } from '@/data/mockData';

const NAV_LINKS = [
  { href: '/skills', label: 'Skill Tree', icon: Network },
  { href: '/profile', label: 'Profile', icon: User },
] as const;

export default function AppNavbar() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <UnlockIcon />
          <span className="text-lg font-black tracking-[0.2em] text-white uppercase">
            Unlocked
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User chip */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-xs font-black text-slate-950 shrink-0">
            {MOCK_USER.username.charAt(0).toUpperCase()}
          </div>
          <span className="hidden sm:block text-sm font-medium text-slate-300">
            {MOCK_USER.username}
          </span>
        </div>
      </div>
    </header>
  );
}

function UnlockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-cyan-400"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}
