import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <LockOpenIcon />
          <span className="text-xl font-black tracking-[0.2em] text-white uppercase">
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
          <Button variant="primary" size="sm">
            Enter the Arena
          </Button>
        </Link>
      </div>
    </header>
  );
}

function LockOpenIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
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
