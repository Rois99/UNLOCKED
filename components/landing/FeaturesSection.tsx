interface Step {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default function FeaturesSection() {
  const steps: Step[] = [
    {
      number: '01',
      icon: <CameraIcon />,
      title: 'Film Your Feat',
      description:
        'Record yourself completing a calisthenics skill — muscle-up, handstand, planche, or beyond. Raw footage. Real proof.',
    },
    {
      number: '02',
      icon: <UploadIcon />,
      title: 'Submit for Judgment',
      description:
        'Upload your clip to the arena. The community of verified athletes votes on whether your form meets the standard.',
    },
    {
      number: '03',
      icon: <ShieldCheckIcon />,
      title: 'Get Peer-Verified',
      description:
        'Earn enough votes and your submission is locked in. No self-reporting. No participation trophies. Only performance.',
    },
    {
      number: '04',
      icon: <UnlockIcon />,
      title: 'Unlock Your Tier',
      description:
        'Verified skills advance you up the Skill Tree, unlocking harder challenges and your place on the global leaderboard.',
    },
  ];

  return (
    <section id="how-it-works" className="px-6 py-24 bg-slate-950">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-cyan-500">
            The Process
          </span>
          <h2 className="mt-3 text-4xl font-black uppercase tracking-tight text-white sm:text-5xl">
            How It Works
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-400">
            Four steps stand between you and the top. There are no shortcuts —
            only sweat, proof, and community judgement.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <StepCard key={step.number} step={step} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({ step }: { step: Step }) {
  return (
    <div className="group relative flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-6 transition-all duration-300 card-glow-cyan hover:border-cyan-500/40 hover:bg-slate-900">
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 transition-colors group-hover:bg-cyan-500/20">
          {step.icon}
        </div>
        <span className="text-4xl font-black text-slate-800 transition-colors group-hover:text-slate-700">
          {step.number}
        </span>
      </div>
      <div>
        <h3 className="text-lg font-bold uppercase tracking-wide text-white">
          {step.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          {step.description}
        </p>
      </div>
    </div>
  );
}

function CameraIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}
function UploadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  );
}
function ShieldCheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
function UnlockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}
