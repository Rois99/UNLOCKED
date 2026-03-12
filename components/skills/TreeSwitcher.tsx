'use client';

import type { TreeType } from '@/types';

interface TreeSwitcherProps {
  value: TreeType;
  onChange: (type: TreeType) => void;
}

const OPTIONS: { value: TreeType; label: string }[] = [
  { value: 'calisthenics', label: 'Calisthenics' },
  { value: 'gym',          label: 'Gym'          },
];

export default function TreeSwitcher({ value, onChange }: TreeSwitcherProps) {
  return (
    <div className="inline-flex rounded-xl bg-slate-900/80 p-1 gap-1">
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`
              px-7 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest
              transition-all duration-200
              ${active
                ? 'bg-slate-700 text-white shadow-[0_0_14px_rgba(34,211,238,0.15)]'
                : 'text-slate-500 hover:text-slate-300'
              }
            `}
            style={{ fontFamily: 'var(--font-condensed)' }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
