import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function HeroSection() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-16 text-center">
      <GridBackground />
      <GlowBlobs />

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-4xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-400">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
          The Arena is Open
        </span>

        <h1 className="text-5xl font-black uppercase leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
          Prove Your Skills.
          <br />
          <span className="gradient-text">Level Up.</span>
        </h1>

        <p className="max-w-2xl text-lg leading-relaxed text-slate-400 sm:text-xl">
          Film your physical feats. Submit them to the community. Get
          peer-verified and climb the{' '}
          <span className="text-slate-200 font-medium">Skill Tree</span> — from
          beginner to legend. No shortcuts. No exceptions.
        </p>

        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
          <Link href="/login">
            <Button variant="primary" size="lg">
              Start Your Journey
              <ArrowRightIcon />
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button variant="outline" size="lg">
              See How It Works
            </Button>
          </Link>
        </div>

        <StatsBanner />
      </div>

      <BottomGradient />
    </section>
  );
}

function StatsBanner() {
  const stats = [
    { value: '12', label: 'Skill Tiers' },
    { value: '80+', label: 'Unlockable Skills' },
    { value: '100%', label: 'Peer Verified' },
  ];
  return (
    <div className="mt-12 flex items-center gap-0 divide-x divide-slate-800">
      {stats.map(({ value, label }) => (
        <div key={label} className="flex flex-col items-center px-8 first:pl-0 last:pr-0">
          <span className="text-3xl font-black text-cyan-400">{value}</span>
          <span className="text-xs font-medium uppercase tracking-widest text-slate-500">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function GridBackground() {
  return (
    <div
      className="absolute inset-0 opacity-[0.07]"
      style={{
        backgroundImage:
          'linear-gradient(rgba(34,211,238,1) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,1) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }}
    />
  );
}

function GlowBlobs() {
  return (
    <>
      <div className="pointer-events-none absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 -right-40 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
    </>
  );
}

function BottomGradient() {
  return (
    <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-slate-950 to-transparent" />
  );
}

function ArrowRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}
