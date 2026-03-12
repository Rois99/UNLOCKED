'use client';

import { X, Video, Upload } from 'lucide-react';
import type { Skill } from '@/types';
import Button from '@/components/ui/Button';

interface UploadProofModalProps {
  skill: Skill;
  onClose: () => void;
}

export default function UploadProofModal({ skill, onClose }: UploadProofModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal card */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 shadow-[0_25px_60px_rgba(0,0,0,0.6)]">
        {/* Gradient accent line */}
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />

        <div className="p-6">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">
                Unlock Skill
              </p>
              <h2 className="mt-1 text-xl font-black text-white">{skill.name}</h2>
              <p className="mt-1 text-sm text-slate-400">{skill.description}</p>
            </div>
            <button
              onClick={onClose}
              className="ml-4 mt-1 text-slate-500 transition-colors hover:text-white"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Drop zone */}
          <label className="group mb-5 flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-slate-700 p-8 text-center transition-colors hover:border-cyan-500/50 hover:bg-cyan-500/5">
            <input type="file" accept="video/*" className="sr-only" />
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 transition-colors group-hover:bg-cyan-500/20">
              <Video size={28} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Drop your proof video here</p>
              <p className="mt-0.5 text-xs text-slate-500">MP4, MOV, AVI — up to 500 MB</p>
            </div>
            <span className="text-xs text-cyan-400 underline underline-offset-2 hover:text-cyan-300">
              or browse files
            </span>
          </label>

          {/* XP info */}
          <div className="mb-5 rounded-lg border border-slate-700/50 bg-slate-800/50 p-3 text-xs text-slate-400">
            Your video is reviewed by community athletes. Earn{' '}
            <span className="font-bold text-amber-400">
              {skill.xp.toLocaleString()} XP
            </span>{' '}
            once your submission is approved.
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" size="md" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" size="md" className="flex-1">
              <Upload size={15} />
              Submit for Review
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
