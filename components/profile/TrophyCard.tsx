import { CheckCircle2, Star } from 'lucide-react';
import type { Skill } from '@/types';

interface TrophyCardProps {
  skill: Skill;
}

const CATEGORY_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  pull:  { bg: 'bg-cyan-500/10',   text: 'text-cyan-400',   label: 'Pull'  },
  push:  { bg: 'bg-violet-500/10', text: 'text-violet-400', label: 'Push'  },
  lever: { bg: 'bg-amber-500/10',  text: 'text-amber-400',  label: 'Lever' },
};

export default function TrophyCard({ skill }: TrophyCardProps) {
  const style = CATEGORY_STYLE[skill.category] ?? {
    bg: 'bg-slate-700/30',
    text: 'text-slate-400',
    label: skill.category,
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-950/20 px-4 py-3 card-glow-emerald">
      {/* Category dot */}
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${style.bg} ${style.text}`}>
        <CheckCircle2 size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-white">{skill.name}</p>
        <p className={`text-[10px] font-semibold uppercase tracking-wide ${style.text}`}>
          {style.label}
        </p>
      </div>

      <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-amber-400">
        <Star size={11} fill="currentColor" />
        {skill.xp.toLocaleString()}
      </span>
    </div>
  );
}
