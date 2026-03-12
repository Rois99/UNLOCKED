import { ChevronRight, Dumbbell, Zap, Layers } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Skill, SkillCategory, SkillState } from '@/types';
import SkillCard from './SkillCard';

interface SkillTrackProps {
  category: SkillCategory;
  skills: Skill[];
  getState: (skill: Skill) => SkillState;
  onSkillClick: (skill: Skill) => void;
}

interface TrackConfig {
  label: string;
  Icon: LucideIcon;
  accentText: string;
  accentBg: string;
  borderColor: string;
}

const TRACK_CONFIG: Partial<Record<SkillCategory, TrackConfig>> = {
  pull: {
    label: 'Pull Track',
    Icon: Dumbbell,
    accentText: 'text-cyan-400',
    accentBg: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/20',
  },
  push: {
    label: 'Push Track',
    Icon: Zap,
    accentText: 'text-violet-400',
    accentBg: 'bg-violet-500/10',
    borderColor: 'border-violet-500/20',
  },
  lever: {
    label: 'Lever Track',
    Icon: Layers,
    accentText: 'text-amber-400',
    accentBg: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
  },
};

export default function SkillTrack({ category, skills, getState, onSkillClick }: SkillTrackProps) {
  const config = TRACK_CONFIG[category];
  if (!config) return null;

  const { label, Icon, accentText, accentBg, borderColor } = config;

  const unlockedCount = skills.filter((s) => getState(s) === 'unlocked').length;

  return (
    <div className="space-y-4">
      {/* Track header */}
      <div className="flex items-center gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${accentBg} ${accentText}`}>
          <Icon size={16} />
        </div>
        <h3 className={`text-sm font-bold uppercase tracking-widest ${accentText}`}>
          {label}
        </h3>
        <div className={`flex-1 h-px border-t ${borderColor}`} />
        <span className="text-xs text-slate-500 tabular-nums">
          {unlockedCount}/{skills.length} unlocked
        </span>
      </div>

      {/* Skill cards row */}
      <div className="flex items-center gap-3 overflow-x-auto pb-3">
        {skills.map((skill, idx) => (
          <div key={skill.id} className="flex items-center gap-3">
            <SkillCard
              skill={skill}
              state={getState(skill)}
              onClick={() => onSkillClick(skill)}
            />
            {idx < skills.length - 1 && (
              <ChevronRight size={20} className="shrink-0 text-slate-700" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
