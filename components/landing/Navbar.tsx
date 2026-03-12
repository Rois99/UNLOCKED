import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md">
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent" />

      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <BicepIcon className="text-cyan-400" />
          <span
            className="text-xl font-black uppercase tracking-[0.18em] text-white"
            style={{ fontFamily: 'var(--font-condensed)' }}
          >
            Unlocked
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-400 md:flex">
          <Link href="#how-it-works" className="hover:text-white transition-colors">
            How It Works
          </Link>
          <Link href="/skills" className="hover:text-white transition-colors">
            Skill Tree
          </Link>
        </nav>

        <Link href="/login">
          <Button variant="primary" size="sm">Enter the Arena</Button>
        </Link>
      </div>
    </header>
  );
}

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
      <path d="M5 20 L6 14 C5 11 6 8 9 6" />
      <path d="M9 6 C11 3 15 3 16 6 C17 9 16 12 15 14" />
      <path d="M15 14 L16 20" />
      <line x1="5" y1="20" x2="16" y2="20" />
      <path d="M7 14 C9 10 13 10 15 14" />
    </svg>
  );
}
