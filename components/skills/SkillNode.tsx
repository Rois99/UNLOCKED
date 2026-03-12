import { CheckCircle2, Lock, Plus } from 'lucide-react';
import type { Skill, SkillState } from '@/types';

interface SkillNodeProps {
  skill: Skill;
  state: SkillState;
  onClick?: () => void;
}

const STATE_STYLES: Record<SkillState, {
  circle: string;
  icon: typeof CheckCircle2;
  iconClass: string;
  label: string;
}> = {
  unlocked: {
    circle: 'bg-emerald-500/20 glow-emerald',
    icon: CheckCircle2,
    iconClass: 'text-emerald-400',
    label: 'text-emerald-300',
  },
  available: {
    circle: 'bg-cyan-500/10 glow-cyan glow-cyan-hover cursor-pointer',
    icon: Plus,
    iconClass: 'text-cyan-400',
    label: 'text-slate-200',
  },
  locked: {
    circle: 'bg-slate-800/60 opacity-40 cursor-not-allowed',
    icon: Lock,
    iconClass: 'text-slate-600',
    label: 'text-slate-600',
  },
};

export default function SkillNode({ skill, state, onClick }: SkillNodeProps) {
  const s = STATE_STYLES[state];
  const Icon = s.icon;

  return (
    <button
      onClick={state === 'available' ? onClick : undefined}
      disabled={state === 'locked'}
      aria-label={skill.name}
      className="group flex flex-col items-center gap-2 focus:outline-none"
    >
      {/* Circle */}
      <div
        className={`
          flex h-16 w-16 items-center justify-center rounded-full
          transition-all duration-300
          ${s.circle}
        `}
      >
        <Icon size={24} className={s.iconClass} />
      </div>

      {/* Label */}
      <span
        className={`
          w-24 text-center text-[10px] font-bold uppercase leading-tight tracking-wide
          ${s.label}
        `}
        style={{ fontFamily: 'var(--font-condensed)' }}
      >
        {skill.name}
      </span>
    </button>
  );
}
